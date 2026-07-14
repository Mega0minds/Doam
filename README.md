# DoAm

An AI-powered daily schedule planner built for students. DoAm learns your energy rhythms, goals, and commitments, then generates an optimized day plan in under two minutes.

## Features

- **AI Schedule Generation** — Gemini 2.5 Flash builds a daily schedule around your peak focus hours, low-energy windows, fixed commitments, and goal priorities
- **Goal Management** — Set goals across categories (academic, health, personal growth, social, spiritual, recreation); AI decomposes them into timed, recurring actions
- **Goal Deep-Dive Chat** — Conversational AI interview to sharpen goal context and improve scheduling accuracy
- **Task Management** — Manual task creation with priority, type, duration, due date, and reminders
- **Brain Dump** — Paste a stream-of-consciousness note; AI extracts and schedules the tasks inside it
- **Proof of Completion** — Upload an image; AI verifies whether it demonstrates task completion
- **Energy Profile Onboarding** — Capture chronotype, wake/sleep times, peak focus window, and low-energy period once; all schedules adapt to it
- **Fixed Commitments** — Block recurring time slots (classes, meals) that the scheduler never touches
- **Push Notifications** — Morning motivation, task reminders, intelligent nudges, and sleep/wake alarms via Web Push
- **AI Insights** — Detects patterns like high-skip hours and duration bias to continuously improve estimates
- **PWA** — Installable on mobile with offline support via service worker

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui (Radix UI) |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth + Edge Functions) |
| AI | Google Gemini 2.5 Flash |
| State / Data | TanStack Query v5 |
| Package Manager | pnpm |

## Project Structure

```
src/
  app/          # Next.js App Router pages
  views/        # Page-level React components
  components/   # Shared UI components
  hooks/        # Custom React hooks
  contexts/     # Language and Nickname providers
  integrations/ # Supabase client
  lib/          # Utilities (push notifications, motivation, etc.)
supabase/
  functions/    # Deno edge functions (AI, notifications, etc.)
  migrations/   # Database schema migrations
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)

### Setup

```sh
# Clone the repo
git clone <YOUR_GIT_URL>
cd doam

# Install dependencies
pnpm install

# Copy env file and fill in your values
cp .env.example .env.local
```

### Environment Variables

Create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

For Supabase Edge Functions, set these secrets via the Supabase dashboard or CLI:

```sh
supabase secrets set GEMINI_API_KEY=<your-gemini-key>
```

### Run Locally

```sh
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy Edge Functions

```sh
supabase functions deploy
```

## Edge Functions

| Function | Purpose |
|---|---|
| `generate-schedule` | AI-generated daily schedule (Gemini) |
| `decompose-goals` | Break goals into timed, recurring actions |
| `goal-deepdive` | Conversational AI for goal refinement |
| `process-brain-dump` | Extract tasks from freeform text |
| `verify-proof` | AI image verification of task completion |
| `generate-biography` | Build a user profile summary |
| `update-biography-weekly` | Scheduled weekly profile refresh |
| `send-morning-motivation` | Daily motivational push notification |
| `send-task-reminders` | Upcoming task push reminders |
| `send-intelligent-nudges` | Context-aware re-engagement nudges |
| `send-sleep-wake-alarms` | Sleep and wake-up alarm notifications |
| `send-daily-notifications` | Batch daily notification dispatcher |
| `get-vapid-public-key` | Returns VAPID key for Web Push setup |
| `record-feedback` | Stores user feedback |

## Database

Migrations live in `supabase/migrations/`. Apply them to a new project with:

```sh
supabase db push
```

Key tables: `energy_profiles`, `goals`, `goal_actions`, `tasks`, `schedule_slots`, `fixed_commitments`, `user_patterns`, `notification_preferences`.

## Authentication

Email/password and Google OAuth via Supabase Auth. After sign-in, users are redirected to `/dashboard`.
# Doam
