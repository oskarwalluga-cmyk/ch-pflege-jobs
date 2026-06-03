"""
Quelle 2: JobSpy (Open Source, MIT-Lizenz)

Zieht parallel von Indeed.ch, LinkedIn und Google Jobs. Ergaenzt job-room.ch
um privatwirtschaftliche und nicht-meldepflichtige Stellen.

JobSpy ist optional: ist das Paket nicht installiert, ueberspringt das Skript
diese Quelle einfach (job-room.ch laeuft trotzdem).
Installation:  pip install python-jobspy
"""

try:
    from jobspy import scrape_jobs
    HAVE_JOBSPY = True
except Exception:
    HAVE_JOBSPY = False


def _clean(value, default=""):
    import math
    if value is None:
        return default
    try:
        if isinstance(value, float) and math.isnan(value):
            return default
    except Exception:
        pass
    return str(value).strip()


def fetch_jobspy(search_term, location="Schweiz", results_wanted=50,
                 hours_old=72, sites=None, verbose=True):
    """
    search_term    : z.B. "Dipl. Pflegefachmann"
    location       : z.B. "Schweiz", "Zuerich", "Bern"
    results_wanted : pro Portal
    hours_old      : nur Inserate juenger als N Stunden
    sites          : Liste, Standard ["indeed", "google", "linkedin"]
    """
    if not HAVE_JOBSPY:
        if verbose:
            print("  [JobSpy] nicht installiert -> Quelle uebersprungen "
                  "(pip install python-jobspy)")
        return []

    sites = sites or ["indeed", "google", "linkedin"]
    try:
        df = scrape_jobs(
            site_name=sites,
            search_term=search_term,
            google_search_term=f"{search_term} Stellen Schweiz",
            location=location,
            results_wanted=results_wanted,
            hours_old=hours_old,
            country_indeed="switzerland",
            linkedin_fetch_description=False,
        )
    except Exception as e:
        print(f"  [JobSpy] Fehler: {e}")
        return []

    if df is None or len(df) == 0:
        return []

    rows = []
    for _, r in df.iterrows():
        rows.append({
            "source": _clean(r.get("site"), "jobspy"),
            "title": _clean(r.get("title")),
            "company": _clean(r.get("company")),
            "location": _clean(r.get("location")),
            "canton": "",
            "workload": "",
            "date_posted": _clean(r.get("date_posted")),
            "url": _clean(r.get("job_url")),
            "apply_contact": _clean(r.get("job_url_direct")),
            "description": _clean(r.get("description"))[:400],
            "reporting_obligation": False,
        })
    if verbose:
        print(f"  [JobSpy] {len(rows)} Treffer ueber {', '.join(sites)}")
    return rows
