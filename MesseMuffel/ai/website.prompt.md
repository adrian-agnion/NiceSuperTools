# MesseMuffel

Generiert werden soll exakt eine HTML Datei `index.htm`, die JS und CSS verwendet, keine weiteren Dateien.  
Root-Verzeichnis ist im Folgenden eines unter dem, in der diese Datei liegt.

Für Layout soll eine Datei eingebunden (aber nicht editiert) werden: `../css/style.css`.

## Messetermine

Sub-Überschrift: "Messetermine".

Ziel ist es, eine dynamische Liste mit Links zu kommenden Messeterminen in Köln zu erstellen, für den aktuellen und die folgenden 5 Monate.

Linkziele sind:

- https://www.auma.de/messen-finden/?intFilterYearFrom=2026&intFilterYearTo=2026&intFilterMonthFrom=11&intFilterMonthTo=11&strLanguage=de&intSort=1&intSeitenZahl=1&strFilterCity=K%C3%B6ln
- https://www.koelnmesse.de/aktuelle-termine/alle-messen/ (nicht möglich: mit aktivierter Option "Nur in Köln" in der erweiterten Suche)

koelnmesse.de soll zuerst in einer Linkliste erscheinen als statischer Link.

Danach ein Listen-Items mit Link-Titeln wie "AUMA Messen Oktober 2026".
Keine weiteren Sätze oder Informationen.

Im Formular soll der aktuelle Monat im aktuellen Jahr selektiert sein und Links zu diesem und den 5 Folgemonaten angezeigt werden.
Für den Standort ist der Default "Köln" gesetzt.

## Terminvorschläge

Sub-Überschrift: "Terminvorschläge".

- Verwende die Daten in `data-processed.json`, sie sollten sowohl lokal als auch online geladen werden können
- Verarbeite jede Kalenderwoche (Deutschland), die dort voll abgebildet ist
- Für alle Tage Montag bis Freitag
- Trenne (ähnlich Zeilenumbruch) nach Monaten und schreibe den jeweiligen Monat als kleine Überschrift
- Mache für jeden Wochentag (Mo-Fr) ein Kästchen/Eintrag/ähnliches
- Je nach Wert des Datums fülle das Kästchen farblich aus (hoher Wert=rot, mittel=gelb, klein=grün)
- Mache jeweils einen (target="_blank") Link zu `https://www.booking.com/searchresults.de.html?ss=Im+Mediapark+5&latitude=50.9487485&longitude=6.943942&checkin=2026-10-09&checkout=2026-10-10&group_adults=1`, wobei das Checkout-Datum der aktuelle Tag sein soll und das Checkin-Datum einen Tag davor.