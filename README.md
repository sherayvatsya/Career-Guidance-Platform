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
   - Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`
   - `npm run dev`
