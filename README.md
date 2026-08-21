<<<<<<< HEAD
# MavericksHackathon-PublicInformationSystem
=======
# IntelliSurvey

Prototype platform for intelligent survey data validation.

This repository is an initial scaffold only. Domain features are not implemented yet.

## Stack

- **Frontend:** React (Vite + TypeScript)
- **Backend:** FastAPI
- **Database:** SQLite (prototype)

## Layout

```
intellisurvey/
├── backend/                 FastAPI application
│   ├── alembic/             Schema migrations
│   ├── app/
│   │   ├── api/             HTTP routers and dependencies
│   │   ├── core/            Settings, logging
│   │   ├── db/              SQLAlchemy engine, session, models
│   │   └── modules/         Feature packages (surveys, datasets, rules, ...)
│   └── tests/
├── frontend/                React application
│   └── src/
│       ├── app/             App shell and routing
│       ├── components/      Shared UI
│       ├── features/        Feature packages aligned with backend modules
│       ├── lib/             API client and shared helpers
│       └── pages/           Route-level screens
└── data/                    Local SQLite files
```

Each backend module is a self-contained package (`router`, `models`, `schemas`, `service`, `repository`) so new capabilities can be added without rewriting shared layers.

Frontend `features/` mirrors those modules so UI work can grow in the same boundaries.

## Local setup (later)

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

SQLite will live at `data/intellisurvey.db` once persistence is wired up.
>>>>>>> 13408f3 (Initial Commit)
