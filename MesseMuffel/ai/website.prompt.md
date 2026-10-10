# MesseMuffel

## Tech

Generiert werden soll exakt eine HTML Datei `index.htm`, die JS und CSS verwendet, keine weiteren Dateien.  
Root-Verzeichnis ist im Folgenden eines unter dem, in der diese Datei liegt.  
Für Layout soll eine Datei eingebunden (aber nicht editiert) werden: `../css/style.css`.

## Daten

Es sollen Termine und Links für verschiedene Standorte ausgegeben werden. Diese sollen über die verschiedenen Anzeigebereiche synchron gehalten werden:

- Jahr
- Monat
- Stadt
- Ort (i.d.R. Name/Straße/Hausnummer)

Erstes Laden (kein Cache vorhanden oder Neuladen der Seite):

- Jahr: Aktuelles Jahr
- Monat: Aktueller Monat
- Stadt: Köln
- Ort: Startplatz

Daten:

- `data-config.json`
- `data-processed.json`

## Info

Generiere einen kurzen, freundlichen Infotext. Sätze mit Zeilenumbruch getrennt, damit der Seiteninhalt schmal bleibt. Inhalt in etwa: Vorschläge für Terminfindung Treffen in Köln. Abseits von Messen sind Übernachtungen in Hotels günstiger. Bei Klick auf Tag werden Übernachtungspreise angezeigt.

## Formular

Kleines Formular (ohne Überschrift) mit:

- Stadt (Auswahl aus Config)
- Monat (12 Monate)
- Jahr (aktuell und folgende 3 Jahre)

## Terminvorschläge

Kalenderansicht (ohne Überschrift)

- Verwende die Daten für den aktuell gewählten Ort, falls verfügbar
- Zeige jede Woche (Deutschland), vom gewählten Monat im gewählten Jahr und dem Folgemonat
- Für alle Tage Montag bis Freitag, Samstag und Sonntag leicht abgesetzt
- Für jeden Monat, zeige nur die Tage, die tatsächlich darin liegen. Also z.b. kein "Fr. 1.10." im September anzeigen.
- Jeder Monat sollte mindestens 5 Zeilen haben. Füge ggf. eine Leerzeile ein. Das macht das Navigieren/Klicken in der Monats-Pfeil-Navigation angenehmer.
- Trenne (ähnlich Zeilenumbruch) nach Monaten und schreibe den jeweiligen Monat als kleine Überschrift
- Mache für jeden Tag (Mo-Fr,Sa-So) ein Kästchen/Eintrag/ähnliches
- Je nach Wert des Datums fülle das Kästchen farblich aus (hoher Wert=rot, mittel=gelb, klein=grün)
- Mache jeweils einen (target="_blank") Link zu `https://www.booking.com/searchresults.de.html?ss=Im+Mediapark+5&latitude=50.9487485&longitude=6.943942&checkin=2026-10-09&checkout=2026-10-10&group_adults=1`, wobei das Checkout-Datum der aktuelle Tag sein soll und das Checkin-Datum einen Tag davor; Adresse des aktuellen Ortes, Einzelemente der Adresse inkl. Ort können mit "+" getrennt werden.
- Mache über/unter dem Kalender Pfeile nach oben/unten zur Navigation zum verhergehenden bzw nächsten Monat.

## Einstellungen

- Auswahl "Bei Klick setze Check-In und Check-Out für:" "Anreise" (gesetzt), "Abreise" "Anreise und Abreise" - Die beiden Parameter checkin und checkout sollen in den Links bei Auswahl/Änderung entsprechend aktualisiert werden
- Ein Marker "Ich wünschte ich hätte ein Zimmer mit Balkon": Falls gesetzt, dann wird im Link ein Parameter "&nflt=roomfacility%3D17" hinzugefügt
- Sprache auswählen:Deutsch/Englisch (dies als Buttons oben auf der Seite mit DE/EN)

Bei Unklarheiten kann der folgende Bereich "Misc" für Notizen und Nachfragen genutzt werden.

# Misc



