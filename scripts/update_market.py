import os
import json
import urllib.request
from datetime import datetime, timezone

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["SUPABASE_SECRET_KEY"]

YAHOO_SYMBOLS = {
    "NASDAQ": ("NASDAQ", "^IXIC"),
    "SP500": ("S&P500", "^GSPC"),
    "DOW": ("DOW JONES", "^DJI"),
    "KOSPI": ("KOSPI", "^KS11"),
    "VIX": ("CBOE VIX", "^VIX"),
    "DXY": ("미국달러지수", "DX-Y.NYB"),
    "USDKRW": ("달러/원", "KRW=X"),
    "JPYKRW": ("엔/원", "JPYKRW=X"),
    "US10Y": ("미국국채10년", "^TNX"),
}


def http_json(url, headers=None):
    req = urllib.request.Request(
        url,
        headers=headers or {
            "User-Agent": "Mozilla/5.0"
        }
    )

    with urllib.request.urlopen(
        req,
        timeout=20
    ) as response:
        return json.loads(
            response.read().decode("utf-8")
        )


def yahoo_price(symbol):
    url = (
        "https://query1.finance.yahoo.com/"
        f"v8/finance/chart/{symbol}"
        "?range=5d&interval=1d"
    )

    raw = http_json(url)

    result = raw["chart"]["result"][0]

    timestamps = result["timestamp"]

    quote = result["indicators"]["quote"][0]

    closes = quote["close"]

    valid = []

    for ts, close in zip(
        timestamps,
        closes
    ):
        if close is not None:
            valid.append(
                (ts, float(close))
            )

    if len(valid) < 2:
        raise RuntimeError(
            f"Not enough price data: {symbol}"
        )

    previous_ts, previous = valid[-2]
    current_ts, current = valid[-1]

    change_pct = (
        (current / previous - 1) * 100
        if previous
        else None
    )

    price_date = (
        datetime
        .fromtimestamp(
            current_ts,
            timezone.utc
        )
        .date()
        .isoformat()
    )

    previous_date = (
        datetime
        .fromtimestamp(
            previous_ts,
            timezone.utc
        )
        .date()
        .isoformat()
    )

    return {
        "current": current,
        "previous": previous,
        "change_pct": change_pct,
        "change_bp": None,
        "price_date": price_date,
        "previous_date": previous_date,
    }


def cnn_fear_greed():
    # 날짜가 붙은 endpoint가 GitHub Actions에서 더 안정적
    start_date = "2026-01-01"

    url = (
        "https://production.dataviz.cnn.io/"
        "index/fearandgreed/graphdata/"
        + start_date
    )

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://www.cnn.com",
        "Referer": "https://www.cnn.com/",
    }

    raw = http_json(
        url,
        headers
    )

    fg = raw["fear_and_greed"]

    current = float(
        fg["score"]
    )

    previous = None

    if fg.get("previous_close") is not None:
        previous = float(
            fg["previous_close"]
        )

    change_pct = None

    if previous not in (None, 0):
        change_pct = (
            current / previous - 1
        ) * 100

    # CNN historical series에서 실제 최신 거래일 확인
    historical = (
        raw
        .get(
            "fear_and_greed_historical",
            {}
        )
        .get(
            "data",
            []
        )
    )

    price_date = (
        datetime
        .now(timezone.utc)
        .date()
        .isoformat()
    )

    previous_date = None

    if historical:
        valid = [
            x for x in historical
            if x.get("x") is not None
            and x.get("y") is not None
        ]

        valid.sort(
            key=lambda x: x["x"]
        )

        if valid:
            price_date = (
                datetime
                .fromtimestamp(
                    valid[-1]["x"] / 1000,
                    timezone.utc
                )
                .date()
                .isoformat()
            )

        if len(valid) >= 2:
            previous_date = (
                datetime
                .fromtimestamp(
                    valid[-2]["x"] / 1000,
                    timezone.utc
                )
                .date()
                .isoformat()
            )

    return {
        "current": current,
        "previous": previous,
        "change_pct": change_pct,
        "change_bp": None,
        "price_date": price_date,
        "previous_date": previous_date,
        "classification": fg.get(
            "rating"
        ),
    }

def supabase_upsert(rows):
    url = (
        SUPABASE_URL
        + "/rest/v1/market_prices"
        + "?on_conflict=symbol"
    )

    body = json.dumps(
        rows,
        ensure_ascii=False
    ).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization":
                f"Bearer {SUPABASE_KEY}",
            "Content-Type":
                "application/json",
            "Prefer":
                "resolution=merge-duplicates",
        },
    )

    with urllib.request.urlopen(
        req,
        timeout=30
    ) as response:
        response.read()


def main():
    rows = []

    for key, (
        name,
        yahoo_symbol
    ) in YAHOO_SYMBOLS.items():

        try:
            p = yahoo_price(
                yahoo_symbol
            )

            row = {
                "symbol": key,
                "name": name,
                "category": (
    "INDEX"
    if key in (
        "NASDAQ",
        "SP500",
        "DOW",
        "KOSPI"
    )
    else "RATE"
    if key in (
        "US10Y",
    )
    else "MARKET"
),
**p,
                "source": "Yahoo Finance",
                "source_symbol":
                    yahoo_symbol,
                "updated_at":
                    datetime.now(
                        timezone.utc
                    ).isoformat(),
            }
if key == "US10Y":
    row["change_bp"] = (
        (row["current"] - row["previous"]) * 100
        if row["previous"] is not None
        else None
    )
            rows.append(row)

            print(
                f"[OK] {key}: "
                f"{p['current']}"
            )

        except Exception as e:
            print(
                f"[FAIL] {key}: {e}"
            )

    try:
        p = cnn_fear_greed()

        row = {
            "symbol": "FEAR_GREED",
            "name":
                "CNN Fear & Greed",
            "category":
                "SENTIMENT",
            "current":
                p["current"],
            "previous":
                p["previous"],
            "change_pct":
                p["change_pct"],
            "change_bp":
                None,
            "price_date":
                p["price_date"],
            "previous_date":
                p["previous_date"],
            "source":
                "CNN",
            "source_symbol":
                "FEAR_GREED",
            "updated_at":
                datetime.now(
                    timezone.utc
                ).isoformat(),
        }

        rows.append(row)

        print(
            "[OK] FEAR_GREED:",
            p["current"],
            p.get(
                "classification"
            ),
        )

    except Exception as e:
        print(
            "[FAIL] FEAR_GREED:",
            e
        )

    if not rows:
        raise RuntimeError(
            "No market data collected."
        )

    supabase_upsert(rows)

    print(
        f"Saved {len(rows)} rows "
        "to Supabase."
    )


if __name__ == "__main__":
    main()
