const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRoute = `
  app.post("/api/log-auth-error", (req, res) => {
    try {
      const { email, error } = req.body;
      if (email && error) {
        // Log securely without logging the raw password or sensitive session data
        const redactedEmail = email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => { 
          return gp2 + '*'.repeat(gp3.length);
        });
        logger.warn(\`[Auth Error] Failed login attempt for \${redactedEmail}: \${error}\`);
      }
      res.json({ success: true });
    } catch (err) {
      logger.error("Error in auth logging endpoint:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
`;

code = code.replace(/app\.post\("\/api\/create-booking"/, newRoute + '\n  app.post("/api/create-booking"');
fs.writeFileSync('server.ts', code);
