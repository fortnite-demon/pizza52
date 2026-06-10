.PHONY: help dev db db-down seed migrate frontend backend install clean fclean re logs

PYTHON  = backend/.venv/bin/python
UVICORN = backend/.venv/bin/uvicorn

help: ## показать это сообщение
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

# ─── База данных ────────────────────────────────────────────────────────────

db: ## запустить PostgreSQL в Docker
	docker-compose up -d

db-down: ## остановить и удалить контейнер БД
	docker-compose down

db-reset: ## пересоздать БД (удалить volume + поднять заново)
	docker-compose down -v
	docker-compose up -d

# ─── Бэкенд ─────────────────────────────────────────────────────────────────

install-backend: ## установить Python-зависимости
	cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

backend: ## запустить FastAPI в режиме hot-reload
	cd backend && $(UVICORN) main:app --reload --host 0.0.0.0 --port 8000

migrate: ## применить все миграции Alembic
	cd backend && $(PYTHON) -m alembic upgrade head

migration: ## создать новую миграцию (NAME=<название>)
	cd backend && $(PYTHON) -m alembic revision --autogenerate -m "$(NAME)"

seed: ## заполнить БД тестовыми данными
	cd backend && $(PYTHON) seed.py

# ─── Фронтенд ────────────────────────────────────────────────────────────────

install-frontend: ## установить npm-зависимости
	cd frontend && npm install

frontend: ## запустить Vite dev-сервер
	cd frontend && npm run dev

build: ## собрать фронтенд для продакшена
	cd frontend && npm run build

# ─── Docker (все сервисы) ────────────────────────────────────────────────────

up: ## поднять весь стек через docker-compose
	docker-compose up --build

down: ## остановить весь стек
	docker-compose down

logs: ## показать логи всех контейнеров
	docker-compose logs -f

# ─── Установка и запуск разом ────────────────────────────────────────────────

install: install-backend install-frontend ## установить все зависимости

dev: db ## запустить бэкенд и фронтенд параллельно (требует GNU make)
	@$(MAKE) -j2 backend frontend

# ─── Очистка ─────────────────────────────────────────────────────────────────

clean: ## удалить временные файлы (__pycache__, .pyc, dist, .tsbuildinfo)
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name "*.tsbuildinfo" -delete
	rm -rf frontend/dist
	@echo "Временные файлы удалены."

fclean: clean ## полная очистка (+ .venv, node_modules, .pytest_cache)
	rm -rf backend/.venv
	rm -rf frontend/node_modules
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache"   -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache"   -exec rm -rf {} + 2>/dev/null || true
	@echo "Полная очистка завершена."

re: fclean install ## пересобрать всё с нуля
