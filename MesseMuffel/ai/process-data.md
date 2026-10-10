# MesseMuffel

Eingabe: MesseMuffel/data-[ID].auma.json
Ausgabe: MesseMuffel/data-processed.json

Baue ein Script, das das Folgende tut:

- Für jede Eingabedatei:
    - Hinweis: Es können mehrere Events parallel stattfinden.
    - Für jeden Tag in den Monaten der Eingabedatei ermittle einen Wert `populated` im Bereich [0, 4]:
        - Initialwert ist 0.
        - Für die gelesenen Events betrachte den Zeitraum zwischen `periodStart` und `periodEnd`.
        - Falls Besucherzahlen verfügbar sind, addiere die Besucherzahlen an diesem Tag.
        - Falls keine Besucherzahlen verfügbar sind, zähle diese Events.
        - Ermittle die max. Besucherzahlen für die aktuelle `ID`
        - Setze `populated`:
            - 0: Kein Event vorhanden
            - 1: mind. 10% von max. Besucherzahl
            - 2: mind. 30% von max. Besucherzahl
            - 3: mind. 60% von max. Besucherzahl
            - 4: mind. 90% von max. Besucherzahl
        - Aktualisiere 'populated':
            - Addiere die Anzahl der gezählten Events ohne Besucherzahlen. Maximaler Wert bleibt 4.
- Schreibe die Ausgabedatei  
  Für jede `ID` der Eingabedateien ein Element.  
  Für jeden Tag im Format "YYYY-MM-DD", als Key, aufsteigend  
  Schreibe den Wert/value `populated`, wie oben ermittelt.  
  Einträge mit Wert 0 kannst du auslassen.

Bei Unklarheiten kann der folgende Bereich "Misc" für Notizen und Nachfragen genutzt werden.

# Misc