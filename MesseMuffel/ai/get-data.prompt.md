Ziel ist es, relevante Daten bezüglich Messen in Städten abzugreifen um abzuschätzen, in welchen Zeiträumen in der Stadt außerhalb von Messezeiten wenig Betrieb ist und daher Hotelpreise eher günstig sind.

Es soll ein Script `get-data.py` erstellt werden.
Dieses erzeugt eine Datei `data.json`.

Im Script wird das aktuelle Datum ermittelt, um Web-Requests zu erstellen.

Städte: Köln
Zeitraum: Aktueller Monat bis Ende 2027.

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

Bei Unklarheiten kann der folgende Bereich "Misc" genutzt werden.

# Misc