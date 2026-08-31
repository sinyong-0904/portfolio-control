import os
import json
import urllib.request
from datetime import datetime, timedelta, timezone

import FinanceDataReader as fdr
import pandas as pd


SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["SUPABASE_SECRET_KEY"]


SYMBOLS = {
    "133690": ("TIGER 미국나스닥100", "ETF"),
    "360750": ("TIGER 미국S&P500", "ETF"),
    "441640": ("KODEX 미국배당커버드콜액티브", "ETF"),
    "0019K0": ("TIME 나스닥채권50액티브", "ETF"),
    "251600": ("PLUS 고배당주채권혼합60", "ETF"),
    "411060": ("ACE KRX금현물", "ETF"),
    "0113D0": ("TIME 글로벌탑픽액티브", "ETF"),
    "0060H0": ("TIGER 토탈월드스탁액티브", "ETF"),
    "469830": ("SOL 초단기채권액티브", "ETF"),
    "161510": ("PLUS 고배당주", "ETF"),
    "466940": ("TIGER 은행고배당플러스TOP10", "ETF"),
    "466920": ("SOL 조선TOP3플러스", "ETF"),
    "449450": ("PLUS K방산", "ETF"),
    "434730": ("HANARO 원자력 iSELECT", "ETF"),
    "473640": ("HANARO 글로벌금채굴기업", "ETF"),
    "570100": ("한투 일본종합상사TOP5 ETN", "ETN"),
    "494670": ("TIGER 조선TOP10", "ETF"),
    "421320": ("PLUS 우주항공", "ETF"),
    "033780": ("KT&G", "Stock"),
    "005930": ("삼성전자", "Stock"),
    "005935": ("삼성전자우", "Stock"),
}


def first_trading_close(df, year, month=None):
    x = df[df.index.year == year]

    if month is not None:
        x = x[x.index.month == month]

    x = x.dropna(subset=["Close"])

    if x.empty:
        return None, None

    return (
        float(x.iloc[0]["Close"]),
        x.index[0].strftime("%Y-%m-%d")
    )


def collect_price(code):
    today = datetime.now()

    # 52주 + 전년도 동일월 기준가까지 충분히 확보
    start = (
        today - timedelta(days=500)
    ).strftime("%Y-%m-%d")

    df = fdr.DataReader(
        f"NAVER:{code}",
        start
    )

    if df is None or df.empty:
        raise RuntimeError(
            "empty dataframe"
        )

    df = df.sort_index()
    df = df.dropna(subset=["Close"])

    if len(df) < 2:
        raise RuntimeError(
            "not enough price data"
        )

    current_row = df.iloc[-1]
    previous_row = df.iloc[-2]

    current = float(
        current_row["Close"]
    )

    previous = float(
        previous_row["Close"]
    )

    price_date = (
        df.index[-1]
        .strftime("%Y-%m-%d")
    )

    previous_date = (
        df.index[-2]
        .strftime("%Y-%m-%d")
    )

    change_pct = (
        current / previous - 1
    ) * 100


    # ------------------------
    # 52 week high / low
    # ------------------------

    latest_date = df.index[-1]

    cutoff = (
        latest_date -
        pd.Timedelta(days=365)
    )

    df52 = df[
        df.index >= cutoff
    ]

    high52 = float(
        df52["High"].max()
    )

    low52 = float(
        df52["Low"].min()
    )


    # ------------------------
    # YTD base
    # 해당 연도 첫 거래일 종가
    # ------------------------

    current_year = (
        latest_date.year
    )

    year_start, year_start_date = (
        first_trading_close(
            df,
            current_year
        )
    )


    # ------------------------
    # YoY base
    #
    # 현재 월의 정확히 1년 전
    # 동일 월 첫 거래일 종가
    #
    # 예:
    # 2026-09
    # -> 2025-09 첫 거래일
    # ------------------------

    yoy_year = (
        current_year - 1
    )

    yoy_month = (
        latest_date.month
    )

    yoy_base, yoy_base_date = (
        first_trading_close(
            df,
            yoy_year,
            yoy_month
        )
    )

    if yoy_base is None:
        raise RuntimeError(
            "YoY base not found"
        )

    return {
        "current": current,
        "previous": previous,
        "change_pct": change_pct,

        "high52": high52,
        "low52": low52,

        "year_start": year_start,
        "year_start_date":
            year_start_date,

        "yoy_base": yoy_base,
        "yoy_base_date":
            yoy_base_date,

        "price_date": price_date,
        "previous_date":
            previous_date,
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
            "apikey":
                SUPABASE_KEY,

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

    now = datetime.now(
        timezone.utc
    ).isoformat()

    print("=" * 90)
    print("KOREA MARKET UPDATE")
    print("=" * 90)

    for code, (
        name,
        kind
    ) in SYMBOLS.items():

        try:
            p = collect_price(
                code
            )

            row = {
                "symbol": code,
                "name": name,
                "category": kind.upper(),

                "current":
                    p["current"],

                "previous":
                    p["previous"],

                "change_pct":
                    p["change_pct"],

                "change_bp":
                    None,

                "high52":
                    p["high52"],

                "low52":
                    p["low52"],

                "year_start":
                    p["year_start"],

                "year_start_date":
                    p["year_start_date"],

                "yoy_base":
                    p["yoy_base"],

                "yoy_base_date":
                    p["yoy_base_date"],

                "price_date":
                    p["price_date"],

                "previous_date":
                    p["previous_date"],

                "source":
                    "NAVER/FDR",

                "source_symbol":
                    code,

                "updated_at":
                    now,
            }

            rows.append(row)

            print(
                f"[OK] {code} | "
                f"{name} | "
                f"CP={p['current']:,.0f} | "
                f"52H={p['high52']:,.0f} | "
                f"52L={p['low52']:,.0f} | "
                f"YTD={p['year_start']:,.0f} "
                f"({p['year_start_date']}) | "
                f"YoY={p['yoy_base']:,.0f} "
                f"({p['yoy_base_date']})"
            )

        except Exception as e:
            print(
                f"[FAIL] "
                f"{code} | "
                f"{name} | "
                f"{e}"
            )


    if not rows:
        raise RuntimeError(
            "No Korean market data collected."
        )


    supabase_upsert(
        rows
    )


    print()
    print("=" * 90)
    print(
        f"Saved {len(rows)} "
        "Korean securities "
        "to Supabase."
    )
    print("=" * 90)


if __name__ == "__main__":
    main()
