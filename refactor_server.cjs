const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// 1. Setup Pino and Env validation
const newImports = `
import { z } from "zod";
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL must be a valid URL"),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, "VITE_SUPABASE_ANON_KEY is required"),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
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
const newHelmet = `  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));`;
code = code.replace(/app\.use\(helmet\(\{\s*contentSecurityPolicy: false,\s*\/\/[^\n]*\s*\}\)\);/m, newHelmet);

// 4. Add Global Error Handler right before starting the app.listen / vite middleware
const globalErrorHandler = `
  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error("Unhandled API Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  });

  // Vite middleware for development`;
code = code.replace('  // Vite middleware for development', globalErrorHandler);

fs.writeFileSync('server.ts', code);
console.log("Refactoring applied successfully.");
