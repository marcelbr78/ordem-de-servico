import json

with open('dump_full_data.json', 'r', encoding='utf-8') as f:
    legacy = json.load(f)['order_services']

with open('live_ids.json', 'r', encoding='utf-8') as f:
    live = json.load(f)

missing = [os for os in legacy if os['id'] not in live]
print(f"Missing count: {len(missing)}")
if missing:
    print("Example missing order details:")
    m = missing[0]
    print(json.dumps(m, indent=2))
