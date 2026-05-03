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

Create a `.env.local` file in the root directory and populate it with the following keys. You can refer to `.env.local.example` for the required fields.

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Agora Voice Agent Configuration
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id
NEXT_AGORA_APP_CERTIFICATE=your_agora_certificate
NEXT_PUBLIC_AGENT_UID=your_agent_uid

# AI API Keys
GEMINI_API_KEY=your_google_gemini_key
OPENAI_API_KEY=your_openai_key (Required for Agora Agent pipeline)

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

Ensure your Supabase project has the following tables and schemas:
- `profiles`
- `interviews`
- `coding_questions`
- `reports`

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
- **AI Engine**: Google Gemini (Llama 3.3 support via Groq or similar logic)
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
