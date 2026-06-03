# ch-pflege-jobs

Ein kleines Werkzeug, das automatisch offene Stellen für **Dipl. Pflegefachmann/-frau in der Schweiz** sammelt – aus mehreren Quellen, sauber zusammengeführt, ohne Duplikate, als Excel/CSV und als klickbares Dashboard.

## Was es macht

Das Tool fragt zwei Quellen ab und führt die Treffer zusammen:

Erstens **job-room.ch**, das offizielle Stellenportal des Bundes (SECO / Arbeit.swiss). Das ist die wichtigste Quelle, weil viele Pflegeberufe der Stellenmeldepflicht unterliegen und dort zuerst – fünf Arbeitstage exklusiv – erscheinen, bevor sie woanders inseriert werden dürfen. Der Zugriff ist legal, kostenlos und braucht keinen Login.

Zweitens **JobSpy** (Open Source), das zusätzlich von Indeed.ch, LinkedIn und Google Jobs zieht und so privatwirtschaftliche Stellen ergänzt. Diese Quelle ist optional.

Das Ergebnis landet im Ordner `output`: eine Excel-Datei, eine CSV-Datei und ein `dashboard.html`, das du einfach per Doppelklick im Browser öffnest und nach Ort, Kanton oder Stichwort filtern kannst.

## Einmalige Einrichtung

Du brauchst Python (ab Version 3.10). Öffne eine Eingabeaufforderung in diesem Ordner und installiere die Abhängigkeiten:

```
pip install -r requirements.txt
```

Falls du JobSpy nicht möchtest, kannst du das weglassen – das Tool läuft dann nur mit job-room.ch weiter.

## Starten

```
python run.py
```

Nach dem Lauf öffnest du `output/dashboard.html` im Browser.

## Suche anpassen

Alle Einstellungen stehen oben in `run.py` im Block `CONFIG`. Dort kannst du zum Beispiel:

- die Suchbegriffe ändern (`keywords`),
- auf bestimmte Kantone einschränken (`cantons`, z. B. `["ZH", "BE"]`),
- JobSpy ein- oder ausschalten (`use_jobspy`),
- den Zeitraum einstellen (nur Stellen der letzten N Tage).

## Täglicher Auto-Lauf (Windows-Aufgabenplaner)

Damit das Tool jeden Morgen automatisch läuft, richtest du eine geplante Aufgabe ein. Führe dazu einmalig in einer Eingabeaufforderung (als Administrator) diesen Befehl aus – er startet das Tool täglich um 07:00 Uhr:

```
schtasks /Create /SC DAILY /ST 07:00 /TN "PflegeJobs" /TR "Z:\Claude\Projects\Github\ch-pflege-jobs\run_daily.bat"
```

Jeder Lauf aktualisiert die Excel-Datei und das Dashboard und schreibt ein Protokoll nach `output/log.txt`. Zum Entfernen: `schtasks /Delete /TN "PflegeJobs" /F`.

## Projektgedächtnis

Im Ordner liegen `project_goal.md`, `architecture.md`, `decision_log.md`, `task_board.md`, `runbook.md`, `risks_and_constraints.md` und `learnings.md`. Sie dokumentieren Ziel, Aufbau und Entscheidungen, damit der Kontext über Sessions hinweg erhalten bleibt.

## Rechtlicher Hinweis

job-room.ch ist eine öffentliche Behörden-Quelle und ausdrücklich zum Stellensuchen da. JobSpy greift auf öffentlich sichtbare Inserate zu; nutze es maßvoll (Standard: wenige Treffer pro Portal, Pausen zwischen Anfragen), um die Nutzungsbedingungen der Portale zu respektieren. Das Tool ist für deine persönliche Stellensuche gedacht.
