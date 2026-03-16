import sqlite3
import json

db_path = 'lib_interno_correct.sqlite'
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row['name'] for row in cursor.fetchall()]
print(f"Found tables: {tables}")

data = {}
for table in tables:
    try:
        cursor.execute(f'SELECT * FROM "{table}"')
        rows = [dict(row) for row in cursor.fetchall()]
        data[table] = rows
        print(f"Read {len(rows)} rows from {table}")
    except Exception as e:
        print(f"Error reading {table}: {e}")

with open('dump_full_data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

conn.close()
print("Done! Data saved to dump_full_data.json")
