import re

with open('server.ts', 'r') as f:
    code = f.read()

pattern = r"const dbPool = new pg\.Pool\(\{\s*connectionTimeoutMillis: 5000,\s*\}\);"
replacement = """const dbPool = new pg.Pool({
  connectionString: dbConnectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});"""

code = re.sub(pattern, replacement, code)

with open('server.ts', 'w') as f:
    f.write(code)
