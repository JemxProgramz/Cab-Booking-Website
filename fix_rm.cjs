const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace the try-catch block wiping
const oldCatch = `    try {
      if (fs.existsSync(SESSION_DIR)) {
        fs.rmSync(SESSION_DIR, { recursive: true, force: true });
        logger.info("Cleared corrupted WhatsApp session directory");
      }
    } catch(e) { 
       logger.error(e, "Failed to clear session dir");
    }`;

code = code.replace(oldCatch, `    // As per requirements, we do not wipe the session here.`);

// Replace the whatsapp-reconnect wipe
const oldReconnect = `    if (fs.existsSync(SESSION_DIR)) {
      fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    }`;

code = code.replace(oldReconnect, `    // Reconnect should just restart the socket, not wipe the session.`);

fs.writeFileSync('server.ts', code);
console.log("Replaced rmSync calls successfully.");
