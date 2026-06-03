# Learnings

- Die dokumentierte job-room v1-API (jobAdvertisements/v1) ist zum VEROEFFENTLICHEN
  von Stellen (Arbeitgeber, mit SECO-Zugang), nicht zum Suchen. Fuer die Suche nutzt
  die Webseite einen separaten, frei zugaenglichen Endpoint:
  POST https://www.job-room.ch/jobadservice/api/jobAdvertisements/_search
- Trick zum schnellen Reverse-Engineering einer JSON-API: einen Request mit einem
  ungueltigen Feld schicken; die Fehlermeldung listet oft alle gueltigen Felder auf.
- Gesamtanzahl Treffer steht im Header X-Total-Count -> sauberes Paginieren moeglich.
- Lokales HTML-Dashboard: Daten direkt einbetten statt fetch(jobs.json), sonst
  blockiert der Browser den file://-Zugriff (CORS).
- Pflege ("Pflegefachmann") liefert aktuell ~2200+ aktive Treffer auf job-room ->
  Quelle ist fuer diesen Beruf sehr ergiebig.
