with open('.env.example', 'r') as f:
    code = f.read()

code = code.replace('DATABASE_URL="YOUR_DATABASE_CONNECTION_STRING"', '# Use the transaction pooler connection string for IPv4 compatibility (e.g. postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres)\nDATABASE_URL="YOUR_DATABASE_CONNECTION_STRING"')

with open('.env.example', 'w') as f:
    f.write(code)
