# Project split

- `frontend/` contains React UI files (HTML, CSS, JSX).
- `backend/` contains API server code.
- `index.original.jsx` keeps your original single-file code as backup.

## Run

1. Frontend
   - `cd frontend`
   - `npm install`
   - `npm run dev`

2. Backend
   - `cd backend`
   - `npm install`
   - Optional: copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY` for Claude-powered responses
   - `npm run dev`

## AI Mentor data

- AI Mentor now has a built-in local knowledge base at `backend/data/mentor_knowledge.json`.
- If `ANTHROPIC_API_KEY` is missing or the Claude API fails, chat automatically falls back to this local database.
