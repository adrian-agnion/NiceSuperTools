#!/usr/bin/env python3
"""Verdichtet die Messedaten data-<ID>.auma.json zu Tages-Belegungswerten.

Für jede Stadt (ID) und jeden Tag wird ein Wert `populated` in [0, 4]
ermittelt:

- Besucherzahlen aller an dem Tag laufenden Events werden summiert
  (Events können parallel stattfinden).
- Die größte Tages-Besucherzahl der Stadt ist der Maßstab:
    1: mind. 10 % davon, 2: mind. 30 %, 3: mind. 60 %, 4: mind. 90 %
- Events ohne Besucherzahlen werden pro Tag gezählt und auf den Wert
  addiert (maximal 4).

Ergebnis: data-processed.json, Objekt mit einem Element je ID; darin
Tage im Format "YYYY-MM-DD" (aufsteigend) mit `populated`, Tage mit
Wert 0 entfallen.
"""

import json
from datetime import date, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
INPUT_PATTERN = "data-*.auma.json"
OUTPUT_FILE = BASE_DIR / "data-processed.json"

THRESHOLDS = [(0.90, 4), (0.60, 3), (0.30, 2), (0.10, 1)]


def visitor_level(day_visitors, max_visitors):
    """Stufe aus Tages-Besucherzahl relativ zum Stadt-Maximum."""
    if not max_visitors:
        return 0
    ratio = day_visitors / max_visitors
    for threshold, level in THRESHOLDS:
        if ratio >= threshold:
            return level
    return 0


def process_file(path):
    """Liefert {Tag: populated} für eine Eingabedatei (ohne 0-Werte)."""
    events = json.loads(path.read_text(encoding="utf-8"))
    visitors = {}   # date -> summierte Besucherzahlen
    uncounted = {}  # date -> Anzahl Events ohne Besucherzahlen
    for event in events:
        day = date.fromisoformat(event["periodStart"])
        end = date.fromisoformat(event["periodEnd"])
        number = event.get("numberOfVisitors")
        while day <= end:
            if number is None:
                uncounted[day] = uncounted.get(day, 0) + 1
            else:
                visitors[day] = visitors.get(day, 0) + number
            day += timedelta(days=1)

    max_visitors = max(visitors.values(), default=0)
    populated = {}
    for day in set(visitors) | set(uncounted):
        level = visitor_level(visitors.get(day, 0), max_visitors)
        level = min(4, level + uncounted.get(day, 0))
        if level:
            populated[day.isoformat()] = level
    return dict(sorted(populated.items()))


def main():
    result = {}
    for path in sorted(BASE_DIR.glob(INPUT_PATTERN)):
        city_id = path.name.removeprefix("data-").removesuffix(".auma.json")
        result[city_id] = process_file(path)
        print(f"{city_id}: {len(result[city_id])} Tage mit Events")

    OUTPUT_FILE.write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8")
    print(f"{len(result)} Städte in {OUTPUT_FILE} geschrieben.")


if __name__ == "__main__":
    main()
