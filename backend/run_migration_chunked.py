import urllib.request
import urllib.parse
import json

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

    # Split by semicolon but ignore comments/newlines
    statements = [s.strip() for s in sql_content.split(';') if s.strip() and not s.strip().startswith('--')]
    
    # Chunk size: 20 statements
    chunk_size = 20
    total_chunks = (len(statements) + chunk_size - 1) // chunk_size
    
    print(f"Total statements: {len(statements)}. Processing in {total_chunks} chunks...")

    for i in range(0, len(statements), chunk_size):
        chunk = statements[i:i + chunk_size]
        chunk_sql = ";\n".join(chunk) + ";"
        print(f"Executing chunk {i//chunk_size + 1}/{total_chunks}...")
        res = post(f"{API_URL}/admin/tenants/run-sql", {"sql": chunk_sql}, token=token)
        
        errors = [r for r in res['results'] if r['status'] == 'error']
        if errors:
            print(f"  Warning: {len(errors)} errors in this chunk.")
            for e in errors:
                print(f"    - {e['message']}")

    print('Migration finished!')

except Exception as e:
    print(f"Migration failed: {e}")
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
