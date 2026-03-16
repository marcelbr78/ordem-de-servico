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

    with open('migrate_data_infosend.sql', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Get only Order Services
    os_queries = [l.strip() for l in lines if l.strip().startswith('INSERT INTO "order_services"')]
    
    print(f"Executing {len(os_queries)} OS queries...")
    res = post(f"{API_URL}/admin/tenants/run-sql", {"sql": ";\n".join(os_queries)}, token=token)
    
    errors = [r for r in res['results'] if r['status'] == 'error']
    print(f"Success: {len(res['results']) - len(errors)}, Errors: {len(errors)}")
    for e in errors[:5]:
        print(f"Error: {e['message']}")

except Exception as e:
    print(f"Error: {e}")
