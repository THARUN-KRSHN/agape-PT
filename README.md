# AgapePT Personality Development Test Web App

Production-ready full-stack app: React frontend + Node/Express backend + SQLite + SMTP logging. Deployed on Railway, serves frontend from backend in production.

## Setup

1) Install Node 18+.
2) Install dependencies:

```
cd backend && npm i
cd ../frontend && npm i
```

3) Create environment file in `backend/.env`:

```
PORT=4000
DATA_DIR=./data
DB_PATH=./data/quiz.db
LOG_PATH=./data/submissions_log.txt
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_TO=host_email@example.com
```

Ensure the `data` directory exists (the server creates it if missing).

## Local Run

Terminal 1 (backend):

```
cd backend
npm run dev
```

Terminal 2 (frontend):

```
cd frontend
npm start
```

Frontend is proxied to backend at `http://localhost:4000`.

## Build for Production

```
cd frontend
npm run build
```

Start backend to serve the React build:

```
cd backend
npm start
```

The server will serve files from `frontend/build` and handle API routes.

## Railway Deployment

- Root project with `backend` and `frontend` folders
- Railway service build command:

```
npm --prefix frontend ci && npm --prefix frontend run build && npm --prefix backend ci
```

- Start command:

```
npm --prefix backend run start
```

- Set environment variables in Railway dashboard (same as `.env`).

## Email Configuration (SMTP)

- For Gmail, create an App Password and set `EMAIL_USER`, `EMAIL_PASS`.
- Confirm `EMAIL_HOST=smtp.gmail.com`, `EMAIL_PORT=587`.
- The app emails submission logs to `EMAIL_TO` as plain text (no PDF).

## UI Enhancements

- Theme toggle: Dark (default) and Light themes available via the toggle in the header. Theme persists during the session.
- PDF download: Results can be downloaded directly as a PDF using jsPDF (no print dialog).
- Host email: More readable, structured subject and body including student details, result summary, and sign-off.

## Calculation Logic

Implements Big Five categories and learning style inference consistent with the provided questionnaire and Kolb/VARK references. Questions are mapped to categories; results include category scores, dominant type, overall score, recommended learning styles, strengths, and suggested activities.

## Changelog

- Added complete backend (Express, SQLite, SMTP, logging) and frontend (quiz flow, responsive UI, progress, animations, PDF via print). Updated proxy and production serving.


