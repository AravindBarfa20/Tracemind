# ============================================================
# Tracemind — Developer Convenience Commands
# ============================================================
# Usage: make <target>
#
# Run `make help` to see all available commands.

.PHONY: help dev-up dev-down dev-logs backend-dev frontend-dev migrate migrate-create test test-backend test-frontend lint format clean

# -------------------- Help --------------------
help: ## Show this help message
	@echo ""
	@echo "  Tracemind — Developer Commands"
	@echo "  =============================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# -------------------- Docker --------------------
dev-up: ## Start Docker services (PostgreSQL, Redis)
	docker compose up -d
	@echo "\n✅ Services started. PostgreSQL: localhost:5432, Redis: localhost:6379"

dev-down: ## Stop Docker services
	docker compose down
	@echo "\n✅ Services stopped."

dev-logs: ## Follow Docker service logs
	docker compose logs -f

dev-reset: ## Stop services and destroy volumes (fresh start)
	docker compose down -v
	@echo "\n✅ Services stopped and volumes removed."

# -------------------- Backend --------------------
venv: ## Create virtual environment and install dependencies
	cd backend && python3.11 -m venv .venv
	cd backend && .venv/bin/pip install --upgrade pip
	cd backend && .venv/bin/pip install -e ".[dev]"

backend-install: venv ## Install backend dependencies (alias to venv)

backend-dev: ## Start FastAPI development server
	cd backend && .venv/bin/uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# -------------------- Frontend --------------------
frontend-install: ## Install frontend dependencies
	cd frontend && npm install

frontend-dev: ## Start Vite development server
	cd frontend && npm run dev

# -------------------- Database --------------------
migrate: ## Run database migrations
	cd backend && .venv/bin/alembic upgrade head

migrate-create: ## Create a new migration (usage: make migrate-create MSG="add users table")
	cd backend && .venv/bin/alembic revision --autogenerate -m "$(MSG)"

migrate-down: ## Rollback one migration
	cd backend && .venv/bin/alembic downgrade -1

# -------------------- Testing --------------------
test: test-backend test-frontend ## Run all tests

test-backend: ## Run backend tests
	cd backend && .venv/bin/pytest tests/ -v --tb=short

test-frontend: ## Run frontend tests
	cd frontend && npm run test

# -------------------- Code Quality --------------------
lint: ## Run linters
	cd backend && ruff check src/ tests/
	cd frontend && npm run lint

format: ## Format code
	cd backend && ruff format src/ tests/
	cd frontend && npm run format

# -------------------- Cleanup --------------------
clean: ## Remove build artifacts and caches
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true
	rm -rf frontend/dist backend/dist
	@echo "\n✅ Cleaned."

# -------------------- Full Setup --------------------
setup: dev-up backend-install frontend-install migrate ## Full project setup (first time)
	@echo "\n✅ Tracemind is ready!"
	@echo "  Backend:  make backend-dev  → http://localhost:8000"
	@echo "  Frontend: make frontend-dev → http://localhost:5173"
	@echo "  API Docs: http://localhost:8000/docs"
