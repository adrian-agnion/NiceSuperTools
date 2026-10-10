#!/usr/bin/env python3
"""Sammelt Messetermine in Köln vom aktuellen Monat bis Ende 2027.

Quellen:
- AUMA Messe-Finder (API + Detailseiten für Aussteller-/Besucherzahlen)
- koelnmesse.de "Alle Messen"

Ergebnis: data.json mit Einträgen der Form
    periodStart, periodEnd, title, numberOfVisitors, numberOfPresenters,
    isLargeEvent, source

Abrufe werden in cache/ zwischengespeichert; ist eine Quelle nicht
erreichbar, werden die Cache-Werte verwendet.
"""

import hashlib
import json
import re
import time
from calendar import monthrange
from datetime import date, datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

CITY = "Köln"
END_YEAR = 2027  # Zeitraum: aktueller Monat bis Ende 2027
PAGE_SIZE = 25  # Ergebnisse pro Seite der AUMA-Suche

AUMA_API = "https://www.auma.de/api/TradeFairData/getWebOverviewTradeFairData"
AUMA_API_COUNT = "https://www.auma.de/api/TradeFairData/getWebOverviewTradeFairDataCount"
AUMA_DETAILS = "https://www.auma.de/messen-finden/details/"
KOELNMESSE_OVERVIEW = "https://www.koelnmesse.de/aktuelle-termine/alle-messen/"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept-Language": "de",
}

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = BASE_DIR / "data.json"
CACHE_DIR = BASE_DIR / "cache"


def relevant_months(today):
    """Liefert (Jahr, Monat) vom aktuellen Monat bis Dezember END_YEAR."""
    start = today.year * 12 + today.month - 1
    month_count = END_YEAR * 12 + 12 - start
    return [((start + i) // 12, (start + i) % 12 + 1)
            for i in range(month_count)]


def parse_period(text):
    """Parst Zeiträume wie '05.11.-08.11.2026' oder '13.10. - 15.10.2026'.

    Liefert (start, end) als date oder None.
    """
    match = re.search(
        r"(\d{1,2})\.(\d{1,2})\.(?:\s*(\d{4}))?\s*-\s*(\d{1,2})\.(\d{1,2})\.(\d{4})",
        text,
    )
    if not match:
        return None
    day1, month1, year1, day2, month2, year2 = match.groups()
    year1 = int(year1) if year1 else int(year2)
    start = date(year1, int(month1), int(day1))
    end = date(int(year2), int(month2), int(day2))
    if start > end:  # Zeitraum über Jahreswechsel
        start = date(year1 - 1, int(month1), int(day1))
    return start, end


def parse_number(text):
    """Wandelt deutsche Zahlenformate wie '46.809' in int um, sonst None."""
    if not text:
        return None
    digits = re.sub(r"[^0-9]", "", text)
    return int(digits) if digits else None


def write_cache(cache_path, url, text):
    """Speichert eine Antwort im Cache und aktualisiert den Index."""
    CACHE_DIR.mkdir(exist_ok=True)
    cache_path.write_text(text, encoding="utf-8")
    index_path = CACHE_DIR / "index.json"
    index = {}
    if index_path.exists():
        try:
            index = json.loads(index_path.read_text(encoding="utf-8"))
        except ValueError:
            index = {}
    index[cache_path.name] = {
        "url": url,
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
    }
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2),
                          encoding="utf-8")


def fetch_text(session, url, params=None):
    """GET mit Wiederholungen und Backoff (Server limitiert Anfragen).

    Liefert den Antwort-Text; bei Fehlschlag den Cache-Wert, falls vorhanden.
    """
    full_url = requests.Request("GET", url, params=params).prepare().url
    cache_path = CACHE_DIR / (hashlib.sha256(full_url.encode()).hexdigest()
                              + ".txt")
    for attempt in range(5):
        try:
            response = session.get(url, params=params, timeout=30)
            if response.status_code == 429:
                raise requests.HTTPError("429 Too Many Requests",
                                         response=response)
            response.raise_for_status()
            write_cache(cache_path, full_url, response.text)
            return response.text
        except requests.RequestException as error:
            wait = 5 * (attempt + 1)
            print(f"Warnung: {full_url} fehlgeschlagen ({error}), "
                  f"neuer Versuch in {wait}s ({attempt + 1}/5)")
            time.sleep(wait)
    if cache_path.exists():
        print(f"Warnung: {full_url} nicht erreichbar – verwende Cache-Wert")
        return cache_path.read_text(encoding="utf-8")
    return None


def get_json(session, url, params):
    """GET mit JSON-Auswertung; liefert geparstes JSON oder None."""
    text = fetch_text(session, url, params)
    if text is None:
        return None
    try:
        return json.loads(text)
    except ValueError:
        print(f"Warnung: ungültiges JSON von {url}")
        return None


def fetch_auma_details(session, url_parameter):
    """Liefert (numberOfVisitors, numberOfPresenters) von einer Detailseite."""
    text = fetch_text(session, AUMA_DETAILS, {"tfd": url_parameter})
    if text is None:
        return None, None
    soup = BeautifulSoup(text, "html.parser")

    def statistic_value(accordion_id, key_prefix):
        accordion = soup.find(id=accordion_id)
        if not accordion:
            return None
        for row in accordion.select(".trade-fair-statistics-table__row--lvl-2"):
            key = row.select_one(".trade-fair-statistics-table__key")
            if not key or not key.get_text(strip=True).startswith(key_prefix):
                continue
            for item in row.select(".trade-fair-statistics-table__item"):
                if "trade-fair-statistics-table__key" not in (item.get("class") or []):
                    return parse_number(item.get_text(strip=True))
        return None

    visitors = statistic_value("collapseVisitors", "Besucher")
    presenters = statistic_value("collapseExhibitors", "Aussteller")
    return visitors, presenters


def fetch_auma(session, months):
    """Messen aus der AUMA-Suche (große Messen, inkl. Kennzahlen)."""
    events = []
    for year, month in months:
        params = {
            "intFilterYearFrom": year,
            "intFilterYearTo": year,
            "intFilterMonthFrom": month,
            "intFilterMonthTo": month,
            "strLanguage": "de",
            "strFilterCity": CITY,
        }
        count = get_json(session, AUMA_API_COUNT, params)
        if count is None:
            print(f"Warnung: keine AUMA-Daten für {year}-{month:02d}")
            continue
        pages = max(1, -(-int(count) // PAGE_SIZE))
        for page in range(1, pages + 1):
            data = get_json(session, AUMA_API,
                            {**params, "intSort": 1, "intSeitenZahl": page})
            if not data:
                continue
            time.sleep(1)  # Server schonen
            for item in data:
                period = parse_period(item.get("strTermin", ""))
                if not period:
                    continue
                print(f"AUMA {year}-{month:02d}: {item['strTitel']} – lade Details …")
                visitors, presenters = fetch_auma_details(
                    session, item["strUrlParameter"])
                time.sleep(1)  # Server schonen
                source = requests.Request(
                    "GET", AUMA_DETAILS,
                    params={"tfd": item["strUrlParameter"]}).prepare().url
                events.append({
                    "periodStart": period[0].isoformat(),
                    "periodEnd": period[1].isoformat(),
                    "title": item["strTitel"].strip(),
                    "numberOfVisitors": visitors,
                    "numberOfPresenters": presenters,
                    "isLargeEvent": True,
                    "source": source,
                })
    return events


def fetch_koelnmesse(session, window_start, window_end):
    """Messen aus der koelnmesse-Übersicht (nur Stadt Köln, ohne Kennzahlen)."""
    text = fetch_text(session, KOELNMESSE_OVERVIEW)
    if text is None:
        return []
    soup = BeautifulSoup(text, "html.parser")
    events = []
    for item in soup.select(".item"):
        name = item.select_one(".sort_fairname")
        date_entry = item.select_one(".date")
        if not name or not date_entry:
            continue
        date_part, _, city = date_entry.get_text(strip=True).partition(",")
        if city.strip() != CITY:
            continue
        period = parse_period(date_part)
        if not period:
            continue
        start, end = period
        if end < window_start or start > window_end:
            continue
        events.append({
            "periodStart": start.isoformat(),
            "periodEnd": end.isoformat(),
            "title": name.get_text(strip=True),
            "numberOfVisitors": None,
            "numberOfPresenters": None,
            "isLargeEvent": False,
            "source": KOELNMESSE_OVERVIEW,
        })
    return events


def main():
    today = date.today()
    months = relevant_months(today)
    window_start = date(months[0][0], months[0][1], 1)
    # letzter Tag des letzten relevanten Monats
    last_year, last_month = months[-1]
    window_end = date(last_year, last_month, monthrange(last_year, last_month)[1])

    session = requests.Session()
    session.headers.update(HEADERS)

    events = fetch_auma(session, months)
    events += fetch_koelnmesse(session, window_start, window_end)
    events.sort(key=lambda e: (e["periodStart"], e["title"]))

    OUTPUT_FILE.write_text(
        json.dumps(events, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(events)} Einträge in {OUTPUT_FILE} geschrieben.")


if __name__ == "__main__":
    main()
