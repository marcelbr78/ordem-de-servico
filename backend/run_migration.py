import urllib.request
import urllib.parse
import json
import os

API_URL = 'https://os4u-backend.onrender.com'
SQL_PATH = 'migrate_data_infosend.sql'

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

    with open(SQL_PATH, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    print(f"Executing migration ({len(sql_content)} bytes)...")
    res = post(f"{API_URL}/admin/tenants/migration/execute", {"sql": sql_content}, token=token)

    print('Migration finished!')
    print(f"Total statements: {res['total']}")
    
    errors = [r for r in res['results'] if r['status'] == 'error']
    if errors:
        print(f"Finished with {len(errors)} errors.")
        with open('migration_errors.json', 'w', encoding='utf-8') as f:
            json.dump(errors, f, indent=2)
        print('Errors saved to migration_errors.json')
    else:
        print('All statements executed successfully!')

except Exception as e:
    print(f"Migration failed: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
