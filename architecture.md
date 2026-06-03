# Architektur

Einfache lineare Datenpipeline in Python.

run.py orchestriert:
1. sources/jobroom.py  -> POST https://www.job-room.ch/jobadservice/api/jobAdvertisements/_search
   (oeffentlicher Such-Endpoint der Webseite, kein Auth, paginiert ueber X-Total-Count).
2. sources/jobspy_source.py -> Bibliothek JobSpy (Indeed/LinkedIn/Google), optional.
3. Merge + Dedupe (Schluessel: Titel + Firma, kleingeschrieben).
4. Export: output/jobs.xlsx, jobs.csv, jobs.json (pandas).
5. dashboard.py baut output/dashboard.html mit eingebetteten Daten
   (kein Server noetig, da JSON direkt in die HTML geschrieben wird -> umgeht file:// CORS).

## Einheitliches Datenschema
source, title, company, location, canton, workload, date_posted, url,
apply_contact, reporting_obligation, description.

## job-room Antwortstruktur (verifiziert)
Liste von Items -> item.jobAdvertisement -> .jobContent
  .jobDescriptions[0].title / .description
  .company.name, .location.city/.cantonCode
  .employment.workloadPercentageMin/Max
  .applyChannel.emailAddress/formUrl
  .publication.startDate ; ad.id -> Detaillink /job-search/{id}
  ad.reportingObligation (Stellenmeldepflicht-Flag).
Gueltige Suchfelder: professionCodes, keywords, communalCodes, cantonCodes,
workloadPercentageMin/Max, companyName, onlineSince, displayRestricted,
euresDisplay, language, radiusSearchRequest, permanent.
