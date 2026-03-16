import urllib.request
import json

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

    res = post(f"{API_URL}/admin/tenants/run-sql", {"sql": "SELECT id FROM order_services"}, token=token)
    ids = [r['id'] for r in res['results'][0]['data']]
    print(json.dumps(ids))

except Exception as e:
    print(f"Error: {e}")
