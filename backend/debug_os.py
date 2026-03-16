import urllib.request
import json
import os

API_URL = 'https://os4u-backend.onrender.com'

def post(url, data, token=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'))
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as f:
        return json.loads(f.read().decode('utf-8'))

try:
    login_data = post(f"{API_URL}/auth/login", {"email": "master@os4u.com.br", "password": "master123"})
    token = login_data['access_token']

    with open('debug_os.sql', 'r', encoding='utf-8') as f:
        sql = f.read()

    res = post(f"{API_URL}/admin/tenants/run-sql", {"sql": sql}, token=token)
    print(json.dumps(res, indent=2))

except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
