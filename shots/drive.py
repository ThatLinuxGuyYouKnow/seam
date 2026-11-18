import time
from playwright.sync_api import sync_playwright

URL = "http://localhost:8081"
OUT = "/home/alabi-ayobami/seam/shots/drive-video"

def slow_scroll(page, px=600, steps=8, gap=0.35):
    for _ in range(steps):
        page.evaluate(f"window.scrollBy(0, {px//steps})")
        time.sleep(gap)

def scroll_top(page):
    page.evaluate("window.scrollTo(0, 0)")
    time.sleep(0.6)

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
        record_video_dir=OUT, record_video_size={"width": 390, "height": 844},
    )
    page = ctx.new_page()
    page.goto(URL)
    page.wait_for_timeout(4000)  # boot + router

    # 1. HOME: soak + slow scroll down and back
    slow_scroll(page, 500, 6, 0.4)
    time.sleep(1.0)
    scroll_top(page)
    time.sleep(1.0)

    # 2. MINT: open, mint demo 100 sats
    try:
        page.get_by_text("Top up: Lightning").first.click(timeout=5000)
    except Exception:
        page.goto(URL + "/mint")
    page.wait_for_timeout(2500)
    slow_scroll(page, 200, 3, 0.3)
    try:
        page.get_by_text("Mint 100 sats (demo)").first.click(timeout=5000)
    except Exception:
        pass
    page.wait_for_timeout(4000)  # toast + balance update
    slow_scroll(page, 200, 3, 0.3)
    time.sleep(1.0)

    # 3. SEND: open, fill, seal token -> QR
    try:
        page.get_by_text("Send offline", exact=False).first.click(timeout=5000)
    except Exception:
        page.goto(URL + "/send")
    page.wait_for_timeout(2500)
    try:
        page.get_by_text("Seal token").first.click(timeout=5000)
    except Exception:
        pass
    page.wait_for_timeout(4500)  # QR + copy text render
    slow_scroll(page, 400, 5, 0.35)
    time.sleep(1.0)

    # 4. RECEIVE: scroll only (no network claim tap)
    try:
        page.get_by_text("Receive / claim", exact=False).first.click(timeout=5000)
    except Exception:
        page.goto(URL + "/receive")
    page.wait_for_timeout(2500)
    slow_scroll(page, 400, 5, 0.35)
    scroll_top(page)

    # 5. SETTINGS: scroll the low-bandwidth story, hold to end
    try:
        page.get_by_text("Settings, relays", exact=False).first.click(timeout=5000)
    except Exception:
        page.goto(URL + "/settings")
    page.wait_for_timeout(2500)
    slow_scroll(page, 700, 8, 0.35)
    time.sleep(2.0)
    scroll_top(page)
    time.sleep(2.5)

    ctx.close()
    browser.close()
print("drive done")
