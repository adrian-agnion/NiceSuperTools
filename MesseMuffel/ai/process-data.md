# MesseMuffel

Eingabe: MesseMuffel/data.json
Ausgabe: MesseMuffel/data-processed.json

Baue ein Script, das das Folgende tut:

- Lese die Eingabedatei
- Für jeden Tag in den Monaten der Eingabedatei ermittle einen Wert `populated` (höher hat Priorität):
    - 0: nichts, kein Event (nichts zwischen `periodStart` und `periodEnd`)
    - 1: ein Event registriert (zumindest ein Eintrag zwischen `periodStart` und `periodEnd`)
    - 2: ein Event mit `isLargeEvent` (=true)
    - 3: ein Event mit `isLargeEvent` und `numberOfVisitors` größer 5000
    - 4: ein Event mit `isLargeEvent` und `numberOfVisitors` größer 10000
- Schreibe die Ausgabedatei  
  Für jeden Tag im Format "YYYY-MM-DD", als Key, aufsteigend
  Schreibe den Wert/value `populated`, wie oben ermittelt.