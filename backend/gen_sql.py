import json
import uuid

INFOSEND_ID = '94dfa64e-9b02-4a2c-aadd-b364a225fe2c'
DEFAULT_ADMIN_ID = '840f17ca-f57c-4c2e-9470-df245a331dea'

def format_val(v):
    if v is None:
        return 'NULL'
    if isinstance(v, bool):
        return 'TRUE' if v else 'FALSE'
    if isinstance(v, str):
        v_esc = v.replace("'", "''")
        return f"'{v_esc}'"
    return str(v)

def generate_insert(table, data_list, tenant_id_col='tenantId', remove_cpf=False):
    if not data_list:
        return ""
    
    sql = ""
    for row in data_list:
        if tenant_id_col:
            row[tenant_id_col] = INFOSEND_ID
        
        if remove_cpf and 'cpfCnpj' in row:
            row['cpfCnpj'] = None

        if row.get('technicianId') == '00000000-0000-0000-0000-000000000000':
            row['technicianId'] = DEFAULT_ADMIN_ID

        # Ensure we don't have 'system' as UUID if the column expects UUID
        # Some tables like order_history might have userId='system'
        if table == 'order_history' and row.get('userId') == 'system':
            row['userId'] = None

        for k, v in row.items():
            if k in ['isActive', 'active', 'principal', 'isMain', 'waMsgSent', 'mustChangePassword'] and v in [1, 0]:
                row[k] = True if v == 1 else False

        cols = row.keys()
        vals = [format_val(row[c]) for c in cols]
        
        quoted_table = f'"{table}"'
        quoted_cols = [f'"{c}"' for c in cols]
        
        sql += f"INSERT INTO {quoted_table} ({', '.join(quoted_cols)}) VALUES ({', '.join(vals)}) ON CONFLICT (id) DO NOTHING;\n"
    return sql

with open('dump_full_data.json', 'r', encoding='utf-8') as f:
    full_data = json.load(f)

final_sql = f"-- MIGRAÇÃO DATA INFOSEND V6\n-- Tenant ID: {INFOSEND_ID}\n\n"

# 1. Users
final_sql += "-- USERS\n"
final_sql += generate_insert('users', full_data['users']) + "\n"

# 2. Products
final_sql += "-- PRODUCTS\n"
final_sql += generate_insert('products', full_data['products']) + "\n"

# 3. Clients
final_sql += "-- CLIENTS\n"
final_sql += generate_insert('clients', full_data['clients'], remove_cpf=True) + "\n"

# 4. Client Contacts
final_sql += "-- CLIENT CONTACTS\n"
contacts = []
for c in full_data['clientes_contatos']:
    new_c = c.copy()
    if 'clienteId' in new_c: new_c['clientId'] = new_c.pop('clienteId')
    contacts.append(new_c)
final_sql += generate_insert('client_contacts', contacts, tenant_id_col=None) + "\n"

# 5. Suppliers
final_sql += "-- SUPPLIERS\n"
suppliers = []
for s in full_data['smartparts_suppliers']:
    new_s = {
        'id': s['id'], 'name': s['name'], 'phone': s['phone'],
        'isActive': True if s.get('active') == 1 else False,
        'createdAt': s['createdAt'], 'updatedAt': s['updatedAt'],
        'tenantId': INFOSEND_ID
    }
    suppliers.append(new_s)
final_sql += generate_insert('suppliers_registry', suppliers, tenant_id_col=None) + "\n"

# 6. Order Services
final_sql += "-- ORDER SERVICES\n"
final_sql += generate_insert('order_services', full_data['order_services']) + "\n"

# 7. Order Equipments
final_sql += "-- ORDER EQUIPMENTS\n"
final_sql += generate_insert('order_equipments', full_data['order_equipments'], tenant_id_col=None) + "\n"

# 8. Order History
final_sql += "-- ORDER HISTORY\n"
final_sql += generate_insert('order_history', full_data['order_history']) + "\n"

# 9. Order Parts
final_sql += "-- ORDER PARTS\n"
final_sql += generate_insert('order_parts', full_data['order_parts'], tenant_id_col=None) + "\n"

# 10. Order Photos
final_sql += "-- ORDER PHOTOS\n"
final_sql += generate_insert('order_photos', full_data['order_photos'], tenant_id_col=None) + "\n"

with open('migrate_data_infosend.sql', 'w', encoding='utf-8') as f:
    f.write(final_sql)

print("Generated migrate_data_infosend.sql v6")
