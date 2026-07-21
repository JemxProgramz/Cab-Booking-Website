import re

with open('server.ts', 'r') as f:
    code = f.read()

pattern = r"headerType: 1\s+// --- Send confirmation to customer ---"
replacement = "headerType: 1\n      });\n      // --- Send confirmation to customer ---"

code = re.sub(pattern, replacement, code)

with open('server.ts', 'w') as f:
    f.write(code)
