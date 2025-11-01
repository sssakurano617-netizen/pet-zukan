import cv2

cap = cv2.VideoCapture(0)  # 0を1,2に変えて試す
if not cap.isOpened():
    print("❌ カメラが開けません")
    exit()

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ フレーム取得失敗")
        break

    cv2.imshow("Camera Test", frame)
    if cv2.waitKey(1) & 0xFF == 27:  # ESCで終了
        break

cap.release()
cv2.destroyAllWindows()
