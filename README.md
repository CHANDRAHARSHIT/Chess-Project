# ChessCraft

> **Launch Your Own Chess Platform.** A creator-owned, white-label chess infrastructure that allows chess creators, coaches, and academies to launch their own branded chess experience.

---

## ♟️ The Vision

ChessCraft is **not** another chess clone. It is a business-in-a-box platform for the chess ecosystem:

- **Audience Ownership:** Move your followers away from closed algorithms and maintain direct billing and subscriber relationships.
- **Brand Independence:** Launch on a custom domain (e.g. `academy.yourbrand.com`) with bespoke themes, logos, and style controls.
- **Modern Learning Experience:** Build interactive exercise modules, database study books, and standard game history logging for students.

---

## 🛠️ Technology Stack

- **Core Framework:** React 19, Vite, TypeScript
- **Styling Pipeline:** Tailwind CSS v3, PostCSS, Autoprefixer
- **Chess Engine:** Stockfish JS (compiled via WASM/Emscripten running asynchronously in a Web Worker)
- **State & Rules Validation:** `chess.js` & `react-chessboard`

---

## ⚙️ Core Architecture

### CORS-Safe CDN Stockfish Hook
The engine utilizes a custom React hook `useStockfish.ts` to instantiate Stockfish on a native browser background worker without local file caching or origin issues:
```typescript
const blobCode = `importScripts("https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js");`;
const blob = new Blob([blobCode], { type: 'application/javascript' });
const workerUrl = URL.createObjectURL(blob);
const worker = new Worker(workerUrl);
```

### Universal Chess Interface (UCI) Parser
Monitors outputs from the background threads to translate centipawn score weights (+10 to -10 range) relative to White, plotting real-time advantages on the vertical HTML evaluation bar:
```typescript
const scoreMatch = line.match(/score (cp|mate) (-?\d+)/);
if (scoreMatch) {
  const type = scoreMatch[1];
  let value = parseInt(scoreMatch[2], 10);
  if (isBlackTurn) value = -value; // Convert perspective to White
}
```

---

## 🚀 Local Deployment

Get the project running locally in three commands:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/CHANDRAHARSHIT/Chess-Project.git
   cd Chess-Project
   ```

2. **Install modules:**
   ```bash
   npm install
   ```

3. **Start local developer server:**
   ```bash
   npm run dev
   ```

4. **Verify production bundle:**
   ```bash
   npm run build
   ```

---

## 📦 Project Directory Layout

```
├── package.json              # Compilation rules & packages
├── tailwind.config.js        # Design system brand color settings
├── postcss.config.js         # CSS compiler settings
├── vite.config.ts            # Vite client setup
├── tsconfig.json             # TypeScript configurations
├── src/
│   ├── App.tsx               # Main assembly page
│   ├── index.css             # Tailwind baseline & Google font imports
│   ├── main.tsx              # React mounting root
│   ├── types/
│   │   └── chess.ts          # Type configurations for AI levels & states
│   ├── utils/
│   │   └── chessHelpers.ts   # Move converters & game checkers
│   ├── hooks/
│   │   └── useStockfish.ts   # Web worker UCI hooks
│   └── components/
│       ├── Navbar.tsx        # Top navigation
│       ├── Hero.tsx          # Pitch banner + interactive branding board
│       ├── Features.tsx      # "Why Ownership Matters"
│       ├── ProductDemo.tsx   # Stockfish play dashboard + evaluation
│       ├── HowItWorks.tsx    # Onboarding steps
│       ├── BuiltFor.tsx      # Target profiles
│       ├── PartnerCTA.tsx    # Form submission pilot signups
│       └── Footer.tsx        # Signature links
```
