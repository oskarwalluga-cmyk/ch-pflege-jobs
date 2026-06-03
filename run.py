"""
ch-pflege-jobs  --  Stellen-Sammler fuer Dipl. Pflegefachmann (Schweiz)

Was dieses Skript macht (in einfachen Worten):
1. Es fragt mehrere Stellenquellen ab (job-room.ch + optional Indeed/LinkedIn/Google).
2. Es fuehrt alle Treffer in einer Liste zusammen und entfernt Duplikate.
3. Es speichert das Ergebnis als Excel, CSV und JSON in den Ordner "output".
4. Es baut ein klickbares Dashboard (output/dashboard.html), das du einfach
   per Doppelklick im Browser oeffnest.

Starten:  python run.py
"""

import os
import json
import datetime
import pandas as pd

from sources.jobroom import fetch_jobroom
from sources.jobspy_source import fetch_jobspy
from dashboard import build_dashboard

# ----------------------------------------------------------------------------
# KONFIGURATION  --  hier passt du deine Suche an
# ----------------------------------------------------------------------------
CONFIG = {
    # Suchbegriffe fuer job-room.ch (offizielles Bundesportal)
    "keywords": ["Pflegefachmann", "Pflegefachfrau", "Dipl. Pflege"],

    # Kantone einschraenken? Leere Liste = ganze Schweiz.
    # Beispiel: ["ZH", "BE", "AG"]
    "cantons": [],

    # job-room: nur Stellen der letzten N Tage
    "jobroom_online_since_days": 30,
    "jobroom_max_results": 400,

    # JobSpy (Indeed/LinkedIn/Google) -- optional
    "use_jobspy": True,
    "jobspy_search_term": "Dipl. Pflegefachmann",
    "jobspy_location": "Schweiz",
    "jobspy_results_per_site": 40,
    "jobspy_hours_old": 168,  # letzte 7 Tage
}

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")


def dedupe(rows):
    """Entfernt doppelte Stellen (gleicher Titel + gleiche Firma)."""
    seen = set()
    unique = []
    for r in rows:
        key = (r["title"].lower().strip(), r["company"].lower().strip())
        if key in seen or not r["title"]:
            continue
        seen.add(key)
        unique.append(r)
    return unique


def main():
    print("=" * 64)
    print("ch-pflege-jobs  --  sammle Schweizer Pflege-Stellen")
    print("Start:", datetime.datetime.now().strftime("%Y-%m-%d %H:%M"))
    print("=" * 64)

    all_rows = []

    # --- Quelle 1: job-room.ch ---
    print("\n[1/2] job-room.ch (offizielles Bundesportal) ...")
    all_rows += fetch_jobroom(
        keywords=CONFIG["keywords"],
        canton_codes=CONFIG["cantons"],
        online_since=CONFIG["jobroom_online_since_days"],
        max_results=CONFIG["jobroom_max_results"],
    )

    # --- Quelle 2: JobSpy (optional) ---
    if CONFIG["use_jobspy"]:
        print("\n[2/2] JobSpy (Indeed / LinkedIn / Google) ...")
        all_rows += fetch_jobspy(
            search_term=CONFIG["jobspy_search_term"],
            location=CONFIG["jobspy_location"],
            results_wanted=CONFIG["jobspy_results_per_site"],
            hours_old=CONFIG["jobspy_hours_old"],
        )

    # --- Zusammenfuehren + Duplikate entfernen ---
    before = len(all_rows)
    rows = dedupe(all_rows)
    print(f"\nGesammelt: {before} Treffer  ->  {len(rows)} nach Duplikat-Bereinigung")

    if not rows:
        print("Keine Stellen gefunden. Pruefe Internet/Suchbegriffe.")
        return

    # Sortieren: neueste zuerst
    rows.sort(key=lambda r: r.get("date_posted", ""), reverse=True)

    # --- Speichern ---
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    df = pd.DataFrame(rows, columns=[
        "source", "title", "company", "location", "canton", "workload",
        "date_posted", "url", "apply_contact", "reporting_obligation", "description",
    ])

    csv_path = os.path.join(OUTPUT_DIR, "jobs.csv")
    xlsx_path = os.path.join(OUTPUT_DIR, "jobs.xlsx")
    json_path = os.path.join(OUTPUT_DIR, "jobs.json")

    df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    df.to_excel(xlsx_path, index=False)
    meta = {
        "generated_at": datetime.datetime.now().isoformat(timespec="seconds"),
        "count": len(rows),
        "jobs": rows,
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)

    # --- Dashboard bauen ---
    dash_path = os.path.join(OUTPUT_DIR, "dashboard.html")
    build_dashboard(meta, dash_path)

    print("\nFertig. Dateien im Ordner 'output':")
    print("  - jobs.xlsx      (Excel)")
    print("  - jobs.csv       (CSV)")
    print("  - dashboard.html (im Browser oeffnen)")
    print("\nDashboard:", dash_path)


if __name__ == "__main__":
    main()
