import re
import urllib.request


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 "
        "(Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 "
        "(KHTML, like Gecko) "
        "Chrome/149.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
}


def fetch(url):
    req = urllib.request.Request(
        url,
        headers=HEADERS,
    )

    with urllib.request.urlopen(
        req,
        timeout=20,
    ) as response:
        return response.read().decode(
            "utf-8",
            errors="replace",
        )


def number(text):
    return float(
        text.replace(",", "").strip()
    )


def test_gold():
    print("\n=== GOLD TEST ===")

    html = fetch(
        "https://gold-kr.web.app/"
    )

    print(
        "HTTP fetch OK:",
        len(html),
        "bytes",
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
            "International gold "
            "KRW/g not found"
        )

    if not domestic_match:
        raise RuntimeError(
            "Domestic KRX gold "
            "KRW/g not found"
        )

    gold_intl = number(
        intl_match.group(1)
    )

    gold_kr = number(
        domestic_match.group(1)
    )

    premium_calc = (
        gold_kr /
        gold_intl -
        1
    ) * 100

    print(
        "GOLD_INTL:",
        gold_intl,
        "KRW/g",
    )

    print(
        "GOLD_KR:",
        gold_kr,
        "KRW/g",
    )

    print(
        "PREMIUM calculated:",
        round(
            premium_calc,
            2,
        ),
        "%",
    )

    if premium_match:
        premium_source = float(
            premium_match
            .group(1)
            .replace(
                " ",
                "",
            )
        )

        print(
            "PREMIUM source:",
            premium_source,
            "%",
        )

        if (
            abs(
                premium_calc -
                premium_source
            ) > 0.05
        ):
            raise RuntimeError(
                "Gold premium "
                "validation mismatch"
            )

    print("GOLD TEST PASS")

def test_vkospi():
    print("\n=== VKOSPI TEST ===")

    urls = [
        (
            "https://www.investing.com/"
            "indices/kospi-volatility"
        ),
        (
            "https://kr.investing.com/"
            "indices/kospi-volatility"
        ),
    ]

    last_error = None

    for url in urls:
        try:
            print("Trying:", url)

            html = fetch(url)

            print(
                "HTTP fetch OK:",
                len(html),
                "bytes",
            )

            #
            # Diagnostic only:
            # show whether expected identity
            # strings exist in returned HTML.
            #
            for label in [
                "KSVKOSPI",
                "KOSPI Volatility",
                "KOSPI 변동성",
            ]:
                print(
                    f"label {label}:",
                    label.lower()
                    in html.lower(),
                )

            #
            # Investing pages commonly expose
            # quote values in data-test attrs.
            #
            patterns = [
                (
                    r'data-test="instrument-price-last"'
                    r'[^>]*>\s*'
                    r'([\d,.]+)'
                ),
                (
                    r'"last"\s*:\s*"?' 
                    r'([\d,.]+)'
                ),
            ]

            price = None

            for pattern in patterns:
                match = re.search(
                    pattern,
                    html,
                    flags=re.I,
                )

                if match:
                    price = number(
                        match.group(1)
                    )
                    break

            if price is None:
                raise RuntimeError(
                    "Page fetched but VKOSPI "
                    "price was not extracted"
                )

            print(
                "VKOSPI:",
                price,
            )

            print(
                "VKOSPI TEST PASS"
            )

            return

        except Exception as exc:
            last_error = exc
            print(
                "FAILED:",
                repr(exc),
            )

    raise RuntimeError(
        "All VKOSPI sources failed"
    ) from last_error


def main():
    failures = []

    try:
        test_gold()
    except Exception as exc:
        failures.append(
            ("GOLD", exc)
        )
        print(
            "\nGOLD TEST FAIL:",
            repr(exc),
        )

    try:
        test_vkospi()
    except Exception as exc:
        failures.append(
            ("VKOSPI", exc)
        )
        print(
            "\nVKOSPI TEST FAIL:",
            repr(exc),
        )

    print("\n=== SUMMARY ===")

    if not failures:
        print(
            "ALL EXTRA MARKET TESTS PASSED"
        )
        return

    for name, exc in failures:
        print(
            name,
            "FAIL:",
            repr(exc),
        )

    raise SystemExit(1)


if __name__ == "__main__":
    main()
