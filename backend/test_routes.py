import urllib.request
import urllib.parse
import json

API_URL = 'https://os4u-backend.onrender.com'

def get(url, token=None):
    req = urllib.request.Request(url)
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as f:
        return json.loads(f.read().decode('utf-8'))

def post(url, data, token=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'))
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as f:
        return json.loads(f.read().decode('utf-8'))

try:
    print('Logging in as Master...')
    login_data = post(f"{API_URL}/auth/login", {"email": "master@os4u.com.br", "password": "master123"})
    token = login_data['access_token']
    print('Login successful.')

    print('Testing /admin/tenants...')
    res = get(f"{API_URL}/admin/tenants", token=token)
    print(f"Success! Found {len(res['data'])} tenants.")

    print('Testing /admin/tenants/run-sql...')
    try:
        post(f"{API_URL}/admin/tenants/run-sql", {"sql": ""}, token=token)
    except Exception as e:
        print(f"Migration test result: {e}")
        if hasattr(e, 'read'):
            print(e.read().decode('utf-8'))

except Exception as e:
    print(f"Test failed: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
