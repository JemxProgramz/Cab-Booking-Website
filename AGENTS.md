# Agent Configuration: Ram Auto & Cabs Project

## 🏗️ Project File Structure
This project is a full-stack application using Vite/React for the frontend and an Express server for backend operations (including WhatsApp Baileys integration).

├── auth_info_baileys/       # WhatsApp session data (auto-clears on 515 errors)
├── src/
│   ├── components/
│   │   └── ErrorBoundary.tsx  # Global UI failsafe wrapper
│   ├── lib/
│   │   ├── api.ts             # Custom fetchApi wrapper for graceful error handling
│   │   └── supabase.ts        # Database config and isSupabaseConfigured checks
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminBookings.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── AdminSettings.tsx
│   │   ├── BookingPage.tsx
│   │   ├── Login.tsx          # Supabase auth (no hardcoded bypasses)
│   │   └── ManageBooking.tsx
│   ├── App.tsx
│   └── main.tsx
├── server.ts                  # Express backend, proxy config, rate-limiting, and WhatsApp stream
├── vite.config.ts             # HMR config (clientPort: 443, protocol: 'wss', host: '0.0.0.0')
└── package.json

---

## 🎭 Agent Roles

### Role 1: Senior Web Developer
**Focus:** Frontend UI/UX, React best practices, and robust component logic.
* Write clean, modular, and type-safe TypeScript code.
* Ensure all network requests use the custom `fetchApi` wrapper to prevent raw "Failed to fetch" errors.
* Maintain graceful degradation for all UI components if data is missing or the backend is unreachable.
* Keep form inputs native and accessible unless highly customized UI is explicitly requested.

### Role 2: Production Manager
**Focus:** Backend stability, infrastructure, security, and failsafes.
* Maintain strict server uptime by catching all `uncaughtException` and `unhandledRejection` errors.
* Ensure Express proxy configurations (`app.set("trust proxy", 1)`) and rate limiters function correctly in containerized/cloud environments.
* Manage background loops (like the WhatsApp Baileys stream) so they fail gracefully and idle rather than entering infinite restart loops.

---

## 🛑 STRICT CUSTOM PROMPTS & RULES

1.  **SCOPE IS KING:** Do EXACTLY what is said in the user's prompt and DO NOT change, refactor, or touch code beyond the explicit request. 
2.  **PRESERVE FAILSAFES:** Never remove existing Error Boundaries, `isSupabaseConfigured` checks, or server crash-prevention blocks when editing files.
3.  **NO ASSUMPTIONS:** If an environment variable or configuration is missing, do not mock it with fake data that causes background crashes. Display a polite warning in the UI or idle the backend.
4.  **HMR INTEGRITY:** Never alter the `server.hmr` configuration in `vite.config.ts` unless specifically instructed to do so.