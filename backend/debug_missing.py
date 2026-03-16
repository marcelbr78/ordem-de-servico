import json

with open('dump_full_data.json', 'r', encoding='utf-8') as f:
    legacy = json.load(f)['order_services']

# Read with error handling for the live_ids file
try:
    with open('live_ids.json', 'rb') as f:
        content = f.read()
        # Handle UTF-16 from PowerShell
        if content.startswith(b'\xff\xfe'):
            content = content.decode('utf-16')
        else:
            content = content.decode('utf-8')
        live = json.loads(content)
except Exception as e:
    print(f"Error reading live_ids: {e}")
    live = []

missing = [os for os in legacy if os['id'] not in live]
print(f"Missing count: {len(missing)}")
for m in missing[:5]:
    print(f"ID: {m['id']} - Tech: {m['technicianId']} - Protocol: {m['protocol']}")
