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

    #
    # Keep the test deliberately broad.
    # We first confirm the labels exist,
    # then extract nearby KRW/g values.
    #
    for label in [
        "국내",
        "국제",
        "KRX",
        "괴리",
    ]:
        print(
            f"label {label}:",
            label in html,
        )

    krw_g = re.findall(
        r"([\d,]+(?:\.\d+)?)\s*원\s*/?\s*g",
        html,
        flags=re.I,
    )

    if not krw_g:
        krw_g = re.findall(
            r"₩\s*([\d,]+(?:\.\d+)?)\s*/?\s*g",
            html,
            flags=re.I,
        )

    values = [
        number(x)
        for x in krw_g
    ]

    print(
        "KRW/g candidates:",
        values[:20],
    )

        #
    # Diagnostic snippets around
    # gold-related labels/values.
    #
    diagnostic_terms = [
        "국내",
        "국제",
        "KRX",
        "괴리",
        "197428",
    ]

    print("\n--- GOLD HTML DIAGNOSTICS ---")

    for term in diagnostic_terms:
        pos = html.find(term)

        if pos < 0:
            print(
                f"{term}: NOT FOUND"
            )
            continue

        start = max(
            0,
            pos - 300,
        )

        end = min(
            len(html),
            pos + 500,
        )

        snippet = (
            html[start:end]
            .replace("\n", " ")
            .replace("\r", " ")
        )

        print(
            f"\n[{term}]\n",
            snippet,
        )
    if len(values) < 2:
        raise RuntimeError(
            "Could not extract two gold KRW/g values"
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
