@echo off
REM Taeglicher Auto-Lauf fuer ch-pflege-jobs (Windows-Aufgabenplaner).
REM Ruft das Skript mit absolutem Pfad auf -> kein Laufwerkswechsel noetig.
python "Z:\Claude\Projects\Github\ch-pflege-jobs\run.py" >> "Z:\Claude\Projects\Github\ch-pflege-jobs\output\log.txt" 2>&1
