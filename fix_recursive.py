with open('server.ts', 'r') as f:
    code = f.read()

code = code.replace(
'''    await Promise.race([
      sendWhatsAppMessageWithTimeout(jid, content),''',
'''    await Promise.race([
      sock.sendMessage(jid, content),'''
)

with open('server.ts', 'w') as f:
    f.write(code)
