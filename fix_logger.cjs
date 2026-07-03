const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
`const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});`,
``);
code = code.replace(
`const envSchema = z.object({`,
`const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

const envSchema = z.object({`
);
fs.writeFileSync('server.ts', code);
