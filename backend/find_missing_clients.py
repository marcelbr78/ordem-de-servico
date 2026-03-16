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

    # Get live client IDs
    res = post(f"{API_URL}/admin/tenants/run-sql", {"sql": 'SELECT id FROM clients WHERE "tenantId" = \'94dfa64e-9b02-4a2c-aadd-b364a225fe2c\''}, token=token)
    live_ids = [r['id'] for r in res['results'][0]['data']]

    with open('dump_full_data.json', 'r', encoding='utf-8') as f:
        legacy_clients = json.load(f)['clients']

    missing = [c for c in legacy_clients if c['id'] not in live_ids]
    
    print(f"Missing clients: {len(missing)}")
    for c in missing:
        print(f"ID: {c['id']} - Name: {c['nome']}")

except Exception as e:
    print(f"Error: {e}")
