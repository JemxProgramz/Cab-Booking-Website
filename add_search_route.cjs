const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newRoute = `
  app.get("/api/search-booking", async (req, res) => {
    try {
      const { type, value } = req.query;
      if (!type || !value) {
        return res.status(400).json({ error: "Missing search parameters" });
      }

      const dbClient = new pg.Client({
        connectionString: dbConnectionString,
        ssl: { rejectUnauthorized: false }
      });
      await dbClient.connect();

      let result;
      if (type === 'id') {
        result = await dbClient.query('SELECT * FROM public.bookings WHERE booking_id = $1 LIMIT 1', [value]);
      } else {
        result = await dbClient.query('SELECT * FROM public.bookings WHERE phone = $1 ORDER BY created_at DESC LIMIT 1', [value]);
      }

      await dbClient.end();

      if (result.rows.length > 0) {
        res.json({ booking: result.rows[0] });
      } else {
        res.json({ booking: null });
      }
    } catch (err) {
      logger.error("Search error:", err);
      res.status(500).json({ error: "Failed to search booking" });
    }
  });
`;

code = code.replace(/app\.post\("\/api\/create-booking"/, newRoute + '\n  app.post("/api/create-booking"');
fs.writeFileSync('server.ts', code);
