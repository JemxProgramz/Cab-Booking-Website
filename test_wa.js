import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';

async function sendTest() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });
  
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if(connection === 'open') {
        console.log('opened connection');
        try {
            await sock.sendMessage('919342469403@s.whatsapp.net', { text: 'Test message from server!' });
            console.log('sent message');
        } catch (e) {
            console.error(e);
        }
        process.exit(0);
    }
  });
}

sendTest();
