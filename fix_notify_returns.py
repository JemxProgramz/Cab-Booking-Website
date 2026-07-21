import re

with open('server.ts', 'r') as f:
    code = f.read()

code = code.replace(
'''      if (!targetNumber) {
        return res.status(500).json({ error: "WhatsApp admin number not configured" });
      }
      if (!isConnected || !sock) {
        return res.status(503).json({ error: "WhatsApp service not connected" });
      }''',
'''      if (!targetNumber) {
        logger.warn("WhatsApp admin number not configured");
        return;
      }
      if (!isConnected || !sock) {
        logger.warn("WhatsApp service not connected");
        return;
      }'''
)

with open('server.ts', 'w') as f:
    f.write(code)
