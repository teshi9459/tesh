# Tesh Bot

Roleplaymanagment & Tool Bot by teshi9459

---

| Modul               | Status | Info                                                                                                                  |
| ------------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| [Words](#words)     | ✅     | Tool zum finden von Roleplayern die zu wenig Wörter pro Nachricht schreiben                                           |
| [Tickets](#tickets) | ⚠      | Ticketsystem für die Abgabe von Charactern, Support anliegen oder Bewerbungen `Texte speichern aktuell eingeschränkt` |
| [Yurest](#yurest)   | 🔄     | Sozialmedia für Roleplay                                                                                              |

✅ - working ⚠ - bugs found ❌- not working 🔄 - in progress

---

# Words

Words ist ein Modul welches in ausgewählten Channeln auf die Anzahl der Wörter in einer Nachricht achtet. Die Wörter werden durch Leerzeichen definiert.

## How to Setup Words?

- Führe `/words setup` aus und gebe bei `channel` ein Channel an, in dem die Warnungen geschickt werden können.
- Nun solltest du die [Roleplay-Channel registrieren](#channel).
- Nun musst du nur noch das Modul aktivieren was du mit dem Command `/words toggle true` machst. Zum deaktivieren am ende des Commands einfach statt `true` `flase` auswählen.

Am Anfang ist der Trigger Bereich auf 2-10 Wörter (2 als min. um emotes und Pings zu ignorieren) gestellt und die Benachrichtigung im Channel deaktiviert.
Solltest du das ändern wollen benutze folgende Commands:

`/words trigger` `min` `max` ▷ ändert die Trigger, max - 1 wird getriggert, wenn max erreicht wird passiert nichts.

`/words warning` `toggle` ▷ `toggle` auf `True` setzen um in Channel warnungen zu aktivieren. `False` zum deaktivieren.

`/words channel` `channel` ▷ ändert den Log-Channel

# Tickets

Tesh stellt ein Ticket-System zur verfügung, welches durch Tickets durch Ticket-Pannels erställen lässt, welche Personalisiert werden können. Zudem wird der Verlauf des Tickets als Text datei in Discord gesichert.

## How to Setup Tickets?

- Führe `/words setup` aus gebe bei `channel` einen Channel an wo alle Ticket verläufe gespeichert werden sollen und bei `abnehmer` die Rolle die befugt ist Steckbriefe zu bearbeiten.

Pannel:

- erstelle ein Pannel mit `/ticket pannel` `type` `info` `category`

1. `type` ▷ wähle eine der Kategorien, bei Support oder Bewerbung kann das Ticket öffentlich gemacht werden (für alle User sichtbar). Ansonsten ändern sich nur die Texte in der ersten Nachricht im Ticket.
2. `info` der hier eingegebene Text ist dann im erstellten Pannel zu lesen.
3. `category` Hier wähle die Channel-Kategorie in der neue Ticket-Channel erstellt werden sollen.

Und fertig ist das Pannel.

Tickets:
