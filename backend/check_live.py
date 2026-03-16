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

    queries = [
        'SELECT COUNT(*) FROM clients WHERE "tenantId" = \'94dfa64e-9b02-4a2c-aadd-b364a225fe2c\'',
        'SELECT COUNT(*) FROM order_services WHERE "tenantId" = \'94dfa64e-9b02-4a2c-aadd-b364a225fe2c\'',
        'SELECT COUNT(*) FROM products WHERE "tenantId" = \'94dfa64e-9b02-4a2c-aadd-b364a225fe2c\''
    ]

    for q in queries:
        res = post(f"{API_URL}/admin/tenants/run-sql", {"sql": q}, token=token)
        print(f"Query: {q} => Result: {res['results']}")

except Exception as e:
    print(f"Error: {e}")
