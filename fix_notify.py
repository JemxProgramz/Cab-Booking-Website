import re

with open('server.ts', 'r') as f:
    code = f.read()

pattern = r"""      const { booking, adminNumber } = parsed\.data;
      const targetNumber = adminNumber || process\.env\.WHATSAPP_ADMIN_NUMBER;"""

replacement = """      const { booking, adminNumber } = parsed.data;
      res.json({ success: true, message: "WhatsApp notifications will be sent in the background" });
      (async () => {
      const targetNumber = adminNumber || process.env.WHATSAPP_ADMIN_NUMBER;"""

code = code.replace(pattern, replacement)


pattern2 = r"""        try {
          await sendWhatsAppMessageWithTimeout\(customerJid, \{ text: customerMessage \}\);
        \} catch \(err\) \{
          logger\.error\(err, "Error sending customer WhatsApp notification:"\);
        \}
      \}
      res\.json\(\{ success: true, message: "WhatsApp notifications sent" \}\);
    \} catch \(error: any\) \{
      logger\.error\(error, "Error sending WhatsApp notification:"\);
      res\.status\(500\)\.json\(\{ error: error\.message \}\);
    \}
  \}\);"""

replacement2 = """        try {
          await sendWhatsAppMessageWithTimeout(customerJid, { text: customerMessage });
        } catch (err) {
          logger.error(err, "Error sending customer WhatsApp notification:");
        }
      }
      })();
    } catch (error: any) {
      logger.error(error, "Error sending WhatsApp notification:");
      res.status(500).json({ error: error.message });
    }
  });"""

code = re.sub(pattern2, replacement2, code)

with open('server.ts', 'w') as f:
    f.write(code)
