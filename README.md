# Ram Cabs & Travels

<div align="center">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
  <img src="https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=react-router&logoColor=white" alt="React Router" />
  <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
</div>

A comprehensive, full-stack transportation management platform engineered to deliver seamless ride-booking experiences for users and robust operational controls for fleet administrators.

## Overview

Ram Cabs & Travels represents a modern approach to local and outstation transit. Built with an emphasis on performance, usability, and scalability, this application bridges the gap between passengers and reliable transportation. From a frictionless booking funnel to a comprehensive administrative dashboard, the platform is tailored to streamline the entire lifecycle of a ride.

## Core Capabilities

### For Passengers
- **Frictionless Booking Experience:** An intuitive, multi-step interface for requesting rides, specifying pickup/drop-off coordinates, and selecting vehicle classes.
- **Dynamic Fleet Showcase:** High-fidelity visual catalogs of available vehicles (spanning economical auto-rickshaws to premium sedans) featuring interactive state transitions.
- **Booking Management:** Dedicated client portals for tracking active rides and reviewing historical booking data.
- **Responsive Architecture:** Pixel-perfect rendering and touch-optimized interactions across all device form factors (mobile, tablet, desktop).

### For Administrators
- **Command Dashboard:** A centralized, secure control panel for overseeing daily operations and fleet status.
- **Booking Orchestration:** Tools to review, accept, and manage incoming passenger requests in real-time.
- **Access Control:** Protected routing ensuring sensitive business operations are restricted to authorized personnel.

## Technical Architecture

The platform leverages a modern, component-driven architecture prioritizing maintainability and fast rendering cycles.

- **Core Framework:** [React 18](https://react.dev/) utilizing functional paradigms and Hooks.
- **Build Pipeline:** [Vite](https://vitejs.dev/) for instantaneous HMR and highly optimized production bundling.
- **Styling Engine:** [Tailwind CSS](https://tailwindcss.com/) for utility-first, responsive, and consistent design systems.
- **Motion & Interactions:** `motion/react` for performant, hardware-accelerated UI transitions.
- **Routing:** [React Router DOM](https://reactrouter.com/) for declarative, client-side navigation.
- **Iconography:** [Lucide React](https://lucide.dev/) for clean, consistent vector graphics.

## Directory Structure

```text
.
├── public/                 # Static assets, manifests, and uncompiled resources
├── src/
│   ├── components/         # Modular, reusable presentation and structural components
│   │   ├── layout/         # Application shells (Customer & Admin wrappers)
│   │   └── ...
│   ├── pages/              # Primary route entry points (Home, Booking, Dashboard)
│   ├── App.tsx             # Application router and provider configurations
│   ├── index.css           # Global stylesheet and Tailwind directives
│   └── main.tsx            # React DOM bootstrapping
├── server.ts               # Express.js backend entry point (API and static serving)
├── vite.config.ts          # Vite bundler configuration
└── package.json            # Dependency manifest and executable scripts
```

## Local Development Environment

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm or standard package manager

### Initialization

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ram-cabs
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Launch the development server:**
   ```bash
   npm run dev
   ```
   The application will boot on `http://localhost:3000` (or the configured environment port) with Hot Module Replacement enabled.

### Production Deployment

To compile the application for production environments:

```bash
npm run build
```
This process generates an optimized, minified bundle in the `dist/` directory. 

To serve the compiled application locally for testing:
```bash
npm run start
```

## Licensing

Proprietary Software. All rights reserved by Ram Cabs & Travels. Unauthorized copying, modification, or distribution is strictly prohibited.
