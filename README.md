# WorkPilot — AI Study Platform

WorkPilot turns your study material into interactive learning experiences: study sets (notes, flashcards, quizzes, fill-in-the-blanks, written tests, tutor lessons, podcasts), syllabus intelligence (modules, timeline, priorities), and an AI paper grader.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** with shadcn/Radix UI components
- **Firebase Authentication** (email/password + Google) on the client
- **External backend API** (REST + WebSocket) for study-set generation, syllabus analysis, grading, billing/credits, and admin — configured via `NEXT_PUBLIC_API_BASE_URL`

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` with:

   ```bash
   # Firebase Web SDK (Firebase Console > Project settings > General > Your apps)
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...

   # Backend API base URL
   NEXT_PUBLIC_API_BASE_URL=/backend-api
   API_UPSTREAM_URL=https://your-backend.example.com
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

## Notes

- Users can create accounts with Firebase email/password authentication; the backend provisions the application session from the Firebase ID token.
- Study sets, syllabus analyses, and grader results are cached in browser localStorage per device; source-of-truth generation data lives on the backend.
- Admin portal lives at `/admin` (requires an admin role); the student dashboard is at `/dashboard`.
- Backend response shapes are documented in `API_RESPONSE_FORMATS.md`.
