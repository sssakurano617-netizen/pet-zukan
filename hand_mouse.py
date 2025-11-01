# hand_mouse.py
import os, cv2, numpy as np, mediapipe as mp, pyautogui, time

# ===== 設定 =====
CAM_INDEX = 0          # ← camera_test.py で映った番号に
TARGET_FPS = 30
FRAME_W, FRAME_H = 1280, 720  # 軽くて十分なサイズ

SMOOTH_ALPHA = 0.35    # 0〜1 大きいほど滑らか（遅くなる）
MARGIN = 0.10          # 画面の外周10%を無効にして暴れ抑制
PINCH_ON = 0.04        # クリックONしきい値（親指-人差し指）
PINCH_OFF = 0.055      # クリックOFFしきい値（ヒステリシス）
VEL_CAP = 1600         # 1秒あたりの最大移動px（暴走制御）

# ===== 前処理 =====
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
pyautogui.FAILSAFE = False
screen_w, screen_h = pyautogui.size()

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1,
                       min_detection_confidence=0.7,
                       min_tracking_confidence=0.7,
                       model_complexity=1)
draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(CAM_INDEX)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_W)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_H)
cap.set(cv2.CAP_PROP_FPS, TARGET_FPS)
if not cap.isOpened():
    raise RuntimeError(f"カメラ {CAM_INDEX} を開けません。番号を変えてください。")

# 状態
cur_x, cur_y = screen_w//2, screen_h//2
clicking = False
prev_t = time.time()

def clamp01(v): return 0.0 if v < 0 else 1.0 if v > 1 else v

while True:
    ok, frame = cap.read()
    if not ok:
        print("フレーム取得失敗")
        break

    frame = cv2.flip(frame, 1)
    h, w = frame.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    res = hands.process(rgb)

    now = time.time()
    dt = max(1e-3, now - prev_t)  # 経過秒
    prev_t = now

    if res.multi_hand_landmarks:
        lm = res.multi_hand_landmarks[0]
        index_tip = lm.landmark[8]
        thumb_tip = lm.landmark[4]

        # ====== 画面中央80%にリマップ（端の暴れ抑制）======
        nx = (index_tip.x - MARGIN) / (1 - 2*MARGIN)
        ny = (index_tip.y - MARGIN) / (1 - 2*MARGIN)
        nx, ny = clamp01(nx), clamp01(ny)

        target_x = int(nx * screen_w)
        target_y = int(ny * screen_h)

        # ====== 速度制限 + 指数移動平均でヌルヌル化 ======
        max_step = int(VEL_CAP * dt)             # このフレームで動ける最大px
        dx, dy = target_x - cur_x, target_y - cur_y
        if abs(dx) > max_step: dx = np.sign(dx) * max_step
        if abs(dy) > max_step: dy = np.sign(dy) * max_step
        cur_x += int(dx * SMOOTH_ALPHA)
        cur_y += int(dy * SMOOTH_ALPHA)

        pyautogui.moveTo(cur_x, cur_y, duration=0)  # 遅延なし

        # ====== ピンチでクリック（ヒステリシス）======
        dist = np.hypot(index_tip.x - thumb_tip.x, index_tip.y - thumb_tip.y)
        if (not clicking) and dist < PINCH_ON:
            clicking = True
            pyautogui.click()
            print("🖱️ click")
        elif clicking and dist > PINCH_OFF:
            clicking = False

        # ====== 赤丸（大） & 目印描画 ======
        cx, cy = int(index_tip.x * w), int(index_tip.y * h)
        cv2.circle(frame, (cx, cy), 18, (0, 0, 255), thickness=-1)  # ★大きめ赤丸
        # 骨格は軽く（重ければ次行をコメントアウト）
        draw.draw_landmarks(frame, lm, mp_hands.HAND_CONNECTIONS)

    cv2.putText(frame, "ESC to exit", (10, 26),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (40,40,40), 2)
    cv2.imshow("Hand Mouse", frame)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
