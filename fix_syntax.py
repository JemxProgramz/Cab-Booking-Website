import re

with open('server.ts', 'r') as f:
    code = f.read()

pattern = r"return gp2 \+ '\*'\.repeat\(gp3\.length\);\s*logger\.warn\(`\[Auth Error\] Failed login attempt for \$\{redactedEmail\}: \$\{error\}`\);\s*\}"

replacement = """return gp2 + '*'.repeat(gp3.length);
        });
        logger.warn(`[Auth Error] Failed login attempt for ${redactedEmail}: ${error}`);
      }"""

code = re.sub(pattern, replacement, code)

with open('server.ts', 'w') as f:
    f.write(code)

