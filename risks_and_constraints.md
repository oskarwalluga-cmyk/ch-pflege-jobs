# Risiken & Einschraenkungen

- job-room nutzt einen internen Webseiten-Endpoint (nicht offiziell als oeffentliche
  API dokumentiert). Er kann sich ohne Vorwarnung aendern. Mitigation: Felder in
  architecture.md dokumentiert; bei 400/Strukturfehler dort nachsehen.
- JobSpy haengt von den Ziel-Portalen ab. LinkedIn limitiert aggressiv (Rate Limit
  ~ ab Seite 10). Mitigation: kleine results_wanted, hours_old, optional abschaltbar.
- Keine offizielle Gewaehr auf Vollstaendigkeit der Treffer.
- Nur fuer persoenliche Stellensuche; massvolle Nutzung, Pausen zwischen Anfragen.
- Lokaler Betrieb: laeuft nur, wenn der Rechner an ist und Python installiert ist.
- Keine Speicherung sensibler Daten; alles bleibt lokal im output-Ordner.
