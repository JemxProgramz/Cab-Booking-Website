const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Add SESSION_DIR and reconnectAttempts global variables
code = code.replace(
  "let isConnected = false;",
  "let isConnected = false;\nconst SESSION_DIR = '/tmp/auth_info_baileys';\nlet reconnectAttempts = 0;"
);

// 2. Update useMultiFileAuthState call
code = code.replace(
  'await useMultiFileAuthState("auth_info_baileys");',
  'await useMultiFileAuthState(SESSION_DIR);'
);

// 3. Update the fs.existsSync and fs.rmSync to use SESSION_DIR
code = code.replace(
  /fs\.existsSync\("auth_info_baileys"\)/g,
  'fs.existsSync(SESSION_DIR)'
);
code = code.replace(
  /fs\.rmSync\("auth_info_baileys", \{ recursive: true, force: true \}\);/g,
  'fs.rmSync(SESSION_DIR, { recursive: true, force: true });'
);

// 4. Update the reconnect logic for exponential backoff
const oldReconnect = `      if (shouldReconnect && !isQrTimeout && statusCode !== 428 && statusCode !== 515) {
        setTimeout(connectToWhatsApp, 5000);
      }
    } else if (connection === "open") {
      logger.info("Opened connection to WhatsApp");
      isConnected = true;
      qrCodeValue = null;
    }`;

const newReconnect = `      if (shouldReconnect && !isQrTimeout && statusCode !== 428 && statusCode !== 515) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 60000);
        reconnectAttempts++;
        logger.info(\`Reconnecting in \${delay/1000}s (Attempt \${reconnectAttempts})\`);
        setTimeout(connectToWhatsApp, delay);
      }
    } else if (connection === "open") {
      logger.info("Opened connection to WhatsApp");
      isConnected = true;
      qrCodeValue = null;
      reconnectAttempts = 0; // Reset attempts on successful connection
    }`;

code = code.replace(oldReconnect, newReconnect);

const oldReconnectFail = `  } catch (error) {
    console.error("Failed to initialize WhatsApp connection:", error);
    setTimeout(connectToWhatsApp, 5000);
  }`;
const newReconnectFail = `  } catch (error) {
    logger.error("Failed to initialize WhatsApp connection:", error);
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 60000);
    reconnectAttempts++;
    setTimeout(connectToWhatsApp, delay);
  }`;
code = code.replace(oldReconnectFail, newReconnectFail);

fs.writeFileSync('server.ts', code);
console.log("WhatsApp integration updated.");
