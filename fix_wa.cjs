const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const startStr = 'sock.ev.on("connection.update", (update: any) => {';
const endStr = '  });\n\n  sock.ev.on("creds.update", saveCreds);';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find start or end index.");
    process.exit(1);
}

const replacement = `sock.ev.on("connection.update", (update: any) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrCodeValue = qr;
      qrcode.generate(qr, { small: true });
    }
    
    if (connection === "close") {
      isConnected = false;
      qrCodeValue = null;
      
      const boom = lastDisconnect?.error as Boom;
      const statusCode = boom?.output?.statusCode;
      const errorMessage = boom?.message || "Unknown error";
      const isQrTimeout = errorMessage === "QR refs attempts ended";
      
      let shouldReconnect = true;
      let sessionDeleted = false;

      // Map DisconnectReason
      let reasonName = "Unknown";
      if (statusCode === DisconnectReason.loggedOut) reasonName = "loggedOut";
      else if (statusCode === DisconnectReason.timedOut) reasonName = "timedOut";
      else if (statusCode === DisconnectReason.connectionClosed) reasonName = "connectionClosed";
      else if (statusCode === DisconnectReason.connectionLost) reasonName = "connectionLost";
      else if (statusCode === DisconnectReason.connectionReplaced) reasonName = "connectionReplaced";
      else if (statusCode === DisconnectReason.restartRequired) reasonName = "restartRequired";
      else if (statusCode === DisconnectReason.badSession) reasonName = "badSession";
      else if (statusCode === DisconnectReason.multideviceMismatch) reasonName = "multideviceMismatch";
      
      if (statusCode === DisconnectReason.loggedOut) {
        shouldReconnect = false;
        if (fs.existsSync(SESSION_DIR)) {
          fs.rmSync(SESSION_DIR, { recursive: true, force: true });
          sessionDeleted = true;
        }
      } else if (isQrTimeout) {
        shouldReconnect = false;
      }
      
      logger.info(
        \`\\n[WhatsApp]\\nConnection: close\\nReason: \${reasonName}\\nStatus Code: \${statusCode}\\nError: \${errorMessage}\\nAction: \${shouldReconnect ? 'Reconnecting...' : 'Not reconnecting'}\\nSession Deleted: \${sessionDeleted ? 'Yes' : 'No'}\\n\`
      );
      
      if (shouldReconnect) {
        reconnectAttempts++;
        if (reconnectAttempts <= 10) {
          let delayMs = 10000;
          if (reconnectAttempts === 1) delayMs = 2000;
          else if (reconnectAttempts === 2) delayMs = 5000;
          else delayMs = 10000;
          
          logger.info(\`Reconnecting in \${delayMs/1000}s (Attempt \${reconnectAttempts}/10)\`);
          setTimeout(connectToWhatsApp, delayMs);
        } else {
           logger.error("Maximum reconnect attempts reached. Giving up.");
        }
      }
    } else if (connection === "open") {
      logger.info("Opened connection to WhatsApp");
      isConnected = true;
      qrCodeValue = null;
      reconnectAttempts = 0; // Reset attempts on successful connection
    }
  });

  sock.ev.on("creds.update", saveCreds);`;

code = code.substring(0, startIndex) + replacement + code.substring(endIndex + endStr.length);
fs.writeFileSync('server.ts', code);
console.log("Replaced successfully.");
