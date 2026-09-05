/**
 * Aesthetic Hello World — Client Application Logic
 * End-to-End Interactive & Visual Controller
 */

// ============================================================================
// 1. DATA & CONFIGURATION
// ============================================================================

const GREETING_TRANSLATIONS = [
  { lang: "English", text: "Hello, World!", script: "Latin" },
  { lang: "Japanese", text: "こんにちは、世界！", script: "Japanese" },
  { lang: "French", text: "Bonjour le Monde !", script: "French" },
  { lang: "Spanish", text: "¡Hola, Mundo!", script: "Spanish" },
  { lang: "Hindi", text: "नमस्ते दुनिया!", script: "Devanagari" },
  { lang: "German", text: "Hallo, Welt!", script: "German" },
  { lang: "Italian", text: "Ciao, Mondo!", script: "Italian" },
  { lang: "Portuguese", text: "Olá, Mundo!", script: "Portuguese" },
  { lang: "Korean", text: "안녕하세요, 세계!", script: "Hangul" },
  { lang: "Arabic", text: "مرحبا بالعالم!", script: "Arabic" },
  { lang: "Chinese", text: "你好，世界！", script: "Mandarin" },
  { lang: "Russian", text: "Привет, мир!", script: "Cyrillic" }
];

const CODE_SNIPPETS = {
  python: `print("Hello, World!")`,
  javascript: `console.log("Hello, World!");`,
  rust: `fn main() {\n    println!("Hello, World!");\n}`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}`,
  cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
  swift: `import Swift\nprint("Hello, World!")`,
  ruby: `puts "Hello, World!"`
};

let isSoundEnabled = true;
let audioCtx = null;

// ============================================================================
// 2. AUDIO SYNTHESIS (Web Audio API)
// ============================================================================

function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
}

function playChime(frequency = 523.25, type = 'sine', duration = 0.25) {
  if (!isSoundEnabled) return;
  try {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, audioCtx.currentTime + duration);

    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Audio context may be restricted before user interaction
  }
}

function playSparkleChord() {
  if (!isSoundEnabled) return;
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C Major pentatonic
  notes.forEach((freq, index) => {
    setTimeout(() => {
      playChime(freq, 'triangle', 0.4);
    }, index * 60);
  });
}

// ============================================================================
// 3. TYPEWRITER EFFECT
// ============================================================================

function initTypewriter() {
  const el = document.getElementById("typewriter");
  if (!el) return;

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typingSpeed = 90;

  function type() {
    const current = GREETING_TRANSLATIONS[phraseIndex];
    const fullText = `${current.text} (${current.lang})`;

    if (isDeleting) {
      charIndex--;
      typingSpeed = 40;
    } else {
      charIndex++;
      typingSpeed = 90;
    }

    el.textContent = fullText.substring(0, charIndex);

    if (!isDeleting && charIndex === fullText.length) {
      // Pause at full word
      typingSpeed = 2200;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % GREETING_TRANSLATIONS.length;
      typingSpeed = 400;
    }

    setTimeout(type, typingSpeed);
  }

  type();
}

// ============================================================================
// 4. 3D CARD TILT & SPECULAR GLARE
// ============================================================================

function init3DCard() {
  const card = document.getElementById("hero-card");
  if (!card) return;

  const wrapper = card.parentElement;

  wrapper.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;

    card.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
    card.style.setProperty("--mouse-x", `${(x / rect.width) * 100}%`);
    card.style.setProperty("--mouse-y", `${(y / rect.height) * 100}%`);
  });

  wrapper.addEventListener("mouseleave", () => {
    card.style.transform = `rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  });
}

// ============================================================================
// 5. AMBIENT CANVAS PARTICLES
// ============================================================================

function initAmbientCanvas() {
  const canvas = document.getElementById("ambient-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particleCount = Math.min(Math.floor((width * height) / 16000), 75);
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.8 + 0.8,
      alpha: Math.random() * 0.6 + 0.2
    });
  }

  let mouse = { x: null, y: null };
  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Draw & update particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      // Subtle mouse attraction
      if (mouse.x !== null) {
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          p.x += dx * 0.015;
          p.y += dy * 0.015;
        }
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 215, 255, ${p.alpha})`;
      ctx.fill();

      // Connect near particles
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(180, 215, 255, ${0.12 * (1 - dist / 100)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(render);
  }

  render();
}

// ============================================================================
// 6. CONFETTI & MAGIC PARTICLES
// ============================================================================

function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const count = 90;
  const colors = ["#38bdf8", "#818cf8", "#c084fc", "#f43f5e", "#34d399", "#fbbf24"];
  const pieces = [];

  for (let i = 0; i < count; i++) {
    pieces.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 + 50,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 1.2) * 16,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      gravity: 0.35,
      opacity: 1
    });
  }

  playSparkleChord();

  let animFrame;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotationSpeed;
      p.opacity -= 0.012;

      if (p.opacity > 0) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        ctx.restore();
      }
    });

    if (active) {
      animFrame = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animFrame);
    }
  }

  animate();
}

// ============================================================================
// 7. MULTI-LANGUAGE CODE VAULT CONTROLLER
// ============================================================================

function initCodeVault() {
  const tabs = document.querySelectorAll(".lang-tab");
  const codeDisplay = document.getElementById("code-content");
  const copyBtn = document.getElementById("copy-code-btn");
  const copyText = document.getElementById("copy-text");

  let currentLang = "python";

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentLang = tab.getAttribute("data-lang");
      codeDisplay.textContent = CODE_SNIPPETS[currentLang] || "";
      playChime(600, 'sine', 0.1);
    });
  });

  copyBtn.addEventListener("click", () => {
    const textToCopy = CODE_SNIPPETS[currentLang];
    navigator.clipboard.writeText(textToCopy).then(() => {
      copyText.textContent = "Copied!";
      copyBtn.style.borderColor = "var(--status-green)";
      playChime(880, 'triangle', 0.2);
      setTimeout(() => {
        copyText.textContent = "Copy";
        copyBtn.style.borderColor = "";
      }, 1800);
    });
  });
}

// ============================================================================
// 8. THEME & AUDIO TOGGLE CONTROLLER
// ============================================================================

function initThemeAndAudio() {
  const themeBtn = document.getElementById("theme-btn");
  const themeMenu = document.getElementById("theme-menu");
  const themeOpts = document.querySelectorAll(".theme-opt");
  const activeDot = document.getElementById("active-theme-dot");
  const activeName = document.getElementById("active-theme-name");

  const audioToggle = document.getElementById("audio-toggle");

  // Dropdown toggle
  themeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    themeMenu.classList.toggle("open");
    playChime(450, 'sine', 0.1);
  });

  document.addEventListener("click", () => {
    themeMenu.classList.remove("open");
  });

  themeOpts.forEach((opt) => {
    opt.addEventListener("click", () => {
      const theme = opt.getAttribute("data-lang") || opt.getAttribute("data-theme");
      document.documentElement.setAttribute("data-theme", theme);

      themeOpts.forEach((o) => o.classList.remove("active"));
      opt.classList.add("active");

      // Update button label
      const name = opt.textContent.trim();
      activeName.textContent = name.split(" ")[0];
      activeDot.className = `theme-dot ${theme}`;

      playChime(700, 'triangle', 0.15);
      themeMenu.classList.remove("open");
    });
  });

  // Audio Toggle
  audioToggle.addEventListener("click", () => {
    isSoundEnabled = !isSoundEnabled;
    const tooltip = audioToggle.querySelector(".btn-tooltip");
    if (isSoundEnabled) {
      tooltip.textContent = "Sound: ON";
      audioToggle.style.opacity = "1";
      playChime(660, 'sine', 0.15);
    } else {
      tooltip.textContent = "Sound: OFF";
      audioToggle.style.opacity = "0.6";
    }
  });
}

// ============================================================================
// 9. END-TO-END BACKEND API INTEGRATION
// ============================================================================

async function fetchStatus() {
  const statusBadge = document.getElementById("server-badge");
  const statusText = document.getElementById("status-text");
  const statusPing = document.getElementById("status-ping");
  const metricUptime = document.getElementById("metric-uptime");
  const metricVisits = document.getElementById("metric-visits");
  const metricMessages = document.getElementById("metric-messages");
  const metricLikes = document.getElementById("metric-likes");
  const heroLikes = document.getElementById("like-count");

  const start = performance.now();
  try {
    const res = await fetch("/api/status");
    const pingTime = Math.round(performance.now() - start);

    if (res.ok) {
      const data = await res.json();
      statusText.textContent = "Server Online";
      statusPing.textContent = `${pingTime} ms`;
      statusBadge.style.borderColor = "rgba(16, 185, 129, 0.4)";

      // Format uptime
      const s = data.uptime_seconds;
      const hours = Math.floor(s / 3600);
      const mins = Math.floor((s % 3600) / 60);
      const secs = Math.floor(s % 60);
      metricUptime.textContent = `${hours > 0 ? hours + 'h ' : ''}${mins}m ${secs}s`;

      if (data.stats) {
        metricVisits.textContent = data.stats.visits || 1;
        metricMessages.textContent = data.stats.greetings_sent || 0;
        metricLikes.textContent = data.stats.likes || 42;
        heroLikes.textContent = data.stats.likes || 42;
      }
    }
  } catch (err) {
    statusText.textContent = "Standalone Mode";
    statusPing.textContent = "Local";
    statusBadge.style.borderColor = "var(--panel-border)";
  }
}

async function fetchGreetings() {
  const feed = document.getElementById("greetings-feed");
  try {
    const res = await fetch("/api/greetings");
    if (res.ok) {
      const data = await res.json();
      renderGreetings(data.greetings);
    }
  } catch (err) {
    console.warn("Could not fetch greetings from server:", err);
  }
}

function renderGreetings(items) {
  const feed = document.getElementById("greetings-feed");
  if (!items || items.length === 0) {
    feed.innerHTML = `<div class="feed-loader">No greetings yet. Be the first!</div>`;
    return;
  }

  feed.innerHTML = items
    .map(
      (item) => `
      <div class="feed-item">
        <div class="feed-avatar">${escapeHtml(item.avatar || "✨")}</div>
        <div class="feed-content">
          <div class="feed-header">
            <span class="feed-author">${escapeHtml(item.name)}</span>
            <span class="feed-time">${escapeHtml(item.timestamp)}</span>
          </div>
          <div class="feed-msg">${escapeHtml(item.message)}</div>
        </div>
      </div>
    `
    )
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function initInteractiveActions() {
  // Sparkle Button
  const sparkleBtn = document.getElementById("sparkle-btn");
  sparkleBtn.addEventListener("click", () => {
    launchConfetti();
  });

  // Like Button
  const likeBtn = document.getElementById("like-btn");
  likeBtn.addEventListener("click", async () => {
    playChime(800, 'triangle', 0.25);
    const likeCount = document.getElementById("like-count");
    const metricLikes = document.getElementById("metric-likes");

    let cur = parseInt(likeCount.textContent) || 0;
    likeCount.textContent = cur + 1;
    metricLikes.textContent = cur + 1;

    try {
      const res = await fetch("/api/like", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        likeCount.textContent = data.likes;
        metricLikes.textContent = data.likes;
      }
    } catch (e) {
      // Local fallback handled
    }
  });

  // Greeting Form Submit
  const form = document.getElementById("greeting-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("author-input");
    const msgInput = document.getElementById("message-input");
    const avatarInput = document.getElementById("avatar-select");

    const payload = {
      name: nameInput.value.trim(),
      message: msgInput.value.trim(),
      avatar: avatarInput.value
    };

    if (!payload.name || !payload.message) return;

    try {
      const res = await fetch("/api/greet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        playSparkleChord();
        msgInput.value = "";
        fetchGreetings();
        fetchStatus();
      }
    } catch (err) {
      // Offline fallback: render locally
      const feed = document.getElementById("greetings-feed");
      const localItem = `
        <div class="feed-item">
          <div class="feed-avatar">${payload.avatar}</div>
          <div class="feed-content">
            <div class="feed-header">
              <span class="feed-author">${escapeHtml(payload.name)}</span>
              <span class="feed-time">Just now</span>
            </div>
            <div class="feed-msg">${escapeHtml(payload.message)}</div>
          </div>
        </div>
      `;
      feed.insertAdjacentHTML("afterbegin", localItem);
      msgInput.value = "";
    }
  });
}

// ============================================================================
// 10. REAL-TIME CLOCK
// ============================================================================

function initClocks() {
  const cardTime = document.getElementById("card-time");
  const footerClock = document.getElementById("footer-clock");

  function update() {
    const now = new Date();
    const utcString = now.toUTCString().split(" ")[4] + " UTC";
    const localString = now.toLocaleTimeString();

    if (cardTime) cardTime.textContent = utcString;
    if (footerClock) footerClock.textContent = `Local: ${localString}`;
  }

  update();
  setInterval(update, 1000);
}

// ============================================================================
// 11. LIVE AUDIO MIC, SPEECH RECOGNITION & STICK FIGURE CINEMA
// ============================================================================

let isMicActive = false;
let speechRecognition = null;
let micAudioStream = null;
let micAnalyser = null;
let micAudioContext = null;
let currentVoiceVolume = 0; // 0.0 to 1.0
let activeSpeaker = "left"; // "left" (Neo) or "right" (Pixel)
let stageSpecialMode = null; // null | "fire" | "dance" | "matrix" | "party"
let specialModeTimer = 0;

// Stick figure actors state
const actors = {
  left: {
    x: 0,
    y: 0,
    baseX: 0.28,
    baseY: 0.78,
    color: "#38bdf8",
    name: "NEO",
    isTalking: false,
    talkTime: 0,
    action: "idle", // idle, talking, flip, dance, fire
    actionProgress: 0,
    mouthOpen: 0,
    bobOffset: 0
  },
  right: {
    x: 0,
    y: 0,
    baseX: 0.72,
    baseY: 0.78,
    color: "#c084fc",
    name: "PIXEL",
    isTalking: false,
    talkTime: 0,
    action: "idle",
    actionProgress: 0,
    mouthOpen: 0,
    bobOffset: 0
  }
};

// Stage visual effects particles (embers, matrix chars, notes)
let stageParticles = [];

function initStickFigureStage() {
  const canvas = document.getElementById("stick-stage-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }
  resize();
  window.addEventListener("resize", resize);

  // Click on stage canvas to trigger interactive flip
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / canvas.width;
    if (clickX < 0.5) {
      triggerStickFigureAction("left", "flip");
    } else {
      triggerStickFigureAction("right", "dance");
    }
    playSparkleChord();
  });

  let lastTime = performance.now();

  function renderStage(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Cyber Stage Floor Grid & Ambient Light Beams
    drawCyberFloor(ctx, w, h, now);

    // 2. Draw Special Effects (Matrix code, Fire flames, Disco spotlights)
    drawStageEffects(ctx, w, h, dt, now);

    // 3. Update & Draw Stick Figures
    updateAndDrawStickFigure(ctx, actors.left, "left", w, h, dt, now);
    updateAndDrawStickFigure(ctx, actors.right, "right", w, h, dt, now);

    requestAnimationFrame(renderStage);
  }

  requestAnimationFrame(renderStage);
}

function drawCyberFloor(ctx, w, h, now) {
  const horizon = h * 0.72;

  // Background Spotlight Cones
  const grad1 = ctx.createRadialGradient(w * 0.28, horizon - 50, 10, w * 0.28, horizon, 200);
  grad1.addColorStop(0, "rgba(56, 189, 248, 0.2)");
  grad1.addColorStop(1, "transparent");
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, w, horizon + 50);

  const grad2 = ctx.createRadialGradient(w * 0.72, horizon - 50, 10, w * 0.72, horizon, 200);
  grad2.addColorStop(0, "rgba(192, 132, 252, 0.2)");
  grad2.addColorStop(1, "transparent");
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, w, horizon + 50);

  // Stage Floor Platform
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.lineTo(w, horizon);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fillStyle = "rgba(7, 11, 22, 0.95)";
  ctx.fill();

  // Glowing horizon line
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.lineTo(w, horizon);
  ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#38bdf8";
  ctx.shadowBlur = 10;
  ctx.stroke();

  // Perspective Grid Lines
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
  const numGridLines = 16;
  for (let i = 0; i <= numGridLines; i++) {
    const x = (w / numGridLines) * i;
    ctx.beginPath();
    ctx.moveTo(x, horizon);
    ctx.lineTo(w / 2 + (x - w / 2) * 2.2, h);
    ctx.stroke();
  }

  // Horizontal scan lines on floor
  const floorLines = 5;
  for (let j = 1; j <= floorLines; j++) {
    const lineY = horizon + Math.pow(j / floorLines, 1.8) * (h - horizon);
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(w, lineY);
    ctx.strokeStyle = `rgba(129, 140, 248, ${0.08 + j * 0.03})`;
    ctx.stroke();
  }
  ctx.restore();
}

function drawStageEffects(ctx, w, h, dt, now) {
  if (stageSpecialMode === "fire") {
    specialModeTimer -= dt;
    if (specialModeTimer <= 0) stageSpecialMode = null;

    // Spawn fire particles around actors
    for (let i = 0; i < 4; i++) {
      stageParticles.push({
        x: (actors.left.baseX + (Math.random() - 0.5) * 0.15) * w,
        y: h * 0.75,
        vx: (Math.random() - 0.5) * 60,
        vy: -Math.random() * 140 - 60,
        size: Math.random() * 8 + 4,
        color: Math.random() > 0.5 ? "#f97316" : "#ef4444",
        alpha: 1,
        life: 0.7
      });
    }
  } else if (stageSpecialMode === "matrix") {
    specialModeTimer -= dt;
    if (specialModeTimer <= 0) stageSpecialMode = null;

    // Matrix green rain drops
    if (Math.random() < 0.6) {
      stageParticles.push({
        type: "matrix",
        x: Math.random() * w,
        y: 0,
        vy: Math.random() * 200 + 150,
        char: String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96)),
        color: "#22c55e",
        alpha: 1,
        life: 1.5
      });
    }
  } else if (stageSpecialMode === "dance" || stageSpecialMode === "party") {
    specialModeTimer -= dt;
    if (specialModeTimer <= 0) stageSpecialMode = null;

    // Disco Spotlight beams sweep
    const sweep = Math.sin(now * 0.004) * (w * 0.4);
    const gradDisco = ctx.createRadialGradient(w / 2 + sweep, h * 0.3, 10, w / 2 + sweep, h * 0.7, 280);
    gradDisco.addColorStop(0, "rgba(236, 72, 153, 0.25)");
    gradDisco.addColorStop(1, "transparent");
    ctx.fillStyle = gradDisco;
    ctx.fillRect(0, 0, w, h);
  }

  // Update and draw stage particles
  for (let i = stageParticles.length - 1; i >= 0; i--) {
    const p = stageParticles[i];
    p.life -= dt;
    if (p.life <= 0) {
      stageParticles.splice(i, 1);
      continue;
    }

    if (p.type === "matrix") {
      p.y += p.vy * dt;
      ctx.save();
      ctx.font = "14px 'JetBrains Mono'";
      ctx.fillStyle = `rgba(34, 197, 94, ${p.alpha * (p.life / 1.5)})`;
      ctx.fillText(p.char, p.x, p.y);
      ctx.restore();
    } else {
      p.x += (p.vx || 0) * dt;
      p.y += (p.vy || 0) * dt;
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha * (p.life / 0.7));
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
    }
  }
}

function updateAndDrawStickFigure(ctx, actor, side, w, h, dt, now) {
  const baseX = actor.baseX * w;
  const groundY = h * 0.72;
  const figHeight = Math.min(h * 0.44, 180);

  // Audio loudness impact
  const audioEnergy = actor.isTalking ? currentVoiceVolume : 0;
  const energyBob = Math.sin(now * 0.015) * (audioEnergy * 14);

  let posX = baseX;
  let posY = groundY - energyBob;
  let rotation = 0;

  // Action Handling (Stunts & Animations)
  if (actor.action === "flip") {
    actor.actionProgress += dt * 2.8;
    const p = actor.actionProgress;
    if (p >= 1) {
      actor.action = "idle";
      actor.actionProgress = 0;
    } else {
      // Parabolic jump + 360 spin
      const jumpHeight = Math.sin(p * Math.PI) * 90;
      posY -= jumpHeight;
      rotation = p * Math.PI * 2 * (side === "left" ? 1 : -1);
    }
  } else if (actor.action === "dance") {
    actor.actionProgress += dt * 3.5;
    const p = actor.actionProgress;
    if (p >= 1 && !actor.isTalking) {
      actor.action = "idle";
      actor.actionProgress = 0;
    } else {
      posX += Math.sin(now * 0.01) * 18;
      posY -= Math.abs(Math.sin(now * 0.012)) * 16;
    }
  }

  // Draw Figure
  ctx.save();
  ctx.translate(posX, posY);
  ctx.rotate(rotation);

  // Glow filter
  ctx.shadowColor = actor.color;
  ctx.shadowBlur = actor.isTalking ? 20 : 10;
  ctx.strokeStyle = actor.color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Skeletal proportions
  const headRadius = figHeight * 0.12;
  const bodyLen = figHeight * 0.38;
  const legLen = figHeight * 0.42;
  const armLen = figHeight * 0.36;

  // Breathing / bob
  const idleBob = Math.sin(now * 0.003 + (side === "left" ? 0 : 1)) * 3;
  const hipY = -legLen + idleBob;
  const neckY = hipY - bodyLen;
  const headY = neckY - headRadius;

  // 1. Legs
  let legSpread = 16;
  if (actor.action === "dance") {
    legSpread = 26 + Math.sin(now * 0.015) * 14;
  }
  // Left Leg
  ctx.beginPath();
  ctx.moveTo(0, hipY);
  ctx.lineTo(-legSpread, 0);
  ctx.stroke();

  // Right Leg
  ctx.beginPath();
  ctx.moveTo(0, hipY);
  ctx.lineTo(legSpread, 0);
  ctx.stroke();

  // Cool Shoes / Feet glow
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-legSpread, 0, 4, 0, Math.PI * 2);
  ctx.arc(legSpread, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  // 2. Spine / Body
  ctx.beginPath();
  ctx.moveTo(0, hipY);
  ctx.lineTo(0, neckY);
  ctx.stroke();

  // 3. Arms & Gestures
  let leftHandX, leftHandY, rightHandX, rightHandY;

  if (actor.isTalking) {
    // Dynamic gesture while speaking
    const gesture = Math.sin(now * 0.008);
    const micHolding = side === "left";

    if (micHolding) {
      // Holds glowing microphone in right hand
      rightHandX = 18;
      rightHandY = neckY - 5 + Math.sin(now * 0.01) * 4;
      leftHandX = -armLen * 0.8 + gesture * 14;
      leftHandY = neckY + Math.cos(now * 0.008) * 18;
    } else {
      leftHandX = -armLen * 0.8;
      leftHandY = neckY - 10 + gesture * 20;
      rightHandX = armLen * 0.8;
      rightHandY = neckY - 15 - gesture * 18;
    }
  } else if (actor.action === "dance") {
    leftHandX = -armLen * Math.cos(now * 0.01);
    leftHandY = neckY - armLen * Math.sin(now * 0.01);
    rightHandX = armLen * Math.sin(now * 0.01);
    rightHandY = neckY - armLen * Math.cos(now * 0.01);
  } else {
    // Idle stance
    leftHandX = -armLen * 0.6;
    leftHandY = hipY * 0.6;
    rightHandX = armLen * 0.6;
    rightHandY = hipY * 0.6;
  }

  // Draw Left Arm
  ctx.beginPath();
  ctx.moveTo(0, neckY + 4);
  ctx.lineTo(leftHandX, leftHandY);
  ctx.stroke();

  // Draw Right Arm
  ctx.beginPath();
  ctx.moveTo(0, neckY + 4);
  ctx.lineTo(rightHandX, rightHandY);
  ctx.stroke();

  // Draw Handheld Holographic Mic for Left Actor
  if (side === "left") {
    ctx.save();
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(rightHandX, rightHandY + 10);
    ctx.lineTo(rightHandX, rightHandY - 6);
    ctx.stroke();
    // Mic head
    ctx.fillStyle = "#fbbf24";
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(rightHandX, rightHandY - 8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 4. Head
  ctx.beginPath();
  ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(10, 15, 30, 0.85)";
  ctx.fill();
  ctx.stroke();

  // 5. Stylized Cyber Visor / Sunglasses (Cool as fuck!)
  if (side === "left") {
    // Cyberpunk Neon Visor
    ctx.fillStyle = "#38bdf8";
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 10;
    ctx.fillRect(-headRadius * 0.75, headY - 4, headRadius * 1.5, 7);
  } else {
    // Cool Glowing Robot Eyes & Antenna
    ctx.fillStyle = "#c084fc";
    ctx.shadowColor = "#c084fc";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-headRadius * 0.35, headY - 2, 3.5, 0, Math.PI * 2);
    ctx.arc(headRadius * 0.35, headY - 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Antenna
    ctx.beginPath();
    ctx.moveTo(0, headY - headRadius);
    ctx.lineTo(0, headY - headRadius - 10);
    ctx.stroke();
    ctx.fillStyle = "#34d399";
    ctx.beginPath();
    ctx.arc(0, headY - headRadius - 11, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Lip-Sync / Animated Talking Mouth
  if (actor.isTalking) {
    const mouthHeight = Math.max(3, audioEnergy * 14 + Math.sin(now * 0.03) * 6);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(0, headY + 5, 5, mouthHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7. Ground Shadow Reflection
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, figHeight * 0.25, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function triggerStickFigureAction(actorKey, actionName, duration = 1.2) {
  const actor = actors[actorKey];
  if (!actor) return;
  actor.action = actionName;
  actor.actionProgress = 0;
  if (actionName === "dance" || actionName === "fire" || actionName === "matrix") {
    stageSpecialMode = actionName;
    specialModeTimer = duration;
  }
}

// ============================================================================
// 12. SPEECH RECOGNITION & DIALOGUE DISPATCHER
// ============================================================================

function initSpeechRecognition() {
  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  const toggleBtn = document.getElementById("toggle-mic-btn");
  const micBtnText = document.getElementById("mic-btn-text");
  const micIndicator = document.getElementById("mic-indicator");
  const micStatusLabel = document.getElementById("mic-status-label");
  const langSelect = document.getElementById("speech-lang-select");
  const demoBtn = document.getElementById("demo-speech-btn");

  const streamFinal = document.getElementById("stream-final");
  const streamInterim = document.getElementById("stream-interim");
  const interimStatus = document.getElementById("interim-status");

  // Setup Web Audio Analyser for live mic audio waveform & mouth-sync
  async function setupMicAudioAnalysis() {
    try {
      if (!micAudioContext) {
        micAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (micAudioContext.state === "suspended") {
        await micAudioContext.resume();
      }
      micAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const source = micAudioContext.createMediaStreamSource(micAudioStream);
      micAnalyser = micAudioContext.createAnalyser();
      micAnalyser.fftSize = 64;
      source.connect(micAnalyser);
      startWaveformRendering();
    } catch (err) {
      console.warn("Microphone stream access not granted for waveform analysis:", err);
    }
  }

  function startWaveformRendering() {
    const waveCanvas = document.getElementById("mic-waveform-canvas");
    if (!waveCanvas) return;
    const waveCtx = waveCanvas.getContext("2d");
    const dataArray = new Uint8Array(micAnalyser.frequencyBinCount);
    const energyFill = document.getElementById("voice-energy-fill");

    function drawWave() {
      if (!isMicActive) {
        waveCtx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
        currentVoiceVolume = 0;
        if (energyFill) energyFill.style.width = "0%";
        return;
      }
      requestAnimationFrame(drawWave);

      micAnalyser.getByteFrequencyData(dataArray);

      // Compute RMS volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      currentVoiceVolume = Math.min(1.0, avg / 128);

      if (energyFill) {
        energyFill.style.width = `${Math.min(100, Math.round(currentVoiceVolume * 120))}%`;
      }

      // Draw mini visualizer bars
      waveCtx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
      const barWidth = (waveCanvas.width / dataArray.length) * 1.8;
      let x = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * waveCanvas.height;
        waveCtx.fillStyle = `rgba(56, 189, 248, ${0.4 + (barHeight / waveCanvas.height) * 0.6})`;
        waveCtx.fillRect(x, waveCanvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    }
    drawWave();
  }

  if (SpeechRecognitionClass) {
    speechRecognition = new SpeechRecognitionClass();
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    speechRecognition.lang = langSelect.value;

    langSelect.addEventListener("change", () => {
      if (speechRecognition) {
        speechRecognition.lang = langSelect.value;
        if (isMicActive) {
          speechRecognition.stop();
        }
      }
    });

    speechRecognition.onstart = () => {
      isMicActive = true;
      toggleBtn.classList.add("recording");
      micBtnText.textContent = "Stop Live Mic";
      micIndicator.className = "live-indicator active";
      micStatusLabel.textContent = "Live Audio Streaming";
      interimStatus.textContent = "Listening closely... speak now!";
    };

    speechRecognition.onerror = (e) => {
      console.warn("Speech recognition notice:", e.error);
      if (e.error === "not-allowed") {
        micStatusLabel.textContent = "Mic Permission Denied";
        interimStatus.textContent = "Microphone access denied. Try the '⚡ Demo Voice' button!";
        stopMic();
      }
    };

    speechRecognition.onend = () => {
      if (isMicActive) {
        try {
          speechRecognition.start();
        } catch (err) {}
      } else {
        stopMic();
      }
    };

    speechRecognition.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (interim) {
        streamInterim.textContent = interim;
        displayLiveDialogue(interim, false);
      }

      if (final) {
        streamFinal.textContent += (streamFinal.textContent ? " " : "") + final;
        streamInterim.textContent = "";
        displayLiveDialogue(final, true);
        checkVoiceEasterEggs(final);
      }
    };
  }

  async function startMic() {
    initAudio();
    await setupMicAudioAnalysis();
    if (speechRecognition) {
      try {
        speechRecognition.start();
      } catch (e) {
        console.warn("Recognition already active", e);
      }
    } else {
      alert("Web Speech API is not supported in this browser. You can still test with the '⚡ Demo Voice' button!");
      micStatusLabel.textContent = "Speech API Not Available";
    }
  }

  function stopMic() {
    isMicActive = false;
    toggleBtn.classList.remove("recording");
    micBtnText.textContent = "Start Live Mic";
    micIndicator.className = "live-indicator";
    micStatusLabel.textContent = "Mic Standby";
    interimStatus.textContent = "Mic idle. Click 'Start Live Mic' to resume.";
    if (speechRecognition) {
      try { speechRecognition.stop(); } catch (e) {}
    }
    if (micAudioStream) {
      micAudioStream.getTracks().forEach((t) => t.stop());
      micAudioStream = null;
    }
  }

  toggleBtn.addEventListener("click", () => {
    playChime(600, "triangle", 0.15);
    if (!isMicActive) {
      startMic();
    } else {
      stopMic();
    }
  });

  // Demo Voice Phrases
  const demoPhrases = [
    "Hello world! The stick figures are alive and listening!",
    "Check out my fresh dance moves on the neon stage!",
    "This is so cool as fuck, watch me do a backflip!",
    "Let's set the whole cyberpunk stage on fire!",
    "Entering the Matrix mainframe, downloading data...",
    "Turn up the beat, it's party time in the digital cosmos!"
  ];
  let demoIdx = 0;

  demoBtn.addEventListener("click", () => {
    const phrase = demoPhrases[demoIdx % demoPhrases.length];
    demoIdx++;
    simulateSpeechTranscript(phrase);
    playSparkleChord();
  });

  // Magic trigger chips
  document.querySelectorAll(".trigger-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const phrase = chip.getAttribute("data-phrase");
      simulateSpeechTranscript(phrase);
      playSparkleChord();
    });
  });
}

function simulateSpeechTranscript(fullText) {
  const streamFinal = document.getElementById("stream-final");
  const streamInterim = document.getElementById("stream-interim");
  const interimStatus = document.getElementById("interim-status");

  interimStatus.textContent = "Simulating voice stream...";
  streamInterim.textContent = "";

  let words = fullText.split(" ");
  let cur = 0;

  // Animate speech typing
  const interval = setInterval(() => {
    if (cur < words.length) {
      const chunk = words.slice(0, cur + 1).join(" ");
      streamInterim.textContent = chunk;
      currentVoiceVolume = 0.6 + Math.random() * 0.4;
      displayLiveDialogue(chunk, false);
      cur++;
    } else {
      clearInterval(interval);
      streamFinal.textContent += (streamFinal.textContent ? " " : "") + fullText;
      streamInterim.textContent = "";
      currentVoiceVolume = 0.2;
      displayLiveDialogue(fullText, true);
      checkVoiceEasterEggs(fullText);
      setTimeout(() => {
        currentVoiceVolume = 0;
      }, 500);
    }
  }, 180);
}

function displayLiveDialogue(text, isFinal) {
  const bubbleLeft = document.getElementById("bubble-left");
  const bubbleRight = document.getElementById("bubble-right");
  const bubbleTextLeft = document.getElementById("bubble-text-left");
  const bubbleTextRight = document.getElementById("bubble-text-right");

  // Determine active speaker
  const currentActor = actors[activeSpeaker];
  currentActor.isTalking = true;

  if (activeSpeaker === "left") {
    bubbleLeft.classList.add("active");
    bubbleRight.classList.remove("active");
    actors.right.isTalking = false;
    bubbleTextLeft.textContent = text;
  } else {
    bubbleRight.classList.add("active");
    bubbleLeft.classList.remove("active");
    actors.left.isTalking = false;
    bubbleTextRight.textContent = text;
  }

  // If final phrase completed, switch speaker for next exchange
  if (isFinal) {
    setTimeout(() => {
      actors[activeSpeaker].isTalking = false;
      // Switch speaker turn for natural dialogue banter
      activeSpeaker = activeSpeaker === "left" ? "right" : "left";
    }, 2500);
  }
}

function checkVoiceEasterEggs(phrase) {
  const lower = phrase.toLowerCase();

  if (lower.includes("fire") || lower.includes("flame") || lower.includes("hot") || lower.includes("burn")) {
    triggerStickFigureAction("left", "fire", 3.0);
    triggerStickFigureAction("right", "fire", 3.0);
  } else if (lower.includes("dance") || lower.includes("beat") || lower.includes("music") || lower.includes("groove")) {
    triggerStickFigureAction("left", "dance", 4.0);
    triggerStickFigureAction("right", "dance", 4.0);
  } else if (lower.includes("cool") || lower.includes("fuck") || lower.includes("awesome") || lower.includes("flip")) {
    triggerStickFigureAction("left", "flip", 1.2);
    setTimeout(() => triggerStickFigureAction("right", "flip", 1.2), 300);
  } else if (lower.includes("matrix") || lower.includes("code") || lower.includes("hacker")) {
    triggerStickFigureAction("left", "matrix", 4.0);
  } else if (lower.includes("party") || lower.includes("celebrate")) {
    launchConfetti();
    triggerStickFigureAction("left", "dance", 3.5);
    triggerStickFigureAction("right", "dance", 3.5);
  } else if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    triggerStickFigureAction("left", "talking", 1.5);
  }
}

// ============================================================================
// 13. INITIALIZATION LIFECYCLE
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  initAmbientCanvas();
  initTypewriter();
  init3DCard();
  initCodeVault();
  initThemeAndAudio();
  initInteractiveActions();
  initClocks();

  // Stick figure live audio stage
  initStickFigureStage();
  initSpeechRecognition();

  // Initial API polling
  fetchStatus();
  fetchGreetings();

  // Refresh stats periodically
  setInterval(fetchStatus, 4000);
  setInterval(fetchGreetings, 8000);
});

