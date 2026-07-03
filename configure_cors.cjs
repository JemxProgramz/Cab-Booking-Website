const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const strictCors = `
  const allowedOrigins = [
    process.env.APP_URL,
    "http://localhost:3000"
  ].filter(Boolean);

  app.use(cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  }));
`;

code = code.replace('  app.use(cors());', strictCors);
fs.writeFileSync('server.ts', code);
console.log("CORS configured strictly.");
