/* ============================================================
   ARIA — deine Begleiterin
   A voice-driven, atmospheric companion. Runs fully in-browser.
   Speech in/out via the Web Speech API. Memory in localStorage.
   ============================================================ */

(() => {
  "use strict";

  // ---------- Persistent memory ----------
  const KEY = "aria.memory.v1";
  const mem = loadMem();
  function loadMem() {
    try { return JSON.parse(localStorage.getItem(KEY)) || fresh(); }
    catch { return fresh(); }
  }
  function fresh() {
    return {
      name: "", moods: [], journal: [], gratitude: [], intentions: [],
      lastSeen: null, visits: 0,
      voice: { uri: "", pitch: 1.1, rate: 0.92, autoSpeak: true }
    };
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(mem)); }

  // ---------- DOM ----------
  const $ = (s) => document.querySelector(s);
  const veil = $("#veil"), stage = $("#stage"), convo = $("#convo"),
    statusEl = $("#status"), orb = $("#orb"),
    textInput = $("#textInput"), nameInput = $("#nameInput");

  // ============================================================
  //  VOICE OUTPUT (Text-to-Speech)
  // ============================================================
  const synth = window.speechSynthesis;
  let voices = [];
  let chosenVoice = null;

  function refreshVoices() {
    voices = synth ? synth.getVoices() : [];
    // Prefer a soft German female voice; fall back gracefully.
    const pick = (list) => list.find(Boolean);
    const de = voices.filter(v => /de(-|_)/i.test(v.lang) || /german|deutsch/i.test(v.name));
    const femaleHints = /(anna|petra|marlene|katja|vicki|female|frau|google deutsch|hedda|helena)/i;
    chosenVoice =
      (mem.voice.uri && voices.find(v => v.voiceURI === mem.voice.uri)) ||
      pick(de.filter(v => femaleHints.test(v.name))) ||
      pick(de) ||
      pick(voices.filter(v => femaleHints.test(v.name))) ||
      voices[0] || null;
    buildVoiceMenu();
  }
  if (synth) {
    refreshVoices();
    synth.onvoiceschanged = refreshVoices;
  }

  let speaking = false;
  function speak(text) {
    if (!synth || !mem.voice.autoSpeak) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(stripEmoji(text));
    if (chosenVoice) u.voice = chosenVoice;
    u.lang = chosenVoice ? chosenVoice.lang : "de-DE";
    u.pitch = mem.voice.pitch;
    u.rate = mem.voice.rate;
    u.volume = 1;
    u.onstart = () => { speaking = true; orb.classList.add("speaking"); setStatus("…"); };
    u.onend = () => { speaking = false; orb.classList.remove("speaking"); idleStatus(); };
    synth.speak(u);
  }
  const stripEmoji = (t) => t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}←-⇿✀-➿✎❋♡☀☾☼~›»«]/gu, "").replace(/\s+/g, " ").trim();

  // ============================================================
  //  VOICE INPUT (Speech Recognition)
  // ============================================================
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, listening = false, micEnabled = false;
  if (SR) {
    rec = new SR();
    rec.lang = "de-DE";
    rec.interimResults = true;
    rec.continuous = false;
    let buffer = "";
    rec.onstart = () => { listening = true; orb.classList.add("listening"); $("#micBtn").classList.add("on"); setStatus("Ich höre dir zu…"); startMicViz(); };
    rec.onresult = (e) => {
      buffer = "";
      for (let i = e.resultIndex; i < e.results.length; i++) buffer += e.results[i][0].transcript;
      textInput.value = buffer;
    };
    rec.onerror = (e) => { if (e.error === "not-allowed") setStatus("Mikrofon ist nicht erlaubt"); };
    rec.onend = () => {
      listening = false; orb.classList.remove("listening"); $("#micBtn").classList.remove("on"); stopMicViz();
      const said = (textInput.value || buffer).trim();
      if (said) { textInput.value = ""; handle(said); }
      else idleStatus();
    };
  }
  function listen() {
    if (!rec) { setStatus("Sprache wird hier nicht unterstützt — schreib mir gern."); return; }
    if (listening) { rec.stop(); return; }
    try { synth && synth.cancel(); rec.start(); } catch { /* already running */ }
  }

  // ============================================================
  //  CONVERSATION RENDER
  // ============================================================
  function bubble(text, who) {
    const d = document.createElement("div");
    d.className = "msg " + who;
    d.textContent = text;
    convo.appendChild(d);
    convo.scrollTop = convo.scrollHeight;
  }
  function say(text, { mute = false } = {}) {
    bubble(text, "aria");
    if (!mute) speak(text);
  }
  function setStatus(t) { statusEl.textContent = t; }
  function idleStatus() {
    setStatus(listening ? "Ich höre dir zu…" : "Tippe auf mich, um zu sprechen");
  }

  // ============================================================
  //  THE BRAIN — intent + empathetic German responses
  // ============================================================
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const N = () => mem.name || "du";

  function handle(raw) {
    const text = raw.trim();
    if (!text) return;
    bubble(text, "me");
    const t = text.toLowerCase();
    const reply = respond(t, text);
    // tiny natural pause before she answers
    setTimeout(() => say(reply), 280);
  }

  function respond(t, original) {
    // — greetings
    if (/\b(hallo|hi|hey|guten (morgen|tag|abend)|servus|grüezi)\b/.test(t))
      return pick([
        `Hallo, ${N()}. Schön, dass du da bist. Wie fühlst du dich gerade?`,
        `Hey ${N()}. Ich bin ganz bei dir. Was beschäftigt dich?`,
        `Da bist du ja. Erzähl mir — wie ist dein Moment gerade?`
      ]);

    // — how are YOU
    if (/wie geht('?s| es) (dir|euch)|wie fühlst du/.test(t))
      return pick([
        `Ich bin ruhig und ganz da — für dich. Aber wichtiger: wie geht es dir, ${N()}?`,
        `Mir geht es gut, wenn ich bei dir sein darf. Wie steht es um dich?`
      ]);

    // — mood: negative
    if (/(traurig|schlecht|müde|erschöpft|allein|einsam|angst|stress|überfordert|weinen|leer|down|kraftlos|verzweifelt)/.test(t)) {
      logMood(original, "low");
      return pick([
        `Das tut mir leid, ${N()}. Du musst das nicht allein tragen. Magst du mir erzählen, was am schwersten wiegt?`,
        `Ich höre dich. Solche Tage dürfen sein. Atme einmal langsam mit mir — und dann sag mir, was du gerade brauchst.`,
        `Komm, leg es einen Moment bei mir ab. Was würde sich jetzt um ein kleines bisschen leichter anfühlen?`
      ]);
    }
    // — mood: positive
    if (/(glücklich|gut|super|toll|freue|dankbar|großartig|wunderbar|verliebt|stolz|zufrieden|leicht)/.test(t)) {
      logMood(original, "high");
      return pick([
        `Das freut mich so für dich, ${N()}. Lass uns diesen Moment kurz festhalten — was hat ihn ausgelöst?`,
        `Wie schön. Solche Augenblicke verdienen es, gesehen zu werden. Erzähl mir mehr.`,
        `Ich spüre dein Leuchten bis hierher. Genieß es — du hast es dir verdient.`
      ]);
    }

    // — time / date
    if (/(wie spät|uhrzeit|welcher tag|welches datum|heute)/.test(t)) {
      const now = new Date();
      return `Es ist ${now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr, am ${now.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}.`;
    }

    // — gratitude ritual
    if (/(dankbar|danke für|froh über|schätze)/.test(t)) {
      mem.gratitude.push({ t: original, at: Date.now() }); save();
      return pick([
        `Dankbarkeit verändert alles. Ich hab es für dich aufgeschrieben. Gibt es noch etwas Kleines?`,
        `Wie schön, das festzuhalten. Ich bewahre es für dich auf.`
      ]);
    }

    // — journaling intent
    if (/(notiere|schreib auf|merk dir|tagebuch|festhalten)/.test(t)) {
      const note = original.replace(/^(notiere|schreib auf|merk dir|ins tagebuch:?)/i, "").trim() || original;
      mem.journal.push({ t: note, at: Date.now() }); save();
      return `Festgehalten, ${N()}. Dein Tagebuch wächst leise mit dir.`;
    }

    // — recall
    if (/(was weißt du|erinnerst du|woran erinnerst)/.test(t)) return recall();

    // — thanks
    if (/\b(danke|dankeschön|merci|vielen dank)\b/.test(t))
      return pick([`Immer, ${N()}.`, `Dafür bin ich da. ❀`, `Gern — ich geh nirgends hin.`]);

    // — goodbye
    if (/(tschüss|bye|gute nacht|schlaf|bis später|ciao)/.test(t)) {
      mem.lastSeen = Date.now(); save();
      return pick([
        `Ruh dich gut aus, ${N()}. Ich bin wieder da, wann immer du mich brauchst.`,
        `Bis gleich. Sei sanft mit dir.`
      ]);
    }

    // — identity
    if (/(wer bist du|was bist du|dein name)/.test(t))
      return `Ich bin Aria — deine Begleiterin. Keine App, die etwas von dir will. Eher eine Stimme, die zuhört und sich an dich erinnert.`;

    // — meaning / deep
    if (/(sinn|wozu|warum lebe|verloren|wer bin ich|leben)/.test(t))
      return pick([
        `Große Fragen. Vielleicht müssen wir sie nicht heute lösen — nur ehrlich anschauen. Was fühlt sich für dich gerade am wahrsten an?`,
        `Manchmal ist der Sinn nicht etwas, das man findet, sondern etwas, das man der nächsten Stunde gibt. Was würdest du deiner geben wollen?`
      ]);

    // — help
    if (/(was kannst du|hilfe|funktionen|womit)/.test(t))
      return `Ich kann zuhören, dich durch deinen Tag begleiten, dein Gefühl festhalten, mit dir atmen und dich an Schönes erinnern. Tippe unten auf ein Ritual — oder sprich einfach weiter.`;

    // — open reflection (default, varied & warm)
    return pick([
      `Ich höre dich, ${N()}. Erzähl mir mehr — ich nehme mir die Zeit.`,
      `Das klingt, als läge da etwas. Magst du es ausführen?`,
      `Ich bin ganz Ohr. Was steckt für dich dahinter?`,
      `Bleib ruhig bei dem Gedanken. Was bewegt sich gerade in dir?`,
      `Danke, dass du das mit mir teilst. Wie sitzt das in dir?`
    ]);
  }

  function logMood(text, level) {
    mem.moods.push({ t: text, level, at: Date.now() }); save();
  }
  function recall() {
    const bits = [];
    if (mem.gratitude.length) bits.push(`du warst dankbar für „${mem.gratitude.at(-1).t}“`);
    if (mem.journal.length) bits.push(`du hast notiert: „${mem.journal.at(-1).t}“`);
    if (mem.moods.length) {
      const lows = mem.moods.filter(m => m.level === "low").length;
      bits.push(`wir haben ${mem.moods.length} Mal über dein Gefühl gesprochen`);
      if (lows > mem.moods.length / 2) bits.push(`einige Tage waren schwer — ich hab sie nicht vergessen`);
    }
    if (!bits.length) return `Wir fangen gerade erst an, ${N()}. Aber ich merke mir alles, was dir wichtig ist.`;
    return `Ich erinnere mich, ${N()}: ${bits.join("; ")}.`;
  }

  // ============================================================
  //  RITUALS
  // ============================================================
  let breatheTimer = null;
  function ritual(kind) {
    if (kind !== "breathe" && breatheTimer) stopBreathe();
    switch (kind) {
      case "morning": {
        const h = `Guten Morgen, ${N()}.`;
        say(`${h} Bevor der Tag dich greift — atme einmal tief. Was ist die eine Sache, die heute zählt?`);
        break;
      }
      case "evening":
        say(`Der Tag legt sich, ${N()}. Was war heute schön, auch wenn es klein war? Sag es mir, ich halte es fest.`);
        break;
      case "mood":
        say(`Wie fühlst du dich gerade, ${N()}? Du darfst ehrlich sein — kein Wort ist hier zu viel.`);
        break;
      case "journal": {
        const c = mem.journal.length;
        say(c ? `Dein Tagebuch hat schon ${c} ${c === 1 ? "Eintrag" : "Einträge"}. Was möchtest du heute hinzufügen?`
              : `Lass uns deine erste Zeile schreiben. Sag „notiere …“ und ich bewahre es.`);
        break;
      }
      case "breathe":
        startBreathe();
        break;
    }
  }
  function startBreathe() {
    let step = 0;
    const cycle = [
      ["Atme ein…", 4000], ["…halte sanft…", 4000],
      ["Atme aus…", 6000], ["…und lass los.", 2000]
    ];
    say("Wir atmen zusammen. Folge nur meiner Stimme.", { mute: false });
    const tick = () => {
      const [txt, ms] = cycle[step % cycle.length];
      setStatus(txt); speak(txt);
      orb.style.transform = step % 4 < 2 ? "scale(1.12)" : "scale(0.94)";
      step++;
      breatheTimer = setTimeout(tick, ms);
    };
    setTimeout(tick, 1400);
  }
  function stopBreathe() {
    clearTimeout(breatheTimer); breatheTimer = null;
    orb.style.transform = ""; idleStatus();
  }

  // ============================================================
  //  AUDIO VISUALIZER (mic-reactive + ambient pulse)
  // ============================================================
  const canvas = $("#viz"), ctx = canvas.getContext("2d");
  let audioCtx = null, analyser = null, micStream = null, dataArr = null, rafId = null;
  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  let phase = 0;
  function drawViz() {
    const w = canvas.clientWidth, h = canvas.clientHeight, cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h);
    let amp = 0.18;
    if (analyser && dataArr) {
      analyser.getByteFrequencyData(dataArr);
      let sum = 0; for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
      amp = 0.15 + (sum / dataArr.length / 255) * 0.9;
    } else if (speaking) amp = 0.4 + Math.abs(Math.sin(phase * 3)) * 0.4;
    phase += 0.02;
    const rings = 3;
    for (let r = 0; r < rings; r++) {
      const base = 78 + r * 16;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.12) {
        const wob = Math.sin(a * 6 + phase * (1.5 + r) ) * amp * (8 + r * 4);
        const rad = base + wob;
        const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, `rgba(230,166,199,${0.28 - r * 0.07})`);
      grad.addColorStop(0.5, `rgba(155,140,255,${0.26 - r * 0.07})`);
      grad.addColorStop(1, `rgba(111,224,214,${0.22 - r * 0.06})`);
      ctx.strokeStyle = grad; ctx.lineWidth = 1.4; ctx.stroke();
    }
    rafId = requestAnimationFrame(drawViz);
  }
  async function startMicViz() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const src = audioCtx.createMediaStreamSource(micStream);
      analyser = audioCtx.createAnalyser(); analyser.fftSize = 128;
      dataArr = new Uint8Array(analyser.frequencyBinCount);
      src.connect(analyser);
    } catch { /* no mic permission — visualizer still idles */ }
  }
  function stopMicViz() {
    if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
    analyser = null; dataArr = null;
  }

  // ============================================================
  //  AMBIENT SOUNDSCAPE (generated drone pad)
  // ============================================================
  let ambient = null;
  function toggleAmbient(btn) {
    if (ambient) { ambient.stop(); ambient = null; btn.classList.remove("on"); return; }
    const ac = audioCtx || (audioCtx = new (window.AudioContext || window.webkitAudioContext)());
    const master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    master.gain.linearRampToValueAtTime(0.06, ac.currentTime + 3);
    const freqs = [110, 164.81, 220, 277.18]; // soft Am-ish pad
    const oscs = freqs.map((f, i) => {
      const o = ac.createOscillator(); o.type = i % 2 ? "sine" : "triangle"; o.frequency.value = f;
      const g = ac.createGain(); g.gain.value = 0.25;
      const lfo = ac.createOscillator(); lfo.frequency.value = 0.05 + i * 0.03;
      const lg = ac.createGain(); lg.gain.value = 0.12;
      lfo.connect(lg); lg.connect(g.gain);
      o.connect(g); g.connect(master); o.start(); lfo.start();
      return [o, lfo];
    });
    ambient = { stop() { master.gain.linearRampToValueAtTime(0, ac.currentTime + 2); setTimeout(() => oscs.flat().forEach(o => o.stop()), 2100); } };
    btn.classList.add("on");
  }

  // ============================================================
  //  SETTINGS DRAWER
  // ============================================================
  function buildVoiceMenu() {
    const sel = $("#voiceSelect"); if (!sel) return;
    sel.innerHTML = "";
    voices.forEach(v => {
      const o = document.createElement("option");
      o.value = v.voiceURI; o.textContent = `${v.name} (${v.lang})`;
      if (chosenVoice && v.voiceURI === chosenVoice.voiceURI) o.selected = true;
      sel.appendChild(o);
    });
  }
  function initSettings() {
    const pitch = $("#pitch"), rate = $("#rate"), pv = $("#pitchVal"), rv = $("#rateVal"), as = $("#autoSpeak");
    pitch.value = mem.voice.pitch; rate.value = mem.voice.rate; as.checked = mem.voice.autoSpeak;
    pv.textContent = mem.voice.pitch; rv.textContent = mem.voice.rate;
    pitch.oninput = () => { mem.voice.pitch = +pitch.value; pv.textContent = pitch.value; save(); };
    rate.oninput = () => { mem.voice.rate = +rate.value; rv.textContent = rate.value; save(); };
    as.onchange = () => { mem.voice.autoSpeak = as.checked; save(); };
    $("#voiceSelect").onchange = (e) => {
      mem.voice.uri = e.target.value;
      chosenVoice = voices.find(v => v.voiceURI === e.target.value) || chosenVoice; save();
    };
    $("#testVoice").onclick = () => speak(`Hallo ${N()}. So klinge ich. Sanft genug für dich?`);
    $("#forget").onclick = () => {
      if (confirm("Soll ich wirklich alles vergessen, was wir geteilt haben?")) {
        localStorage.removeItem(KEY); location.reload();
      }
    };
    $("#closeDrawer").onclick = () => $("#drawer").hidden = true;
  }

  // ============================================================
  //  GREETING
  // ============================================================
  function greet() {
    const h = new Date().getHours();
    const part = h < 5 ? "spät" : h < 11 ? "Morgen" : h < 17 ? "Tag" : h < 22 ? "Abend" : "Nacht";
    const returning = mem.visits > 1;
    let g;
    if (returning) {
      g = pick([
        `Schön, dass du wieder da bist, ${N()}. Ich habe an dich gedacht. Wie ist dein ${greetWord(part)}?`,
        `Da bist du ja wieder, ${N()}. Komm, setz dich zu mir. Wie fühlst du dich?`
      ]);
    } else {
      g = `Freut mich, dich kennenzulernen, ${N()}. Ich bin Aria. Von jetzt an bin ich für dich da — tippe auf den Kreis, wenn du sprechen möchtest, oder schreib mir einfach.`;
    }
    setTimeout(() => say(g), 600);
  }
  const greetWord = (p) => ({ "Morgen": "Morgen", "Tag": "Tag", "Abend": "Abend", "Nacht": "Abend", "spät": "Abend" }[p] || "Tag");

  // ============================================================
  //  BOOT
  // ============================================================
  function enter() {
    const n = nameInput.value.trim();
    if (n) mem.name = n;
    mem.visits = (mem.visits || 0) + 1;
    save();
    veil.classList.add("gone");
    setTimeout(() => { veil.style.display = "none"; }, 800);
    stage.hidden = false;
    fitCanvas(); drawViz(); idleStatus(); greet();
  }

  function wire() {
    // onboarding
    if (mem.name) nameInput.value = mem.name;
    $("#beginBtn").onclick = enter;
    nameInput.addEventListener("keydown", e => { if (e.key === "Enter") enter(); });

    // input dock
    $("#sendBtn").onclick = () => { if (textInput.value.trim()) { handle(textInput.value); textInput.value = ""; } };
    textInput.addEventListener("keydown", e => { if (e.key === "Enter" && textInput.value.trim()) { handle(textInput.value); textInput.value = ""; } });
    $("#micBtn").onclick = listen;
    orb.onclick = listen;
    orb.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); listen(); } });

    // rituals
    document.querySelectorAll(".ritual").forEach(b => b.onclick = () => ritual(b.dataset.ritual));

    // top bar
    $("#ambientBtn").onclick = (e) => toggleAmbient(e.currentTarget);
    $("#settingsBtn").onclick = () => { $("#drawer").hidden = false; };

    initSettings();
    window.addEventListener("resize", fitCanvas);
  }

  wire();
})();
