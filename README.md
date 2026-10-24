# Mathy

A web app for a power buyer. It shows how accurate Elexon's wind forecasts were in January 2026 and recommends how much thermal power to buy the day before.

**Live app:** https://jkjktechnicalassignment.vercel.app </br>
**API:** https://jkjk-blush.vercel.app/docs

## What it does

- Compares actual wind output (FUELHH) with the latest forecast (WINDFOR) available before the delivery day.
- Reports accuracy: MAE, RMSE, bias, error percentiles and a likely range for actual output.
- Recommends a thermal top-up for your demand and confidence level: `max(0, demand − forecast + buffer)`. The buffer is the 80/90/95th percentile of past forecast errors.

## Project layout

```
backend/                     FastAPI service
  app/main.py                app setup, CORS, startup
  app/config.py, db.py       settings, SQLite connection
  app/models.py, schemas.py  tables, API models
  app/api/v1/endpoints.py    /health, /data/series, /analytics/metrics, /procurement/simulate
  app/services/
    elexon_client.py         fetches data from the Elexon API
    data_processor.py        cleans it and loads the database
    analytics_engine.py      forecast matching and error metrics
    procurement_engine.py    procurement recommendation
  tests/                     pytest tests
  data/wind.db               prebuilt January data (used on Vercel)
  Dockerfile
frontend/my-app/             React + Vite + TypeScript + Tailwind
  src/components/            charts (d3, canvas), dashboard sections, shared UI
  src/hooks/, src/lib/       data loading, formatting, calculations
  src/services/api.ts        API calls
```

## Run locally
**Clone the repository**
```bash
git clone https://github.com/ItsAbhinavM/jkjk.git
cd jkjk
```

**Backend** (Python 3.11+)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```
On first start it downloads January 2026 from Elexon into `app.db` (about a minute).

**Frontend** (Node 20+)
```bash
cd frontend/my-app
npm install
npm run dev
```
Open http://localhost:5173. To point at another backend, set `VITE_API_BASE_URL`.

**Backend with Docker**
```bash
cd backend
docker build -t wind-api .
docker run -p 8000:8000 wind-api
```

**Tests:** `cd backend && pip install pytest && python -m pytest -q tests`

## Deployment

Two Vercel projects: the backend ships a prebuilt `data/wind.db` because serverless storage does not persist. Backend env vars: `CORS_ORIGINS=["<frontend url>"]` and Frontend env var: `VITE_API_BASE_URL=<backend url>`.
Better keep the depolyment of backend and frontend as two separate projects.
## Notes and limits

- Each target half-hour uses the latest forecast published at least 14 hours earlier.
- Forecast error is forecast minus actual, so positive means the forecast was too high.
- The buffer is built from January errors, so it describes past behaviour, not a guarantee for other months.

### AI Usage
Claude : Writing and testing code across backend, frontend. </br>
Me : Planned, Reviewed, Deployed and run
