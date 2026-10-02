#!/usr/bin/env python3
"""Verdichtet die Messetermine aus data.json zu einer Tages-Belegungskarte.

Für jeden Tag der Monate der Eingabedatei wird ein Wert `populated`
ermittelt (höher hat Priorität):

    0: kein Event
    1: mindestens ein Event
    2: ein Event mit isLargeEvent
    3: ein Event mit isLargeEvent und numberOfVisitors > 5000
    4: ein Event mit isLargeEvent und numberOfVisitors > 10000

Ergebnis: data-processed.json, Objekt mit Tagen im Format "YYYY-MM-DD"
als Key (aufsteigend) und `populated` als Wert.
"""

import json
from calendar import monthrange
from datetime import date, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
INPUT_FILE = BASE_DIR / "data.json"
OUTPUT_FILE = BASE_DIR / "data-processed.json"


def event_level(event):
    """Liefert den populated-Wert eines einzelnen Events (1 bis 4)."""
    if not event.get("isLargeEvent"):
        return 1
    visitors = event.get("numberOfVisitors")
    if visitors is not None:
        if visitors > 10000:
            return 4
        if visitors > 5000:
            return 3
    return 2


def covered_months(events):
    """Liefert (Jahr, Monat) vom frühesten Start- bis zum spätesten Endmonat."""
    starts = [date.fromisoformat(e["periodStart"]) for e in events]
    ends = [date.fromisoformat(e["periodEnd"]) for e in events]
    first = min(starts).replace(day=1)
    last = max(ends).replace(day=1)
    months = []
    current = first
    while current <= last:
        months.append((current.year, current.month))
        year, month = divmod(current.year * 12 + current.month, 12)
        current = date(year, month + 1, 1)
    return months


def main():
    events = json.loads(INPUT_FILE.read_text(encoding="utf-8"))

    populated = {}
    for year, month in covered_months(events):
        for day in range(1, monthrange(year, month)[1] + 1):
            populated[date(year, month, day).isoformat()] = 0

    for event in events:
        level = event_level(event)
        day = date.fromisoformat(event["periodStart"])
        end = date.fromisoformat(event["periodEnd"])
        while day <= end:
            key = day.isoformat()
            if key in populated and level > populated[key]:
                populated[key] = level
            day += timedelta(days=1)

    OUTPUT_FILE.write_text(
        json.dumps(populated, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8")
    print(f"{len(populated)} Tage in {OUTPUT_FILE} geschrieben.")


if __name__ == "__main__":
    main()
