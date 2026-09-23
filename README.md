# PriceTracker – Smart Price Drop Notifier

PriceTracker is a full-stack web application that monitors e-commerce product URLs, retrieves current prices, stores price history, and notifies users via email when a price drops or reaches a target price.

## Features
- **User Authentication**: Register, login, and secure session management using JWT.
- **Product Monitoring**: Add product URLs to track prices over time.
- **Price History Charts**: Interactive charts displaying historical price trends.
- **Automated Scraping**: Configurable scraper architecture supporting BeautifulSoup and Playwright.
- **Email Alerts**: Automatic email notifications when prices drop or reach your target.
- **Dashboard**: Overview of tracked products and recent price changes.

## Technology Stack
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Recharts
- **Backend**: Python, FastAPI, SQLAlchemy, PostgreSQL
- **Background Jobs**: Celery, Redis
- **Scraping**: Requests, BeautifulSoup4, Playwright

## Folder Structure
- `frontend/`: React application (Vite).
- `backend/`: FastAPI server, database models, and background tasks.
- `scrapers/`: Pluggable scraper architecture.

## Installation & Setup
### Prerequisites
- Docker & Docker Compose
- Node.js (for local frontend development)
- Python 3.10+ (for local backend development)

### Environment Variables
Copy `.env.example` to `.env` and fill in your SMTP credentials for email alerts.

```bash
cp .env.example .env
```

### Run with Docker (Recommended)
```bash
docker compose up --build
```
This will start PostgreSQL, Redis, Backend (FastAPI), and the Celery worker.

### Local Development (Without Docker)
**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Celery:**
```bash
celery -A app.tasks.celery_app worker --loglevel=info
celery -A app.tasks.celery_app beat --loglevel=info
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting
- If scraping fails, check if the website has anti-bot protections.
- Verify SMTP credentials if emails are not being sent.
