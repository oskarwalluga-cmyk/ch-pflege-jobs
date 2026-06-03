# Entscheidungs-Log

2026-06-03
- Kernquelle = job-room.ch statt reines Scraping von jobs.ch.
  Grund: legal, kostenlos, kein Login; Pflege oft meldepflichtig -> erscheint
  dort zuerst und vollstaendig. jobs.ch-Scraping waere fragiler und rechtlich grauer.
- Oeffentlicher Such-Endpoint der Webseite verwendet (jobadservice/_search),
  NICHT die dokumentierte v1-Publikations-API (die braucht SECO-Zugang und ist
  zum Veroeffentlichen, nicht Suchen).
- JobSpy als optionale Zweitquelle (Indeed/LinkedIn/Google), per try/except
  entkoppelt -> Tool laeuft auch ohne JobSpy.
- Dashboard mit eingebetteten Daten statt fetch(jobs.json), weil lokale
  file://-Fetches vom Browser blockiert werden.
- Daten in Excel/CSV/JSON gleichzeitig -> maximale Weiterverwendbarkeit.
- Auto-Lauf via Windows-Aufgabenplaner (schtasks), nicht via Cloud -> laeuft
  lokal, keine Kosten, keine Datenweitergabe.
