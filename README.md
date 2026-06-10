# Pizza52 Monorepo

Monorepo дипломного проекта пиццерии **Pizza52**:
- `backend/` — API на FastAPI + SQLAlchemy + Alembic
- `frontend/` — React + TypeScript + Vite + Tailwind CSS
- PostgreSQL 15 запускается через Docker Compose

## 1) Запуск PostgreSQL

```bash
docker-compose up -d
```

Параметры БД:
- host: `localhost`
- port: `5432`
- db: `pizza52`
- user: `admin`
- password: `password`

## 2) Подготовка backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## 3) Миграции Alembic и seed

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
python seed.py
```

## 4) Подготовка frontend

```bash
cd frontend
npm install
npm run dev
```

## 5) Адреса сервисов

- API: [http://localhost:8000](http://localhost:8000)
- Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)
- Frontend: [http://localhost:5173](http://localhost:5173)
