import re

with open('reduced_spare_parts.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

# We need to clean up MySQL-specific ALTER TABLE statements.
# Let's just extract the CREATE TABLE, INSERT INTO, and ADD PRIMARY KEY / ADD CONSTRAINT

statements = sql.split(';')
new_statements = []

for stmt in statements:
    stmt = stmt.strip()
    if not stmt:
        continue
    if stmt == 'COMMIT':
        continue
    
    if stmt.startswith('CREATE TABLE') or stmt.startswith('INSERT INTO'):
        new_statements.append(stmt)
    elif stmt.startswith('ALTER TABLE'):
        # We need to filter the ALTER TABLE content
        if 'ADD PRIMARY KEY' in stmt:
            # e.g. ALTER TABLE "category" ADD PRIMARY KEY ("CATEGORY_ID")
            # This is valid PG SQL. We just need to make sure no ADD KEY is there.
            lines = stmt.split('\n')
            clean_lines = []
            for line in lines:
                if 'ADD UNIQUE KEY' in line or 'ADD KEY' in line:
                    continue
                clean_lines.append(line)
            # Remove trailing commas
            cleaned = '\n'.join(clean_lines).strip()
            if cleaned.endswith(','):
                cleaned = cleaned[:-1]
            if "ADD PRIMARY KEY" in cleaned or "ADD CONSTRAINT" in cleaned:
                new_statements.append(cleaned)
        elif 'ADD CONSTRAINT' in stmt:
            new_statements.append(stmt)
            
final_sql = ';\n\n'.join(new_statements) + ';'

with open('final_pg.sql', 'w', encoding='utf-8') as f:
    f.write(final_sql)
