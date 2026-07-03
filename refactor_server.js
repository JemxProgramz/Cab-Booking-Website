const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Setup Pino and Env validation
const newImports = `
import { z } from "zod";
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  WHATSAPP_ADMIN_NUMBER: z.string().optional(),
});

let envVars;
try {
  envVars = envSchema.parse(process.env);
} catch (err) {
  console.error("Environment Validation Error:", err.errors);
  process.exit(1);
}

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});
`;

code = code.replace('import { z } from "zod";', newImports);

// 2. Replace console usages
code = code.replace(/console\.log/g, 'logger.info');
code = code.replace(/console\.error/g, 'logger.error');
code = code.replace(/console\.warn/g, 'logger.warn');

// 3. Add helmet configuration
// Existing:
//   app.use(helmet({
//     contentSecurityPolicy: false, // Disabling CSP for development and Vite HMR
//   }));

const newHelmet = `
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));
`;
code = code.replace(/app\.use\(helmet\(\{[\s\S]*?\}\)\);/, newHelmet);

// 4. Add Global Error Handler right before starting the app.listen / vite middleware
const globalErrorHandler = `
  // Global Error Handler
  app.use((err, req, res, next) => {
    logger.error("Unhandled API Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  });

  // Vite middleware for development
`;
code = code.replace('// Vite middleware for development', globalErrorHandler);

fs.writeFileSync('server.ts', code);
console.log("Refactoring applied successfully.");
