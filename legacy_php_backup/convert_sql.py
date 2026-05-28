import re

with open('spare_parts.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

# Replace backticks with double quotes
sql = sql.replace('`', '"')

# Replace int(11) with INTEGER
sql = re.sub(r'int\(\d+\)', 'INTEGER', sql)

# Remove ENGINE=InnoDB DEFAULT CHARSET=latin1;
sql = re.sub(r'ENGINE=InnoDB DEFAULT CHARSET=\w+;', ';', sql)

# Postgres doesn't use AUTO_INCREMENT, we will use SERIAL for Postgres. 
# But since this is a dump, we can just remove the AUTO_INCREMENT keyword and use INTEGER, 
# then data will be inserted with explicit IDs anyway.
sql = sql.replace('AUTO_INCREMENT', '')

# Remove some MySQL specific pragmas
lines = sql.split('\n')
new_lines = []
for line in lines:
    if line.startswith('SET SQL_MODE') or line.startswith('START TRANSACTION') or line.startswith('SET time_zone') or line.startswith('/*!'):
        continue
    if 'MODIFY' in line and 'AUTO_INCREMENT' in line:
        continue
    if line.startswith('-- AUTO_INCREMENT for '):
        continue
    new_lines.append(line)

sql = '\n'.join(new_lines)

with open('postgres_spare_parts.sql', 'w', encoding='utf-8') as f:
    f.write(sql)
