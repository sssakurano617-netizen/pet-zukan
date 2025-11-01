# paw_mouse.py
import time
import cv2
import numpy as np
from selenium import webdriver
from selenium.webdriver.chrome.service import Service

# ====== 設定 ======
START_URL = "http://localhost:3000/role-battle/dog/ready"  # 開きたいページ
CAM_INDEX = 0                                              # さっきのテストで映った番号
TEMPLATE_PATH = "public/images/paw.jpg"                    # 肉球テンプレート
THRESH = 0.45                                             # しきい値（反応しない→下げる / 誤反応→上げる）
SMOOTH_ALPHA = 0.3                                         # カーソルのなめらかさ（0〜1, 大きいほど滑らか）

# ====== 1) ブラウザ起動 & JS注入（ページ改変なし） ======
driver = webdriver.Chrome(service=Service())
driver.get(START_URL)

INJECT_JS = r"""
(() => {
  if (window.__pawInjected) return;
  window.__pawInjected = true;

  const cursor = document.createElement('div');
  cursor.id = 'paw-cursor';
  Object.assign(cursor.style, {
    position:'fixed', left:'0px', top:'0px',
    width:'24px', height:'24px', borderRadius:'50%',
    background:'rgba(0,200,0,0.6)', boxShadow:'0 0 0 3px rgba(0,200,0,0.25)',
    pointerEvents:'none', zIndex: 2147483647, transform:'translate(-1000px,-1000px)',
    transition:'transform 30ms linear'
  });
  document.body.appendChild(cursor);

  let lastEl = null;
  let lastStart = 0;
  const DWELL_MS = 2000; // ★ 2秒でクリック

  // マージンでオートスクロール（任意）
  const edge = 24, speed = 12;
  function autoscroll(x,y){
    const h = window.innerHeight, w = window.innerWidth;
    if (y < edge) window.scrollBy(0, -speed);
    else if (y > h - edge) window.scrollBy(0, speed);
    if (x < edge) window.scrollBy(-speed, 0);
    else if (x > w - edge) window.scrollBy(speed, 0);
  }

  window.pawMove = (x, y) => {
    // カーソル表示
    cursor.style.transform = `translate(${x-12}px, ${y-12}px)`;

    // 画面内に丸め
    x = Math.max(0, Math.min(window.innerWidth - 1, x|0));
    y = Math.max(0, Math.min(window.innerHeight - 1, y|0));
    autoscroll(x,y);

    const el = document.elementFromPoint(x, y);
    const now = performance.now();

    if (el === null) { lastEl = null; lastStart = now; return; }

    // 同じ要素の上で静止 → 2秒で click()
    if (el === lastEl) {
      if (now - lastStart >= DWELL_MS) {
        // クリック実行（実ブラウザイベント）
        el.click();
        lastStart = now + 1e9; // 連打防止：離れるまで再クリック無効
      }
    } else {
      lastEl = el;
      lastStart = now;
    }
  };
})();
"""
driver.execute_script(INJECT_JS)

# ビューポートサイズ（JSで取得）
def get_viewport():
    w = driver.execute_script("return window.innerWidth")
    h = driver.execute_script("return window.innerHeight")
    return int(w), int(h)

vw, vh = get_viewport()

# ====== 2) カメラ起動 & 肉球検出 ======
templ_bgr = cv2.imread(TEMPLATE_PATH)
if templ_bgr is None:
    raise FileNotFoundError(f"テンプレートが見つかりません: {TEMPLATE_PATH}")
templ = cv2.cvtColor(templ_bgr, cv2.COLOR_BGR2GRAY)
tH, tW = templ.shape

cap = cv2.VideoCapture(CAM_INDEX, cv2.CAP_AVFOUNDATION)
cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

if not cap.isOpened():
    raise RuntimeError("カメラが開けません。使用中アプリ/権限を確認してください。")

print("🐾 準備OK：肉球をカメラに映してください。q で終了。")

sx, sy = None, None  # 平滑化用（画面座標）

while True:
    ok, frame = cap.read()
    if not ok:
        continue

    # 直感的にするため左右反転（鏡映像）
    frame = cv2.flip(frame, 1)

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    res = cv2.matchTemplate(gray, templ, cv2.TM_CCOEFF_NORMED)
    _, max_val, _, max_loc = cv2.minMaxLoc(res)

    # 検出時：中心座標
    if max_val >= THRESH:
        x, y = max_loc
        cx, cy = x + tW // 2, y + tH // 2

        # 画面座標にマッピング
        h_cam, w_cam = gray.shape
        ux = int(cx / w_cam * vw)
        uy = int(cy / h_cam * vh)

        # 平滑化（なめらかに）
        if sx is None:
            sx, sy = ux, uy
        else:
            sx = int(SMOOTH_ALPHA * ux + (1 - SMOOTH_ALPHA) * sx)
            sy = int(SMOOTH_ALPHA * uy + (1 - SMOOTH_ALPHA) * sy)

        try:
            # JS の window.pawMove(x,y) を呼ぶ（ページ改変なし）
            driver.execute_script("window.pawMove && window.pawMove(arguments[0], arguments[1]);", sx, sy)
        except Exception:
            # 画面遷移で関数が消えたら再注入
            try:
                driver.execute_script(INJECT_JS)
            except Exception:
                pass

        # ビジュアルデバッグ
        cv2.circle(frame, (cx, cy), 10, (0,255,0), 2)
        cv2.putText(frame, f"{max_val:.2f}", (x, max(0, y-8)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)
    else:
        # 見つからないときはカーソルを画面外へ（誤クリック防止）
        try:
            driver.execute_script("window.pawMove && window.pawMove(-9999, -9999);")
        except Exception:
            pass

    cv2.imshow("paw_mouse (q to quit)", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
driver.quit()
