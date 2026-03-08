# Aura - Intelligent Rural Healthcare Platform

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16+-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-Python-teal?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/ChromaDB-Vector_Store-orange?style=for-the-badge" alt="ChromaDB" />
  <img src="https://img.shields.io/badge/Socket.io-WebRTC-black?style=for-the-badge&logo=socket.io" alt="Socket.io" />
  <img src="https://img.shields.io/badge/MongoDB-Database-green?style=for-the-badge&logo=mongodb" alt="MongoDB" />
</div>

<br />

Aura is an advanced, high-performance web application engineered for intelligent clinical triage and teleconsultation, specifically designed to be resilient in low-bandwidth, rural environments. It bridges the gap between patient symptoms and professional medical advice by synchronizing cutting-edge AI diagnostic capabilities with a robust WebRTC video telecare system.

---

## 🌟 Key Features

*   **Intelligent Diagnostic Triage (RAG Model)**
    *   A completely custom Retrieval-Augmented Generation (RAG) Engine.
    *   Dynamic, conversational symptom analysis against a massive vector database of 1,100+ verified medical disease profiles.
    *   Step-by-step diagnostic reasoning that automatically generates severity assessments and comprehensive visual Urgency patient cards.
*   **Real-time Video Teleconsultation**
    *   WebRTC-powered peer-to-peer live video and audio streaming without third-party plugins.
    *   Live text-chat channel seamlessly integrated into the video call room.
    *   Cross-device auto-renegotiation (Mobile/iOS & Desktop compatible).
*   **Progressive Web App (PWA) & Offline Sync Architecture**
    *   Designed for rural environments where internet drops natively—symptoms and triage states are saved offline using `idb` (IndexedDB).
    *   Background Service Workers powered by Serwist caching for offline resilience.
*   **Doctor Command Center Dashboard**
    *   A live, auto-updating Response Queue alerting practitioners of incoming Urgent/Emergency triages and Active calls in real-time.
    *   Teleconsultation integration directly from the queue.
*   **Immersive Micro-interactions**
    *   Tactile `web-haptics` integration that dynamically triggers device vibrations on buttons and system alerts to improve UX accessibility.
    *   Stunning, robust brutalist animations powered by `framer-motion`.
*   **Live OpenStreetMap Clinic Finder**
    *   Interactive `react-leaflet` mapping to help patients locate nearby health facilities automatically.

---

## 🛠️ Technology Stack

**Frontend Architecture:**
*   **Framework:** Next.js 16.1 (App Router)
*   **UI Library:** React 19.2
*   **Styling:** Tailwind CSS v4, Framer Motion, local Font configurations.
*   **Icons:** Phosphor Icons & Lucide React.
*   **PWA Logic:** Serwist (`@serwist/next`) + IndexedDB Wrapper.
*   **Realtime Sockets:** Socket.io-client.

**Node Backend / Real-time Engine:**
*   **WebRTC Signaling:** Dedicated Socket.io server running Node to handle SDP negotiation.
*   **Database:** MongoDB via Mongoose.
*   **Authentication:** JWT via `jose` library + `bcryptjs`.

**AI Backend (RAG Engine):**
*   **Framework:** Python FastAPI (+ Uvicorn)
*   **LLM Orchestrator:** LangChain & OpenRouter (GPT-4o-mini).
*   **Vector Store:** Chroma DB.
*   **Embeddings:** Ollama Embeddings (`nomic-embed-text:v1.5`).

---

## 🚀 How to Run the Project Locally

Because Aura relies on three distinct services (Frontend Next.js app, Node.js WebRTC Signaling Server, and the Python FastAPI RAG Model), **all three must be running simultaneously.**

### Prerequisites
*   **Node.js** (v20+)
*   **Python** (3.12+) 
*   **MongoDB:** Running locally or a cloud URI string

### 1. Start the Frontend Application
Navigate to the root directory where `package.json` is located.
```bash
npm install
npm run dev
```
*The frontend will start on http://localhost:3000*

### 2. Start the Socket.io Signaling Server (WebRTC Calls)
In the same root frontend directory, safely spin up the signaling endpoint for the consult rooms:
```bash
node src/server/signaling.js
```
*The signaling server binds strictly to port 3001.*

### 3. Start the Python RAG AI Diagnostic Server
Navigate into the nested `rag-model` directory to boot up the FastAPI LangChain environment.

```bash
cd rag-model
# Ensure your virtual environment is active
source .venv/bin/activate
uvicorn server:app --reload --port 8000
```
*(Make sure to have a `keys.env` file in the rag-model directory with `OPENROUTER_API_KEY=your_key`)*
*The backend API will start on http://127.0.0.1:8000*

---

## 🏗️ Project Structure
```bash
frontend/
├── rag-model/                  # Python FastAPI Backend
│   ├── db/chroma_db/           # Persisted SQLite Vector Store
│   ├── server.py               # Conversational & Dynamic query endpoints
│   ├── ingest.py               # Script used to hydrate vector store
│   └── keys.env                # Local LLM environment keys
├── src/
│   ├── app/                    # Next.js App Router (Pages, API Routes)
│   │   ├── api/                # Next.js API Routes (Auth, Teleconsultation proxy)
│   │   ├── dashboard/doctor/   # Secure Doctor Dashboard (Queue, Review, Home)
│   │   ├── patient/consult/    # Patient Telehealth interface
│   │   └── triage/             # Symptom intake pages
│   ├── components/             # Reusable UI Blocks 
│   │   ├── triage/             # AI Form & Chatbot UI
│   │   └── dashboard/          # Layout & Button components
│   ├── hooks/                  # Custom React logic (useOfflineSync)
│   ├── lib/                    # Utilities (MongoDB, Haptics, Auth)
│   ├── models/                 # Mongoose Db schemas (TriageLog, User, etc)
│   └── server/
│       └── signaling.js        # Node.js Socket.io server
├── public/                     # Static Web Assets (Fonts, Manifest)
└── tailwind.css                # Global styles and tailwind directives
```

---

## ⚠️ Important Note for Evaluators / Hackathon Judges

**API Keys Inclusion:** For the scope and ease of testing during the hackathon evaluation, necessary API keys (like OpenRouter) have been intentionally provided alongside the codebase in the `keys.env` file. **Please do not misuse or leak these keys outside of testing the project.**

---

## 👥 Authors
Designed & Developed for the **IEEE Gen-AI Hackathon**.

*   **Arghajit Saha**
*   **Arpit Kumar Jha**
*   **Suyash Gupta**
*   **Sujal Burnwal**

© 2026.
