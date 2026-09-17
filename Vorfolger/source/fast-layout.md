# JS-Layout

Sinn dieses Vorhabens ist ein schnell generiertes visuelles Layout ähnlich in Automic, allerdings schnell im Webbrowser.

Ziel ist die Generierung einer eigenständigen HTML Seite für den Browser, JS und CSS erlaubt, auch die Einbindung geeigneter externer Libraries/Frameworks.

Es soll ein Textfeld geben, in das eine List von Bezeichner-Paaren gepasted werden können (siehe Beispiel unten). Die Paare sind Vorgänger-Nachfolger-Beziehungen.
Sollten in einer Zeile mehrer als 2 Bezeichner stehen, werden nur die beiden letzten als Paar verwendet.

Unterhalb des Eingabefeldes soll ein Bereich sein, in dem die Bezeichner als grafische Knoten bzw. Bubbles dargestellt werden, jeder Bezeichner einmalig. Die Vorgänger-Nachfolger-Beziehungen werden als gerichtete Kanten bzw. Pfeile.

Die Anordnung soll ähnlich der in Automic sein, prinzipiell ein Raster, so dass jeder Knoten eine Spalte und eine Zeile hat und die sich ergebenen Zellen nicht doppelt belegt sind.

In der Darstellung wird automatisch ein Knoten "Start" eingefügt. Dieser wird mit allen Knoten verbunden, die keinen Vorgänger haben.

In der Darstellung wird automatisch ein Knoten "End" eingefügt. Alle Knoten, die keinen Nachfolger haben, werden mit diesem verbunden.

Sekundärziel ist ein Layout, so dass auch parallele Stränge visuell gut erfassbar/erkennbar sind.

## Beispiel Texteingabe

```
AUSPSX13	AUSPE002
AUSPE002	AUSA0068
AUSA0068	AUSR0068
AUSR0068	AUSA0069
AUSA0069	AUSR0069
AUSR0069	AUSN0031
AUSN0031	AUSN0032
AUSN0032	AUSN0033
AUSN0033	AUSN0034
AUSN0034	AUSA0070
AUSA0070	AUSR0070
AUSR0070	AUSA0071
AUSA0071	AUSR0071
AUSR0071	AUSN0035
AUSN0035	AUSN0036
AUSN0036	AUSN0037
AUSN0037	AUSN0038
AUSN0038	AUSA0067
AUSA0067	AUSR0067
AUSR0067	AUSN0043
AUSN0043	AUSA0072
AUSA0072	AUSR0072
AUSR0072	AUSN0051
AUSN0051	AUSPE016
AUSPE016	AUSN0052
AUSN0032	AUSU4E01
AUSN0034	AUSU4E02
AUSN0038	AUSU4E03
AUSPE002	AUSU4E04
```



# JS-Layout Version 2

Neue Datei: `js-layout-v2.html`

Hier die gleichen Vorgaben wie in der Version oben. Zusätzlich sollen Knoten noch selektiert und verschoben werden können. Optimalerweise ist eine Selektion mehrer Knoten möglich; typischerweise wird die Maus dabei gedrück, zu anderer Position bewegt, Maus losgelassen und mehrere Knoten sind zum anscließenden Verschieben selektiert.


































