const fs = require('fs');
let code = fs.readFileSync('src/pages/Login.tsx', 'utf8');

const oldCatch = `    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
    } finally {`;
    
const newCatch = `    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
      // Securely log the authentication error to the backend
      try {
        fetch('/api/log-auth-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, error: error.message || 'Unknown error' })
        }).catch(() => {});
      } catch (e) {}
    } finally {`;

code = code.replace(oldCatch, newCatch);
fs.writeFileSync('src/pages/Login.tsx', code);
