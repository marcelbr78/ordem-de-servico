import json

with open('migrate_data_infosend.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

# Capture only ORDER SERVICES section
lines = sql.split('\n')
os_sql = []
in_os = False
for line in lines:
    if '-- ORDER SERVICES' in line: in_os = True
    elif line.startswith('-- ') and in_os: break
    if in_os and line.strip().startswith('INSERT'):
        os_sql.append(line.strip())

with open('debug_os.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(os_sql[:5]))

print(f"Captured {len(os_sql)} OS insert statements. Sample in debug_os.sql")
