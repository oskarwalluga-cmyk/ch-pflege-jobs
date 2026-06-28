# ARIA · deine Begleiterin

Eine atmosphärische, sprachgesteuerte Begleiter-App mit dunklem Interface und
sanfter, femininer Stimme. Aria hört zu, erinnert sich an dich und begleitet
dich durch den Tag — vom Morgen-Ritual bis zur Abend-Reflexion.

> Kein Server, kein Account, keine Cloud. Alles läuft im Browser, deine
> Erinnerungen bleiben lokal auf deinem Gerät (`localStorage`).

## Was sie kann

- **Sprechen & Zuhören** — Spracheingabe über die Web Speech API (`de-DE`) und
  Antwort mit gesprochener, weicher Stimme (Text-to-Speech).
- **Lebendiges Orb-Interface** — ein reaktiver Klang-Orb, der auf deine Stimme
  und ihre Antworten pulsiert (Canvas-Visualizer + Mikrofon-Analyse).
- **Rituale** — Morgen-Intention, geführtes Atmen, Gefühls-Check-in,
  Tagebuch und Abend-Reflexion.
- **Erinnerung** — sie merkt sich deinen Namen, deine Stimmungen, Tagebuch-
  einträge und Dankbarkeit. Frag „Woran erinnerst du dich?“.
- **Atmosphäre** — animierte Aurora, Glas-Optik, generierter Klangteppich
  (ambienter Drone-Pad, komplett synthetisiert per Web Audio).
- **Anpassbare Stimme** — Stimme, Wärme (Pitch) und Tempo frei einstellbar.
- **Neurale Stimme (optional, ElevenLabs)** — für eine warm-menschliche, sanfte
  Frauenstimme. Eigenen kostenlosen API-Schlüssel unter „Stimme" eintragen
  (bleibt lokal); Aria spricht dann über ElevenLabs (`eleven_multilingual_v2`),
  und der Orb pulsiert zu ihrer echten Stimme. Ohne Schlüssel/offline nutzt sie
  die beste Browser-Stimme.
- **Erinnerungen** — sag „erinnere mich um 18:30 an …“ oder „… in 10 Minuten an …“.
  Aria meldet sich sanft per Stimme und (falls erlaubt) Browser-Benachrichtigung.
- **Tiefere Gespräche (optional)** — verbinde unter „Stimme“ einen eigenen
  Claude-API-Schlüssel für echte, fließende Dialoge. Der Schlüssel bleibt nur
  lokal auf deinem Gerät; ohne Schlüssel antwortet das eingebaute Gehirn offline.
- **Installierbar (PWA)** — „Zum Startbildschirm hinzufügen“ macht Aria zur App;
  die Oberfläche funktioniert dank Service Worker auch offline.

## Starten

Einfach `index.html` im Browser öffnen — am besten über einen lokalen Server,
damit Mikrofon und Sprache funktionieren:

```bash
cd aria
python3 -m http.server 8080
# dann http://localhost:8080 öffnen
```

> Spracheingabe/-ausgabe funktionieren am zuverlässigsten in **Chrome/Edge**.
> Für das Mikrofon ist ein sicherer Kontext nötig (`localhost` oder `https`).
> Welche deutschen Frauenstimmen verfügbar sind, hängt vom Betriebssystem ab —
> die beste wird automatisch gewählt, lässt sich aber unter „Stimme“ ändern.

## Aufbau

| Datei | Zweck |
|-------|-------|
| `index.html` | Struktur, Orb, Dock, Rituale, Einstellungen |
| `styles.css` | Dark-Theme, Aurora, Glasmorphismus, Animationen |
| `app.js`     | Sprach-I/O, Gesprächs-„Gehirn“, Claude-Anbindung, Erinnerungen, Visualizer, Klang |
| `manifest.webmanifest` · `sw.js` | PWA: Installierbarkeit & Offline-Cache |
| `icon.svg` · `icon-192.png` · `icon-512.png` | App-Icons |

## Privatsphäre

Aria sendet nichts nach außen. Sprache wird vom Browser verarbeitet, und alle
Erinnerungen liegen ausschließlich in deinem lokalen Speicher. Unter „Stimme →
Alles vergessen“ kannst du jederzeit alles löschen.
