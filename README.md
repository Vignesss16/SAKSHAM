# PrepWise AI - Advanced Interview Preparation Platform

PrepWise AI is a high-performance, AI-driven platform designed to simulate realistic interview environments. It features a voice-enabled AI interviewer, real-time coding challenges, and professional evaluation reports generated with precise layout control.

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher
- **Supabase Account**: For database and authentication
- **Agora Account**: For the real-time voice agent capabilities

### 1. Clone the Repository

```bash
git clone https://github.com/Vignesss16/SAKSHAM.git
cd SAKSHAM
```

### 2. Install Dependencies

Install the required packages using npm. Note: Due to specific Agora SDK version requirements, we recommend using `--legacy-peer-deps`.

```bash
npm install --legacy-peer-deps
```

### 3. Environment Setup

The repository contains a `.env.local.example` file showing the required variables. However, for immediate use, **I will provide the complete `.env.local` file privately.**

Simply place the provided `.env.local` file into the root directory of the project before running the server. This file contains all the necessary API keys for:
- Supabase (Database & Auth)
- Agora (Voice Agent & Tokens)
- AI Engines (Groq & OpenAI)

### 4. Database Setup

Ensure your Supabase project is active. If you are using the shared database instance, no additional setup is required once the `.env.local` is in place.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database/Auth**: Supabase
- **Real-time Voice**: Agora SDK (RTC/RTM)
- **AI Engine**: Groq (Llama 3.3) for backend logic, OpenAI for voice pipeline
- **PDF Generation**: @react-pdf/renderer (Declarative native PDF generation)

## ✨ Core Features

- **Voice-Enabled Interviews**: Natural conversation with an AI agent using Agora's low-latency streaming.
- **Dynamic Coding Rounds**: Real-time code execution environment (Monaco Editor) with AI-driven complexity scaling (Easy -> Medium).
- **Professional Reports**: High-fidelity PDF reports with vector-based alignment, scoring breakdown, and key strengths.
- **Glassmorphism UI**: Premium, modern dashboard with dark-mode aesthetics.

## 👥 Collaboration & Support

This project was built for professional excellence. For any issues or feature requests, please contact the repository owner.

---
© 2024 PrepWise AI. All Rights Reserved.
