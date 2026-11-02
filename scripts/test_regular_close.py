
import json
import urllib.request

BASE = "https://m.stock.naver.com/api/stock"

SYMBOLS = {
    "033780": "KT&G",
    "005930": "Samsung Electronics",
    "005935": "Samsung Electronics Preferred",
}

TARGET = "2026-10-30"

def get_json(url):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
            "Referer": "https://m.stock.naver.com/",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as res:
        return json.load(res)

for code, name in SYMBOLS.items():
    print(f"\n=== {code} {name} ===")

    try:
        info = get_json(f"{BASE}/{code}/integration")
        for item in info.get("totalInfos", []):
            if item.get("code") in (
                "lastClosePrice",
                "closePrice",
            ):
                print("INTEGRATION:", item)
    except Exception as e:
        print("INTEGRATION ERROR:", repr(e))

    try:
        rows = get_json(
            f"{BASE}/{code}/price?pageSize=20&page=1"
        )
        if not isinstance(rows, list):
            print("PRICE RESPONSE:", type(rows).__name__)
            continue

        for row in rows:
            if row.get("localTradedAt") == TARGET:
                print("TARGET DAILY ROW:", row)
                break
        else:
            print("TARGET DATE NOT FOUND")
    except Exception as e:
        print("PRICE ERROR:", repr(e))

print("\nREAD-ONLY TEST COMPLETE")
