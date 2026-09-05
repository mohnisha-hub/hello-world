# ✨ Aesthetic "Hello World" Web Application

A modern, highly aesthetic, end-to-end "Hello World" web experience built with HTML5, CSS3, Vanilla JavaScript, and an integrated Python backend.

---

## 🌟 Key Highlights & Aesthetic Features

- **Dynamic Theme Engine**: 5 themes (Aurora Cyan, Cyber Neon, Sunset Rose, Emerald Dream, Deep Space) with smooth transitions.
- **Glassmorphic UI**: Ultra-refined `backdrop-filter: blur(20px)` glass panels, luminous glowing borders, and floating ambient light blobs.
- **Interactive 3D Card**: Tilt effect with realistic specular glare that tracks mouse movements in real time.
- **Multilingual Typewriter**: Seamless cycling through 12+ human languages and programming syntaxes.
- **Micro-Audio Feedback**: Harmonic Web Audio API synthesized chimes on interactions (sound toggle included).
- **Interactive Canvas Starfield**: Ambient particle network responding softly to cursor attraction.
- **Confetti & Magic Particle Emitter**: On-demand burst animation for celebrating milestones.
- **Multi-Language Code Vault**: Instant switch and one-click copy for Python, JavaScript, Rust, Go, C++, Swift, and Ruby.
- **End-to-End Live Backend (Python REST API)**:
  - `GET /api/status`: Live server health, ping latency, uptime, and system stats.
  - `GET /api/greetings`: Real-time community messages.
  - `POST /api/greet`: Broadcast your custom greeting to the world.
  - `POST /api/like`: Live global heart appreciation counter.

---

## 🚀 Quick Start

### 1. Launch the Server
To start the app, run:

```bash
python3 server.py 8080
```
*(or simply run `./start.sh`)*

### 2. Open in Browser
Visit **[http://localhost:8080](http://localhost:8080)** in any browser.

---

## 📁 Project Structure

```
.
├── index.html        # Semantic HTML5 layout and structure
├── styles.css        # Glassmorphism design system, responsive grid & themes
├── app.js            # Particle canvas, 3D card tilt, audio synth & API client
├── server.py         # Zero-dependency Python HTTP & REST API server
├── start.sh          # One-click start shell script
└── README.md         # Project documentation
```
