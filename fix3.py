import re

with open('server.ts', 'r') as f:
    code = f.read()

pattern = r"adminNumber: z\.string\(\)\.optional\(\)\.transform\(val => val \? xss\(val\) : undefined\)\s*const parsed = updateSchema\.safeParse\(req\.body\);"
replacement = "adminNumber: z.string().optional().transform(val => val ? xss(val) : undefined)\n      });\n      const parsed = updateSchema.safeParse(req.body);"

code = re.sub(pattern, replacement, code)

with open('server.ts', 'w') as f:
    f.write(code)
