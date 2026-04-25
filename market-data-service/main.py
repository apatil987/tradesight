from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import pytz

app = FastAPI(title="TradeSight Market Data Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


class CandleResponse(BaseModel):
    ticker: str
    date: str
    entry_price: float | None
    exit_price: float | None
    price_5min_after_exit: float | None
    price_10min_after_exit: float | None
    max_high_during_hold: float | None
    max_high_after_exit: float | None
    min_low_during_hold: float | None
    min_low_after_exit: float | None
    moved_in_favor: bool | None


def parse_datetime(date_str: str, time_str: str, tz: pytz.BaseTzInfo) -> datetime:
    """Combine a YYYY-MM-DD date and HH:MM time into a timezone-aware datetime."""
    dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
    return tz.localize(dt)


def get_closest_price(df: pd.DataFrame, target_dt: datetime, tolerance_minutes: int = 5) -> float | None:
    """
    Return the Close price of the candle whose timestamp is closest to target_dt.
    Returns None if the nearest candle is further than tolerance_minutes away.
    """
    if df.empty:
        return None

    idx = df.index.searchsorted(target_dt)

    # Collect candidates at the insertion boundary
    candidates = []
    if idx < len(df):
        candidates.append(idx)
    if idx > 0:
        candidates.append(idx - 1)

    best = min(candidates, key=lambda i: abs((df.index[i] - target_dt).total_seconds()))
    delta = abs((df.index[best] - target_dt).total_seconds())

    if delta > tolerance_minutes * 60:
        return None

    return float(df.iloc[best]["Close"])


def get_max_high(df: pd.DataFrame, start_dt: datetime, end_dt: datetime) -> float | None:
    """Return the maximum High in the interval [start_dt, end_dt]."""
    mask = (df.index >= start_dt) & (df.index <= end_dt)
    subset = df.loc[mask]
    if subset.empty:
        return None
    return float(subset["High"].max())


def get_min_low(df: pd.DataFrame, start_dt: datetime, end_dt: datetime) -> float | None:
    """Return the minimum Low in the interval [start_dt, end_dt]."""
    mask = (df.index >= start_dt) & (df.index <= end_dt)
    subset = df.loc[mask]
    if subset.empty:
        return None
    return float(subset["Low"].min())


@app.get("/candles", response_model=CandleResponse)
def get_candles(
    ticker: str = Query(..., description="Ticker symbol, e.g. NVDA"),
    date: str = Query(..., description="Trading date in YYYY-MM-DD format"),
    entry_time: str = Query(..., description="Entry time in HH:MM format"),
    exit_time: str = Query(..., description="Exit time in HH:MM format"),
    tz: str = Query(default="UTC", description="Timezone for the provided times"),
):
    # Validate and parse inputs
    try:
        local_tz = pytz.timezone(tz)
    except pytz.UnknownTimeZoneError:
        raise HTTPException(status_code=400, detail=f"Unknown timezone: {tz}")

    try:
        entry_dt = parse_datetime(date, entry_time, local_tz)
        exit_dt = parse_datetime(date, exit_time, local_tz)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date or time format: {e}")

    if exit_dt <= entry_dt:
        raise HTTPException(status_code=400, detail="exit_time must be after entry_time")

    # Fetch 1-minute candles for the date (plus a buffer for post-exit analysis)
    fetch_start = datetime.strptime(date, "%Y-%m-%d")
    fetch_end = fetch_start + timedelta(days=1)

    try:
        ticker_obj = yf.Ticker(ticker.upper())
        df = ticker_obj.history(
            start=fetch_start.strftime("%Y-%m-%d"),
            end=fetch_end.strftime("%Y-%m-%d"),
            interval="1m",
            prepost=True,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch market data: {e}")

    if df.empty:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No 1-minute data found for {ticker.upper()} on {date}. "
                "Note: yfinance only provides 1-minute data for the past ~30 days."
            ),
        )

    # Normalise index to the requested timezone for consistent comparisons
    if df.index.tzinfo is None:
        df.index = df.index.tz_localize("UTC")
    df.index = df.index.tz_convert(local_tz)

    # --- Core data points ---
    entry_price = get_closest_price(df, entry_dt)
    exit_price = get_closest_price(df, exit_dt)

    price_5min_after_exit = get_closest_price(df, exit_dt + timedelta(minutes=5))
    price_10min_after_exit = get_closest_price(df, exit_dt + timedelta(minutes=10))

    eod_dt = local_tz.localize(datetime.strptime(f"{date} 16:00", "%Y-%m-%d %H:%M"))
    max_high_during_hold = get_max_high(df, entry_dt, exit_dt)
    max_high_after_exit  = get_max_high(df, exit_dt, eod_dt)
    min_low_during_hold  = get_min_low(df,  entry_dt, exit_dt)
    min_low_after_exit   = get_min_low(df,  exit_dt,  eod_dt)

    # moved_in_favor: did price rise in the first 5 minutes after entry?
    price_5min_after_entry = get_closest_price(df, entry_dt + timedelta(minutes=5))
    if entry_price is not None and price_5min_after_entry is not None:
        moved_in_favor = price_5min_after_entry > entry_price
    else:
        moved_in_favor = None

    return CandleResponse(
        ticker=ticker.upper(),
        date=date,
        entry_price=entry_price,
        exit_price=exit_price,
        price_5min_after_exit=price_5min_after_exit,
        price_10min_after_exit=price_10min_after_exit,
        max_high_during_hold=max_high_during_hold,
        max_high_after_exit=max_high_after_exit,
        min_low_during_hold=min_low_during_hold,
        min_low_after_exit=min_low_after_exit,
        moved_in_favor=moved_in_favor,
    )


@app.get("/health")
def health():
    return {"status": "ok"}
