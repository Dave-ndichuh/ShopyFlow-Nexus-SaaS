import os
import re

def convert_to_pdo(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Replacements
    content = re.sub(r'mysqli_query\s*\(\s*\$db\s*,\s*(.*?)\)', r'$db->query(\1)', content, flags=re.DOTALL)
    content = re.sub(r'mysqli_fetch_assoc\s*\(\s*(\$[^)]+)\)', r'\1->fetch(PDO::FETCH_ASSOC)', content, flags=re.DOTALL)
    content = re.sub(r'mysqli_fetch_array\s*\(\s*(\$[^)]+)\)', r'\1->fetch()', content, flags=re.DOTALL)
    content = re.sub(r'mysqli_error\s*\(\s*\$db\s*\)', r'print_r($db->errorInfo(), true)', content, flags=re.DOTALL)
    content = re.sub(r'mysqli_insert_id\s*\(\s*\$db\s*\)', r'$db->lastInsertId()', content, flags=re.DOTALL)
    content = re.sub(r'mysqli_num_rows\s*\(\s*(\$[^)]+)\)', r'\1->rowCount()', content, flags=re.DOTALL)
    content = re.sub(r'mysqli_real_escape_string\s*\(\s*\$db\s*,\s*(.*?)\)', r'addslashes(\1)', content, flags=re.DOTALL)
    
    # In some places, or die(mysqli_error($db)) is used, which becomes or die(print_r($db->errorInfo(), true))
    
    with open(filepath, 'w', encoding='utf-8', errors='ignore') as f:
        f.write(content)

for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.php'):
            convert_to_pdo(os.path.join(root, file))
