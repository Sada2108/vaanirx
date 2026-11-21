# VaaniRx

Listen • Understand • Clarify.

Multilingual healthcare voice AI platform that bridges the language and literacy gap between doctors and patients. Built for Lean In Hacks 8.0 – ElevenLabs Track.

## Architecture

- **Frontend:** React 19 + Vite 8 + TypeScript 5.7 + Tailwind CSS v4
- **Backend:** Node.js + Express + ws (WebSocket proxy for ElevenLabs)
- **Routing:** React Router DOM (role-based: doctor/patient)
- **State:** React Context (Auth) + in-memory API layer (demo mode)

## Project Structure

```
vaanirx/
├── src/
│   ├── App.tsx                 # Router + role-protected routes
│   ├── main.tsx                # React entrypoint
│   ├── index.css               # Tailwind + Figma design system
│   ├── context/
│   │   └── AuthContext.tsx     # Demo auth provider (doctor/patient)
│   ├── lib/
│   │   ├── api.ts              # API layer + WebSocket transcription + TTS
│   │   ├── config.ts           # Environment config
│   │   ├── demoData.ts         # Sample patients, consultations, prescriptions
│   │   └── clinicalExtraction.ts # Clinical info extraction from transcripts
│   ├── components/
│   │   └── Asset.tsx           # SVG asset helper
│   ├── layouts/
│   │   ├── DoctorLayout.tsx    # Doctor shell (sidebar, topbar)
│   │   └── PatientLayout.tsx   # Patient shell
│   ├── pages/
│   │   ├── entry/
│   │   │   └── EntryPage.tsx   # Role selection (doctor/patient login)
│   │   ├── doctor/
│   │   │   ├── Dashboard.tsx   # Doctor dashboard + live consultation
│   │   │   ├── Consultations.tsx
│   │   │   ├── Patients.tsx
│   │   │   ├── PatientDetail.tsx
│   │   │   ├── Prescriptions.tsx (allergy conflict warnings)
│   │   │   ├── Analytics.tsx
│   │   │   └── Settings.tsx
│   │   └── patient/
│   │       ├── Dashboard.tsx
│   │       └── QRView.tsx      # Public QR prescription access
├── server/
│   ├── index.js                # Express + WebSocket proxy to ElevenLabs
│   ├── package.json
│   └── .env                    # ELEVENLABS_API_KEY (never committed)
├── .env.example                # Frontend env vars template
├── .gitignore                  # Excludes .env*, node_modules, dist
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Design System (preserved from Figma)

- Navy: `#102D49`
- Teal: `#0D9488`
- Mint: `#EAF5F3`
- Background: `#F7F8FA`
- Font: Inter (via Figma CDN)

## Getting Started

### Prerequisites

- Node.js 22+
- npm or pnpm

### 1. Install frontend dependencies

```bash
cd /path/to/VaaniRx Dashboard
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set `VITE_DEMO_MODE=true` for hackathon demo (uses sample data, no ElevenLabs calls).

For live mode, set `VITE_DEMO_MODE=false` and provide `VITE_API_BASE_URL` pointing to your backend.

### 3. Start the backend (required for live transcription/TTS)

```bash
cd server
npm install
cp .env.example .env  # or create .env with your ELEVENLABS_API_KEY
npm run dev
```

The backend runs on `http://localhost:3001` and proxies ElevenLabs API calls so keys never reach the browser.

### 4. Start the frontend

```bash
cd /path/to/VaaniRx Dashboard
npm run dev
```

Frontend runs on `http://localhost:8443` (or `$PORT`).

### 5. Demo workflow

1. Open `http://localhost:8443`
2. Choose **Doctor Portal** → login (any name/password works in demo mode)
3. Register a patient or select an existing one
4. Click **Start New Consultation** → grant microphone permission → start transcription
5. View live transcript with Hindi/English translation
6. Review AI clinical extraction, edit notes, save
7. Issue a prescription (allergy conflicts are checked)
8. Scan the QR code (or visit `/qr/<token>`) on a mobile device to view the prescription and play audio instructions

## Roles

- **Doctor:** Dashboard, consultations, patient management, prescriptions, analytics, settings
- **Patient:** Dashboard with current/previous prescriptions, medicine schedule, audio replay, download
- **Public (QR):** Prescription access via token, no login required

## Demo Mode vs Live Mode

| Feature | Demo Mode | Live Mode |
|---------|-----------|-----------|
| Data | Sample patients/consultations/prescriptions | Actual backend data |
| Transcription | Simulated transcript | ElevenLabs Scribe (WebSocket) |
| TTS | Cached sample audio | ElevenLabs Flash v2.5 |
| API Keys | None needed | `ELEVENLABS_API_KEY` on backend only |

Set `VITE_DEMO_MODE=false` to disable demo mode.

## Security

- ElevenLabs API key is stored **only** on the backend (`server/.env`)
- Frontend never accesses ElevenLabs directly
- QR access tokens are unpredictable (`vaanirx_rx_<timestamp>`)
- `.env` files are excluded from git via `.gitignore`

## Scripts

```bash
npm run dev        # Start frontend dev server
npm run build      # Production build
npm run preview    # Preview production build
cd server && npm run dev  # Start backend
```

## Deployment

Frontend: Build with `npm run build`, deploy `dist/` to any static host.
Backend: Deploy `server/` to any Node.js host. Set `ELEVENLABS_API_KEY` in environment.

## License

MIT — built for Lean In Hacks 8.0
