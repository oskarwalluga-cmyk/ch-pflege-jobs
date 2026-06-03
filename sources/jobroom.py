"""
Quelle 1: job-room.ch (offizielles Stellenportal des Bundes / SECO / Arbeit.swiss)

Das ist der wichtigste und sauberste Kanal fuer Schweizer Pflege-Stellen:
- legal und kostenlos, kein Login noetig
- viele Pflegeberufe unterliegen der Stellenmeldepflicht und erscheinen hier
  ZUERST (5 Tage exklusiv), bevor sie woanders inseriert werden
- nutzt denselben oeffentlichen Such-Endpoint wie die Webseite job-room.ch

Endpoint (per Live-Analyse der Webseite verifiziert):
  POST https://www.job-room.ch/jobadservice/api/jobAdvertisements/_search
       ?page=<n>&size=<100>&sort=date_desc
"""

import time
import requests

SEARCH_URL = "https://www.job-room.ch/jobadservice/api/jobAdvertisements/_search"
DETAIL_BASE = "https://www.job-room.ch/job-search/"

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ch-pflege-jobs/1.0",
}


def _text(descriptions, key):
    """Holt Titel/Beschreibung aus der ersten (deutschen) Stellenbeschreibung."""
    if not descriptions:
        return ""
    first = descriptions[0] or {}
    return (first.get(key) or "").strip()


def _parse(ad):
    """Wandelt einen rohen job-room-Datensatz in unser einheitliches Schema um."""
    jc = ad.get("jobContent") or {}
    descs = jc.get("jobDescriptions") or []
    company = jc.get("company") or {}
    location = jc.get("location") or {}
    employment = jc.get("employment") or {}
    apply_channel = jc.get("applyChannel") or {}
    publication = ad.get("publication") or {}

    wl_min = employment.get("workloadPercentageMin")
    wl_max = employment.get("workloadPercentageMax")
    if wl_min is not None and wl_max is not None:
        workload = f"{wl_min}-{wl_max}%" if wl_min != wl_max else f"{wl_max}%"
    else:
        workload = ""

    apply_contact = (
        apply_channel.get("emailAddress")
        or apply_channel.get("formUrl")
        or apply_channel.get("mailAddress")
        or ""
    )

    return {
        "source": "job-room.ch",
        "title": _text(descs, "title"),
        "company": company.get("name", ""),
        "location": location.get("city", "") or location.get("communalCode", ""),
        "canton": location.get("cantonCode", ""),
        "workload": workload,
        "date_posted": publication.get("startDate", ""),
        "url": DETAIL_BASE + ad.get("id", ""),
        "apply_contact": apply_contact,
        "description": _text(descs, "description")[:400],
        "reporting_obligation": ad.get("reportingObligation", False),
    }


def fetch_jobroom(keywords, canton_codes=None, online_since=30,
                  max_results=400, page_size=100, verbose=True):
    """
    Sucht Stellen auf job-room.ch.

    keywords      : Liste von Suchbegriffen, z.B. ["Pflegefachmann", "Pflegefachfrau"]
    canton_codes  : Liste von Kantonskuerzeln, z.B. ["ZH", "BE"] (leer = ganze Schweiz)
    online_since  : nur Stellen, die in den letzten N Tagen online gingen
    max_results   : Obergrenze, damit es nicht ewig laeuft
    """
    canton_codes = canton_codes or []
    results = []
    page = 0

    while len(results) < max_results:
        params = {"page": page, "size": page_size, "sort": "date_desc"}
        body = {
            "professionCodes": [],
            "keywords": keywords,
            "communalCodes": [],
            "cantonCodes": canton_codes,
            "workloadPercentageMin": 0,
            "workloadPercentageMax": 100,
            "companyName": None,
            "onlineSince": online_since,
            "displayRestricted": False,
            "euresDisplay": False,
        }
        try:
            r = requests.post(SEARCH_URL, params=params, json=body,
                              headers=HEADERS, timeout=30)
            r.raise_for_status()
        except requests.RequestException as e:
            print(f"  [job-room] Fehler auf Seite {page}: {e}")
            break

        items = r.json()
        if not items:
            break

        for it in items:
            ad = it.get("jobAdvertisement") or {}
            if ad:
                results.append(_parse(ad))

        total = int(r.headers.get("X-Total-Count", "0"))
        if verbose and page == 0:
            print(f"  [job-room] {total} Treffer insgesamt fuer {keywords}")

        page += 1
        if page * page_size >= total:
            break
        time.sleep(0.4)  # hoeflich zum Server

    return results[:max_results]


if __name__ == "__main__":
    rows = fetch_jobroom(["Pflegefachmann", "Pflegefachfrau"], max_results=5)
    for row in rows:
        print(f"- {row['title']} | {row['company']} | {row['location']} | {row['url']}")
