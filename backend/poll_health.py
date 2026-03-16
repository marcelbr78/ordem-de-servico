import urllib.request
import time
import json

print("Checking for deployment (V3)...")
start = time.time()
while time.time() - start < 420: # 7 minutes
    try:
        with urllib.request.urlopen('https://os4u-backend.onrender.com/health', timeout=10) as f:
            res = f.read().decode()
            data = json.loads(res)
            print(f"[{time.strftime('%H:%M:%S')}] Health: {data}")
            if data.get('debug') == 'V4':
                print("Deployment SUCCESSFUL! V4 is live.")
                exit(0)
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] Waiting for server... ({e})")
    time.sleep(20)

print("Timed out waiting for V3.")
exit(1)
