# -*- coding: utf-8 -*-
"""
ターミナル一発で：
  1) Chrome起動（Selenium）
  2) JS注入して仮想カーソルを用意（2秒静止で click）
  3) カメラ起動（OpenCV）→ 緑色領域の重心をブラウザに送る
使い方例:
  python3 paw_mouse_color.py --url http://localhost:3000/role-battle --cam 0
"""

import argparse, sys, time
import cv2, numpy as np
from selenium import webdriver
from selenium.webdriver.chrome.service import Service

def log(*a):
    print("[paw]", *a); sys.stdout.flush()

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--url", default="http://localhost:3000/role-battle",
                   help="開くURL（ポートが3001/3002ならここを合わせる）")
    p.add_argument("--cam", type=int, default=0,
                   help="カメラ番号（FaceTime HD は 0 が多い）")
    p.add_argument("--mirror", action="store_true", default=True,
                   help="左右反転（デフォルトON）")
    p.add_argument("--dwell", type=int, default=2000,
                   help="静止クリックまでのミリ秒（既定: 2000ms）")
    p.add_argument("--w", type=int, default=1280)
    p.add_argument("--h", type=int, default=720)
    return p.parse_args()

INJECT_JS_TEMPLATE = r"""
(() => {
  if (window.__pawInjected) return;
  window.__pawInjected = true;

  const cursor = document.createElement('div');
  Object.assign(cursor.style, {
    position:'fixed', left:'0', top:'0',
    width:'24px', height:'24px', borderRadius:'50%',
    background:'rgba(0,200,0,0.6)',
    boxShadow:'0 0 0 3px rgba(0,200,0,0.25)',
    pointerEvents:'none', zIndex: 2147483647,
    transform:'translate(-10000px,-10000px)',
    transition:'transform 30ms linear'
  });
  document.body.appendChild(cursor);

  let lastEl = null;
  let lastStart = 0;
  const DWELL_MS = %d;

  const edge = 24, speed = 12;
  function autoscroll(x,y){
    const h = innerHeight, w = innerWidth;
    if (y < edge) scrollBy(0, -speed);
    else if (y > h - edge) scrollBy(0, speed);
    if (x < edge) scrollBy(-speed, 0);
    else if (x > w - edge) scrollBy(speed, 0);
  }

  window.pawMove = (x, y) => {
    cursor.style.transform = `translate(${x-12}px, ${y-12}px)`;
    x = Math.max(0, Math.min(innerWidth-1, x|0));
    y = Math.max(0, Math.min(innerHeight-1, y|0));
    autoscroll(x,y);

    const el = document.elementFromPoint(x, y);
    const now = performance.now();
    if (!el) { lastEl = null; lastStart = now; return; }

    if (el === lastEl) {
      if (now - lastStart >= DWELL_MS) {
        el.click();
        lastStart = now + 1e9; // 連打防止
      }
    } else {
      lastEl = el;
      lastStart = now;
    }
  };
})();
"""

def main():
    args = parse_args()

    # --- 1) Chrome 起動 ---
    log("Chrome起動:", args.url)
    try:
        driver = webdriver.Chrome(service=Service())
    except Exception as e:
        log("❌ ChromeDriver 起動に失敗。`brew install chromedriver` 済みか、ChromeとDriverのバージョンを確認。")
        raise
    driver.get(args.url)

    # JS注入
    inject_js = INJECT_JS_TEMPLATE % (args.dwell,)
    log("JSを注入（仮想カーソル & 2秒静止クリック）")
    driver.execute_script(inject_js)

    # ビューポート
    vw = int(driver.execute_script("return window.innerWidth"))
    vh = int(driver.execute_script("return window.innerHeight"))
    log(f"viewport: {vw}x{vh}")

    # --- 2) カメラ ---
    log(f"カメラ起動: index={args.cam}  解像度={args.w}x{args.h}")
    cap = cv2.VideoCapture(args.cam, cv2.CAP_AVFOUNDATION)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  args.w)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, args.h)
    if not cap.isOpened():
        log("❌ カメラが開けません。他アプリの使用/権限を確認（設定>プライバシー>カメラ）")
        driver.quit()
        return

    # 緑のHSVレンジ（広めに設定。必要に応じて調整）
    lower = np.array([30, 50, 50])   # H,S,V
    upper = np.array([95,255,255])
    area_min = 2000

    smooth_alpha = 0.35
    sx = sy = None
    last_js = 0

    log("準備OK。緑の肉球をカメラに映してください。q で終了。")
    while True:
        ok, frame = cap.read()
        if not ok: continue
        if args.mirror:
            frame = cv2.flip(frame, 1)

        hsv  = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        mask = cv2.inRange(hsv, lower, upper)
        mask = cv2.medianBlur(mask, 5)
        kernel = np.ones((5,5), np.uint8)
        mask = cv2.erode(mask, kernel, 1)
        mask = cv2.dilate(mask, kernel, 2)

        cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cx = cy = None; best_area = 0
        for c in cnts:
            a = cv2.contourArea(c)
            if a < area_min: continue
            if a > best_area:
                M = cv2.moments(c)
                if M["m00"] != 0:
                    best_area = a
                    cx = int(M["m10"]/M["m00"]); cy = int(M["m01"]/M["m00"])

        h_cam, w_cam = frame.shape[:2]
        if cx is not None:
            # デバッグ表示
            cv2.circle(frame, (cx,cy), 10, (0,255,0), 2)
            cv2.putText(frame, f"area={best_area:.0f}", (10,30),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

            ux = int(cx / w_cam * vw)
            uy = int(cy / h_cam * vh)
            if sx is None: sx, sy = ux, uy
            else:
                sx = int(smooth_alpha*ux + (1-smooth_alpha)*sx)
                sy = int(smooth_alpha*uy + (1-smooth_alpha)*sy)

            now = time.time()
            if now - last_js > 0.03:
                try:
                    driver.execute_script("window.pawMove && window.pawMove(arguments[0], arguments[1]);", int(sx), int(sy))
                except Exception:
                    # 画面遷移で消えた場合は再注入
                    try: driver.execute_script(inject_js)
                    except Exception: pass
                last_js = now
        else:
            # 見つからない→画面外へ
            try: driver.execute_script("window.pawMove && window.pawMove(-9999,-9999);")
            except Exception: pass
            cv2.putText(frame, "no green paw", (10,30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)

        # プレビュー（右にマスクを出す）
        mask_bgr = cv2.cvtColor(mask, cv2.COLOR_GRAY2BGR)
        view = np.hstack([frame, mask_bgr])
        cv2.imshow("paw_mouse | left: camera / right: green mask | q=quit", view)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    driver.quit()
    log("終了しました。")

if __name__ == "__main__":
    main()
