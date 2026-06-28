import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const dbConnectionString = "postgresql://postgres:Auto@@&&CABD@db.bxvfcvszhvrbglvmuwxy.supabase.co:5432/postgres";

async function applyRLS() {
  const dbClient = new pg.Client({
    connectionString: dbConnectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  await dbClient.connect();

  try {
    console.log("Applying RLS to public.bookings...");
    await dbClient.query(`
      ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Enable insert for all users" ON public.bookings;
      DROP POLICY IF EXISTS "Enable select for authenticated users only" ON public.bookings;
      DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.bookings;
      DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.bookings;
      DROP POLICY IF EXISTS "Enable select for anyone" ON public.bookings;
      DROP POLICY IF EXISTS "Enable update for anyone" ON public.bookings;
      DROP POLICY IF EXISTS "Enable delete for anyone" ON public.bookings;

      -- Allow anyone to insert (customers book without auth)
      CREATE POLICY "Enable insert for all users" ON public.bookings
        FOR INSERT WITH CHECK (true);

      -- Allow anyone to select (since customers need to search by booking_id)
      CREATE POLICY "Enable select for anyone" ON public.bookings
        FOR SELECT USING (true);

      -- Strict Update for authenticated users only
      CREATE POLICY "Enable update for authenticated users only" ON public.bookings
        FOR UPDATE USING (auth.role() = 'authenticated');
        
      -- Strict Delete for authenticated users only
      CREATE POLICY "Enable delete for authenticated users only" ON public.bookings
        FOR DELETE USING (auth.role() = 'authenticated');
    `);
    console.log("RLS applied to bookings.");

    console.log("Applying RLS to public.settings...");
    await dbClient.query(`
      ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Enable select for anyone on settings" ON public.settings;
      DROP POLICY IF EXISTS "Enable all for authenticated users on settings" ON public.settings;
      DROP POLICY IF EXISTS "Enable insert for anyone on settings" ON public.settings;
      DROP POLICY IF EXISTS "Enable update for anyone on settings" ON public.settings;
      DROP POLICY IF EXISTS "Enable delete for anyone on settings" ON public.settings;
      DROP POLICY IF EXISTS "Enable insert for authenticated users only on settings" ON public.settings;
      DROP POLICY IF EXISTS "Enable update for authenticated users only on settings" ON public.settings;
      DROP POLICY IF EXISTS "Enable delete for authenticated users only on settings" ON public.settings;

      -- Public select for whatsapp number
      CREATE POLICY "Enable select for anyone on settings" ON public.settings
        FOR SELECT USING (true);
        
      -- Admin only modifications
      CREATE POLICY "Enable insert for authenticated users only on settings" ON public.settings
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      CREATE POLICY "Enable update for authenticated users only on settings" ON public.settings
        FOR UPDATE USING (auth.role() = 'authenticated');
      CREATE POLICY "Enable delete for authenticated users only on settings" ON public.settings
        FOR DELETE USING (auth.role() = 'authenticated');
    `);
    console.log("RLS applied to settings.");
    
  } catch (err) {
    console.error("Error applying RLS:", err);
  } finally {
    await dbClient.end();
  }
}

applyRLS();
