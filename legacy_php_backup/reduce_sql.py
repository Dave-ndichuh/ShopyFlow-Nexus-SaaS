import re

with open('postgres_spare_parts.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

# The file contains INSERT statements with many rows.
# Let's find INSERT INTO `product` (...) VALUES (...);
# Wait, backticks were replaced by quotes. INSERT INTO "product"
def reduce_inserts(match):
    prefix = match.group(1)
    values_str = match.group(2)
    # split by ),(
    values = values_str.split('),')
    # keep only first 10
    reduced = values[:10]
    # join back
    new_values = '),'.join(reduced)
    if not new_values.endswith(';'):
        if new_values.endswith(')'):
            new_values += ';'
        else:
            new_values += ');'
    return prefix + new_values

# Regex to match INSERT INTO ... VALUES (...)
sql = re.sub(r'(INSERT INTO "[^"]+" \([^)]+\) VALUES\s*)(.*?);', reduce_inserts, sql, flags=re.DOTALL)

with open('reduced_spare_parts.sql', 'w', encoding='utf-8') as f:
    f.write(sql)
