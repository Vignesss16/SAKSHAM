# PrepAI — Next.js Frontend

AI-powered interview preparation platform. Built with **Next.js 14**, **Tailwind CSS**, and **shadcn/ui** design tokens.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Hero / Landing page with features, testimonials, pricing |
| `/login` | Auth page — Sign In & Sign Up tabs |
| `/login?tab=signup` | Auth page opened to Sign Up tab |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/signin` | POST | Authenticate existing user |
| `/api/auth/signup` | POST | Register new user |

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

## Design System

Colors, spacing, and typography follow the PrepAI design tokens:

- **Primary**: `#00d1ff` (cyan)
- **Secondary**: `#44e2cd` (teal)
- **Tertiary**: `#ecd3ff` (lavender)
- **Background**: `#0e1417` (dark)
- **Font heading**: Plus Jakarta Sans
- **Font body**: Inter

## Next Steps

1. **Add authentication**: Connect `/api/auth/*` routes to a real DB (Prisma + PostgreSQL, Supabase, etc.)
2. **Add NextAuth.js**: For Google OAuth, session management
3. **Build Dashboard**: Post-login experience
4. **Add shadcn/ui components**: `npx shadcn@latest init` to scaffold components
