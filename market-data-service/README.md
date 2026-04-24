# TradeSight Market Data Service

Python microservice that fetches 1-minute candle data via yfinance and returns structured price points for trade scoring and what-if analysis.

## Setup

```bash
cd market-data-service
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

## Run

```bash
uvicorn main:app --reload --port 8000
```

The service will be available at `http://localhost:8000`.

## Endpoint

### `GET /candles`

Fetches 1-minute OHLC data for a ticker on a given date and returns key price points.

**Query parameters**

| Parameter | Required | Example | Description |
|---|---|---|---|
| `ticker` | Yes | `NVDA` | Ticker symbol |
| `date` | Yes | `2026-04-09` | Trading date (YYYY-MM-DD) |
| `entry_time` | Yes | `09:55` | Entry time (HH:MM) |
| `exit_time` | Yes | `10:30` | Exit time (HH:MM) |
| `tz` | No | `America/New_York` | Timezone for the times (default: `America/New_York`) |

**Example request**

```
GET http://localhost:8000/candles?ticker=NVDA&date=2026-04-09&entry_time=09:55&exit_time=10:30
```

**Example response**

```json
{
  "ticker": "NVDA",
  "date": "2026-04-09",
  "entry_price": 875.32,
  "exit_price": 881.10,
  "price_5min_after_exit": 882.45,
  "price_10min_after_exit": 880.90,
  "max_high_during_hold": 883.20,
  "max_high_after_exit": 885.60,
  "moved_in_favor": true
}
```

**Response fields**

| Field | Description |
|---|---|
| `entry_price` | Close price at the candle closest to `entry_time` |
| `exit_price` | Close price at the candle closest to `exit_time` |
| `price_5min_after_exit` | Close price 5 minutes after exit |
| `price_10min_after_exit` | Close price 10 minutes after exit |
| `max_high_during_hold` | Highest high between entry and exit |
| `max_high_after_exit` | Highest high in the 30 minutes after exit |
| `moved_in_favor` | `true` if price rose in the first 5 minutes after entry (caller flips for puts) |

Any field is `null` if no candle falls within 5 minutes of the requested time.

### `GET /health`

Returns `{"status": "ok"}`. Use to verify the service is running.

## Notes

- yfinance provides 1-minute data for approximately the **last 30 days** only. Requests for older dates will return a 404.
- Pass `tz=America/Chicago` or another IANA timezone string for traders outside Eastern time.
- Pre-market and after-hours candles are included (`prepost=True`).
