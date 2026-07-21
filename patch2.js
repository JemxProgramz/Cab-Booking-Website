const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
\`        const redactedEmail = email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => { 
          return gp2 + '*'.repeat(gp3.length);
          logger.warn(\\\`[Auth Error] Failed login attempt for \${redactedEmail}: \${error}\\\`);
      }
      res.json({ success: true });\`,
\`        const redactedEmail = email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => { 
          return gp1 + '*'.repeat(gp2.length);
        });
        logger.warn(\\\`[Auth Error] Failed login attempt for \${redactedEmail}: \${error}\\\`);
      }
      res.json({ success: true });\`
);

fs.writeFileSync('server.ts', code);
