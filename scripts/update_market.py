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
    url = (
        "https://production.dataviz.cnn.io/"
        "index/fearandgreed/graphdata"
    )

    raw = http_json(
        url,
        {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
            "Referer": (
                "https://edition.cnn.com/"
                "markets/fear-and-greed"
            ),
        }
    )

    fg = raw["fear_and_greed"]

    current = float(fg["score"])

    previous = None

    # CNN response formats have changed before.
    # Try to obtain the prior close if supplied.
    for key in (
        "previous_close",
        "previous_1_day",
        "previous"
    ):
        if fg.get(key) is not None:
            try:
                previous = float(fg[key])
                break
            except Exception:
                pass

    change_pct = None

    if previous not in (None, 0):
        change_pct = (
            current / previous - 1
        ) * 100

    return {
        "current": current,
        "previous": previous,
        "change_pct": change_pct,
        "change_bp": None,
        "price_date": (
            datetime.now(timezone.utc)
            .date()
            .isoformat()
        ),
        "previous_date": None,
        "classification": fg.get("rating"),
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
                    else
                    "MARKET"
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
