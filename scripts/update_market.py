import os
import re
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

def http_text(url, headers=None):
    req = urllib.request.Request(
        url,
        headers=headers or {
            "User-Agent": (
                "Mozilla/5.0 "
                "(Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 "
                "(KHTML, like Gecko) "
                "Chrome/149.0 Safari/537.36"
            ),
            "Accept-Language":
                "ko-KR,ko;q=0.9,en;q=0.8",
        }
    )

    with urllib.request.urlopen(
        req,
        timeout=20
    ) as response:
        return response.read().decode(
            "utf-8",
            errors="replace"
        )


def parse_number(text):
    return float(
        text
        .replace(",", "")
        .replace(" ", "")
        .strip()
    )


def investing_vkospi():
    html = http_text(
        "https://www.investing.com/"
        "indices/kospi-volatility"
    )

    price_match = re.search(
        r'data-test="instrument-price-last"'
        r'[^>]*>\s*'
        r'([\d,.]+)',
        html,
        flags=re.I,
    )

    if not price_match:
        raise RuntimeError(
            "VKOSPI current price not found"
        )

    current = parse_number(
        price_match.group(1)
    )

    change_match = re.search(
        r'data-test="instrument-price-change-percent"'
        r'[^>]*>\s*'
        r'\(?\s*([+-]?\s*[\d,.]+)\s*%\s*\)?',
        html,
        flags=re.I,
    )

    change_pct = (
        parse_number(
            change_match
            .group(1)
            .replace("+", "")
        )
        if change_match
        else None
    )

    previous = (
        current /
        (
            1 +
            change_pct / 100
        )
        if (
            change_pct is not None and
            change_pct != -100
        )
        else None
    )

    today = (
        datetime
        .now(timezone.utc)
        .date()
        .isoformat()
    )

    return {
        "current": current,
        "previous": previous,
        "change_pct": change_pct,
        "change_bp": None,
        "price_date": today,
        "previous_date": None,
    }


def gold_kr_prices():
    html = http_text(
        "https://gold-kr.web.app/"
    )

    intl_match = re.search(
        r'class="converted-price"'
        r'[^>]*>\s*'
        r'\(₩([\d,]+(?:\.\d+)?)'
        r'\s*/g\)',
        html,
        flags=re.I,
    )

    domestic_match = re.search(
        r'국내\s*금\s*시세'
        r'.{0,1000}?'
        r'class="current-price"'
        r'[^>]*>\s*'
        r'₩([\d,]+(?:\.\d+)?)',
        html,
        flags=re.I | re.S,
    )

    premium_match = re.search(
        r'class="premium-value[^"]*"'
        r'[^>]*>\s*'
        r'([+-]?\s*[\d.]+)%',
        html,
        flags=re.I,
    )

    if not intl_match:
        raise RuntimeError(
            "International gold KRW/g not found"
        )

    if not domestic_match:
        raise RuntimeError(
            "Domestic KRX gold KRW/g not found"
        )

    gold_intl = parse_number(
        intl_match.group(1)
    )

    gold_kr = parse_number(
        domestic_match.group(1)
    )

    premium_calc = (
        gold_kr /
        gold_intl -
        1
    ) * 100

    if premium_match:
        premium_source = float(
            premium_match
            .group(1)
            .replace(
                " ",
                ""
            )
        )

        if (
            abs(
                premium_calc -
                premium_source
            ) > 0.05
        ):
            raise RuntimeError(
                "Gold premium validation mismatch"
            )

    today = (
        datetime
        .now(timezone.utc)
        .date()
        .isoformat()
    )

    return {
        "gold_kr": gold_kr,
        "gold_intl": gold_intl,
        "premium": premium_calc,
        "price_date": today,
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

        #
    # VKOSPI
    #
    try:
        p = investing_vkospi()

        rows.append({
            "symbol": "VKOSPI",
            "name": "KOSPI Volatility",
            "category": "VOLATILITY",
            "current": p["current"],
            "previous": p["previous"],
            "change_pct":
                p["change_pct"],
            "change_bp": None,
            "price_date":
                p["price_date"],
            "previous_date":
                p["previous_date"],
            "source":
                "Investing.com",
            "source_symbol":
                "KSVKOSPI",
            "updated_at":
                datetime.now(
                    timezone.utc
                ).isoformat(),
        })

        print(
            "[OK] VKOSPI:",
            p["current"],
            p["change_pct"],
        )

    except Exception as e:
        print(
            "[FAIL] VKOSPI:",
            e
        )


    #
    # KRX / International Gold
    #
    try:
        g = gold_kr_prices()

        rows.append({
            "symbol": "GOLD_KR",
            "name": "국내 금",
            "category": "GOLD",
            "current":
                g["gold_kr"],
            "previous": None,
            "change_pct": None,
            "change_bp": None,
            "price_date":
                g["price_date"],
            "previous_date": None,
            "source":
                "gold-kr.web.app",
            "source_symbol":
                "KRX_GOLD_KRW_G",
            "updated_at":
                datetime.now(
                    timezone.utc
                ).isoformat(),
        })

        rows.append({
            "symbol": "GOLD_INTL",
            "name": "국제 금",
            "category": "GOLD",
            "current":
                g["gold_intl"],
            "previous": None,
            "change_pct": None,
            "change_bp": None,
            "price_date":
                g["price_date"],
            "previous_date": None,
            "source":
                "gold-kr.web.app",
            "source_symbol":
                "COMEX_GOLD_KRW_G",
            "updated_at":
                datetime.now(
                    timezone.utc
                ).isoformat(),
        })

        print(
            "[OK] GOLD_KR:",
            g["gold_kr"]
        )

        print(
            "[OK] GOLD_INTL:",
            g["gold_intl"]
        )

        print(
            "[OK] GOLD PREMIUM:",
            round(
                g["premium"],
                2
            ),
            "%"
        )

    except Exception as e:
        print(
            "[FAIL] GOLD:",
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
