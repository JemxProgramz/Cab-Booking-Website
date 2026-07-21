const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /if \(result\.rows\.length === 0\) \{\s*return res\.status\(404\)\.json\(\{ error: "Booking not found" \}\);\s*\/\/\s*Notify via WhatsApp if connected \(Fire and forget\)/;

code = code.replace(regex, `if (result.rows.length === 0) {
          return res.status(404).json({ error: "Booking not found" });
        }
        booking = result.rows[0];
      } finally {
        dbClient.release();
      }

      // Notify via WhatsApp if connected (Fire and forget)`);
fs.writeFileSync('server.ts', code);
