import FinanceDataReader as fdr
from datetime import datetime, timedelta

SYMBOLS = {
    "133690": "TIGER 미국나스닥100",
    "360750": "TIGER 미국S&P500",
    "441640": "KODEX 미국배당커버드콜액티브",
    "0019K0": "TIME 나스닥채권50액티브",
    "251600": "PLUS 고배당주채권혼합60",
    "411060": "ACE KRX금현물",
    "0113D0": "TIME 글로벌탑픽액티브",
    "0060H0": "TIGER 토탈월드스탁액티브",
    "469830": "SOL 초단기채권액티브",
    "161510": "PLUS 고배당주",
    "466940": "TIGER 은행고배당플러스TOP10",
    "466920": "SOL 조선TOP3플러스",
    "449450": "PLUS K방산",
    "434730": "HANARO 원자력 iSELECT",
    "473640": "HANARO 글로벌금채굴기업",
    "570100": "한투 일본종합상사TOP5 ETN",
    "494670": "TIGER 조선TOP10",
    "421320": "PLUS 우주항공",
    "033780": "KT&G",
    "005930": "삼성전자",
    "005935": "삼성전자우",
}

start = (
    datetime.now() - timedelta(days=20)
).strftime("%Y-%m-%d")

ok = []
fail = []

print("=" * 80)
print("KOREA PRICE SOURCE TEST")
print("Source: FinanceDataReader / NAVER")
print("=" * 80)

for code, name in SYMBOLS.items():

    try:
        df = fdr.DataReader(
            f"NAVER:{code}",
            start
        )

        if df is None or df.empty:
            raise RuntimeError(
                "empty dataframe"
            )

        df = df.dropna(
            subset=["Close"]
        )

        if df.empty:
            raise RuntimeError(
                "no valid close price"
            )

        last = df.iloc[-1]

        prev = (
            df.iloc[-2]
            if len(df) >= 2
            else None
        )

        current = float(
            last["Close"]
        )

        previous = (
            float(prev["Close"])
            if prev is not None
            else None
        )

        price_date = (
            df.index[-1]
            .strftime("%Y-%m-%d")
        )

        previous_date = (
            df.index[-2]
            .strftime("%Y-%m-%d")
            if len(df) >= 2
            else None
        )

        change_pct = (
            (
                current /
                previous -
                1
            ) * 100
            if previous
            else None
        )

        ok.append(code)

        print(
            f"[OK] {code} | "
            f"{name} | "
            f"{price_date} | "
            f"{current:,.0f} | "
            f"prev={previous:,.0f} | "
            f"{change_pct:+.2f}%"
        )

    except Exception as e:

        fail.append(
            (code, name, str(e))
        )

        print(
            f"[FAIL] {code} | "
            f"{name} | {e}"
        )


print()
print("=" * 80)
print(
    f"RESULT: "
    f"{len(ok)} OK / "
    f"{len(fail)} FAIL"
)
print("=" * 80)

if fail:

    print()
    print("FAILED SYMBOLS")

    for code, name, error in fail:
        print(
            f"{code} | "
            f"{name} | "
            f"{error}"
        )
