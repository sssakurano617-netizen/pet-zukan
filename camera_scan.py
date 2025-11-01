# camera_scan.py
import cv2, time

def try_open(idx):
    cap = cv2.VideoCapture(idx, cv2.CAP_AVFOUNDATION)
    ok = cap.isOpened()
    if not ok:
        return False
    ok, frame = cap.read()
    cap.release()
    return bool(ok and frame is not None)

cands = []
for i in range(0, 6):
    ok = try_open(i)
    print(f"index {i}: {'OK' if ok else 'NG'}")
    if ok: cands.append(i)

if not cands:
    print("❌ 使えるカメラが見つかりませんでした。他アプリの使用停止・権限確認をしてから再実行してください。")
else:
    print(f"✅ 使用可能: {cands} 例: 最初の {cands[0]} を使ってください。")
