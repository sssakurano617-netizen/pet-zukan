import cv2, time
from selenium import webdriver
from selenium.webdriver.common.by import By

# ====== 設定 ======
PAGE_URL = "http://localhost:3000/role-battle/dog/ready"  # 開きたいページ
TEMPLATE_PATH = "public/images/paw.jpg"  # 登録した肉球画像
THRESH = 0.65  # 検出のしきい値（小さくすると緩く、大きいと厳しく）

# ====== 1) ブラウザを開く ======
driver = webdriver.Chrome()
driver.get(PAGE_URL)

# ====== 2) OpenCVで肉球を検出 ======
cap = cv2.VideoCapture(0)
template = cv2.imread(TEMPLATE_PATH, 0)
if template is None:
    raise FileNotFoundError(f"肉球画像が見つかりません: {TEMPLATE_PATH}")
w, h = template.shape[::-1]

print("カメラ起動 → 肉球を映してみてください 🐾")

while True:
    ret, frame = cap.read()
    if not ret:
        continue

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    res = cv2.matchTemplate(gray, template, cv2.TM_CCOEFF_NORMED)
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)

    if max_val > THRESH:
        print("🐾 肉球検出！Web操作を実行します")
        try:
            # 例: Readyページに「ラスボスと戦う」というリンクがある場合
            btn = driver.find_element(By.LINK_TEXT, "ラスボスと戦う")
            btn.click()
            print("👉 ボタンをクリックしました")
        except Exception as e:
            print("⚠️ ボタンが見つからなかった:", e)

        time.sleep(2)  # 連続検出を防ぐ

    cv2.imshow("camera", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()
driver.quit()
