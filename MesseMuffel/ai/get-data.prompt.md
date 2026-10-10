Ziel ist es, relevante Daten bezüglich Messen in Städten abzugreifen um abzuschätzen, in welchen Zeiträumen in der Stadt außerhalb von Messezeiten wenig Betrieb ist und daher Hotelpreise eher günstig sind.

Es soll ein Script `get-data.py` erstellt werden.
Eingabeparameter ist eine Stadt-ID.
Zu verwendene Parameter sind in `data-config.json` unter der Variable `auma`zu finden, jeweils mit StadtID in `id`.
Es soll jeweis eine Datei `data-[StadtID].auma.json` erzeugt werden.

Im Script wird das aktuelle Datum als Startmonat ermittelt, um Web-Requests zu erstellen.
Ende ist Dezember des aktuellen Jahres, falls gerade Januar bis April ist.
Ende ist Dezember des Folgejahres, falls gerade Mai bis Dezember ist.

Die folgenden Ressourcen sollen verwendet werden.

## AUMA Suche

Beispiel URL:

https://www.auma.de/messen-finden/?intFilterYearFrom=2026&intFilterYearTo=2026&intFilterMonthFrom=11&intFilterMonthTo=11&strLanguage=de&intSort=1&intSeitenZahl=1&strFilterCity=K%C3%B6ln

Liefert:

- Datum (eigentlich Zeitraum)
- Titel (ebensächlich)
- Stadt (Köln)

## AUMA Details

Beispiel URL (geliefert von AUMA Suche):

https://www.auma.de/messen-finden/details/?tfd=koln_art-cologne_229254

Liefert:

- Aussteller (z.B. 194)
- Besucher (z.B. 46.809)

## koelnmesse

URL: https://www.koelnmesse.de/aktuelle-termine/alle-messen/

Liefert:

- Titel (im HTML `sort_fairname`)
- Date (im HTML `date`, eigentlich Zeitraum z.B. `23.10. - 25.10.2026`, nur String vor Komma relevant)
- Stadt (im HTML `date`, Wert z.B. `15.10. - 16.10.2026, Köln`, nur String `Köln` nach Komma relevant)

## Ergebnis

Liste mit Sub-Elementen je Element:

- periodStart (date, aus date-Einträgen)
- periodEnd (date, aus date-Einträgen)
- title (string, aus Titel-Einträgen)
- numberOfVisitors (integer, aus Besucer-Einträgen)
- numberOfPresenters (integer, aus Aussteller-Einträgen)
- isLargeEvent (boolean, falls aus AUMA Ergebnissen)
- source (string, URL der Quelle)

Bei Unklarheiten kann der folgende Bereich "Misc" für Notizen und Nachfragen genutzt werden.

# Misc