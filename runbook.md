# Runbook

## Normaler Lauf
1. Eingabeaufforderung in diesem Ordner oeffnen.
2. python run.py
3. output/dashboard.html im Browser oeffnen.

## Erstinstallation
pip install -r requirements.txt   (Python >= 3.10)

## Auto-Lauf einrichten (taeglich 07:00)
schtasks /Create /SC DAILY /ST 07:00 /TN "PflegeJobs" /TR "Z:\Claude\Projects\Github\ch-pflege-jobs\run_daily.bat"
Entfernen: schtasks /Delete /TN "PflegeJobs" /F
Protokoll: output/log.txt

## Haeufige Probleme
- "Keine Stellen gefunden": Internet pruefen; ggf. keywords/onlineSince in run.py lockern.
- JobSpy-Fehler/Rate-Limit: use_jobspy = False setzen, job-room laeuft weiter.
- job-room 400 Bad Request: Suchfeld-Namen gegen architecture.md pruefen (API kann sich aendern).
- Excel-Export-Fehler: pip install openpyxl.

## Suche aendern
Block CONFIG oben in run.py (keywords, cantons, Zeitraum, JobSpy an/aus).
