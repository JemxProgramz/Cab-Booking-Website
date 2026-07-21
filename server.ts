import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import pino from "pino";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import xss from "xss";

import { z } from "zod";
const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

// Initialize environment variables
dotenv.config();

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL must be a valid URL"),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, "VITE_SUPABASE_ANON_KEY is required"),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  WHATSAPP_ADMIN_NUMBER: z.string().optional(),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required to connect to the database"),
});

let envVars;
let isEnvValid = true;
try {
  envVars = envSchema.parse(process.env);
} catch (err: any) {
  logger.error(err.errors, "Environment Validation Error: Missing or invalid environment variables. The server will start in IDLE mode with degraded functionality.");
  isEnvValid = false;
}

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

// Database connection string for PostgreSQL direct queries
const dbConnectionString = process.env.DATABASE_URL as string;

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

// Global variables to hold WhatsApp session state
let sock: any = null;
let qrCodeValue: string | null = null;
let isConnected = false;
const SESSION_DIR = 'auth_info_baileys';
let reconnectAttempts = 0;

/**
 * Initializes and manages the WhatsApp Web connection using Baileys.
 * Handles QR code generation, session state, auto-reconnection, and incoming message parsing.
 */
async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    
    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
      logger: pino({ level: "silent" }) as any
    });

  sock.ev.on("connection.update", (update: any) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      qrCodeValue = qr;
      qrcode.generate(qr, { small: true });
    }
    
    if (connection === "close") {
      isConnected = false;
      qrCodeValue = null;
      
      const boom = lastDisconnect?.error as Boom;
      const statusCode = boom?.output?.statusCode;
      const errorMessage = boom?.message || "Unknown error";
      const isQrTimeout = errorMessage === "QR refs attempts ended";
      
      let shouldReconnect = true;
      let sessionDeleted = false;

      // Map DisconnectReason
      let reasonName = "Unknown";
      if (statusCode === DisconnectReason.loggedOut) reasonName = "loggedOut";
      else if (statusCode === DisconnectReason.timedOut) reasonName = "timedOut";
      else if (statusCode === DisconnectReason.connectionClosed) reasonName = "connectionClosed";
      else if (statusCode === DisconnectReason.connectionLost) reasonName = "connectionLost";
      else if (statusCode === DisconnectReason.connectionReplaced) reasonName = "connectionReplaced";
      else if (statusCode === DisconnectReason.restartRequired) reasonName = "restartRequired";
      else if (statusCode === DisconnectReason.badSession) reasonName = "badSession";
      else if (statusCode === DisconnectReason.multideviceMismatch) reasonName = "multideviceMismatch";
      
      if (statusCode === DisconnectReason.loggedOut) {
        shouldReconnect = false;
        if (fs.existsSync(SESSION_DIR)) {
          fs.rmSync(SESSION_DIR, { recursive: true, force: true });
          sessionDeleted = true;
        }
      } else if (isQrTimeout) {
        shouldReconnect = true;
        reconnectAttempts = 0; // Reset attempts so it keeps trying to generate QR
        if (fs.existsSync(SESSION_DIR)) {
          fs.rmSync(SESSION_DIR, { recursive: true, force: true });
          sessionDeleted = true;
        }
      }
      
      logger.info(
        `\n[WhatsApp]\nConnection: close\nReason: ${reasonName}\nStatus Code: ${statusCode}\nError: ${errorMessage}\nAction: ${shouldReconnect ? 'Reconnecting...' : 'Not reconnecting'}\nSession Deleted: ${sessionDeleted ? 'Yes' : 'No'}\n`
      );
      
      if (shouldReconnect) {
        reconnectAttempts++;
        if (reconnectAttempts <= 10) {
          let delayMs = 10000;
          if (reconnectAttempts === 1) delayMs = 2000;
          else if (reconnectAttempts === 2) delayMs = 5000;
          else delayMs = 10000;
          
          logger.info(`Reconnecting in ${delayMs/1000}s (Attempt ${reconnectAttempts}/10)`);
          setTimeout(connectToWhatsApp, delayMs);
        } else {
           logger.error("Maximum reconnect attempts reached. Giving up.");
        }
      }
    } else if (connection === "open") {
      logger.info("Opened connection to WhatsApp");
      isConnected = true;
      qrCodeValue = null;
      reconnectAttempts = 0; // Reset attempts on successful connection
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }: any) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message) continue;
      
      let textMessage = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
      
      // Support for button clicks
      if (msg.message.buttonsResponseMessage) {
        textMessage = msg.message.buttonsResponseMessage.selectedButtonId || textMessage;
      } else if (msg.message.templateButtonReplyMessage) {
        textMessage = msg.message.templateButtonReplyMessage.selectedId || textMessage;
      }
      
      if (!textMessage) continue;
      
      const parts = textMessage.trim().split(" ");
      const command = parts[0].toLowerCase();
      
      if (command === "/accept" || command === "/decline") {
        const bookingId = parts[1];
        if (!bookingId) {
          await sock.sendMessage(msg.key.remoteJid, { text: "Please provide a booking ID. Example: /accept BK-12345" });
          continue;
        }

        const newStatus = command === "/accept" ? "Confirmed" : "Cancelled";

        try {
          const dbClient = new pg.Client({
            connectionString: dbConnectionString,
            ssl: { rejectUnauthorized: false }
          });
          await dbClient.connect();

          try {
            // Verify if the booking exists
            const res = await dbClient.query('SELECT * FROM public.bookings WHERE booking_id = $1', [bookingId]);

            if (res.rows.length === 0) {
              await sock.sendMessage(msg.key.remoteJid, { text: `Booking ID ${bookingId} not found.` });
              continue;
            }

            const bookingData = res.rows[0];

            if (bookingData.status !== "Pending") {
              await sock.sendMessage(msg.key.remoteJid, { text: `Booking ${bookingId} is already ${bookingData.status}.` });
              continue;
            }

            // Update status in supabase
            await dbClient.query('UPDATE public.bookings SET status = $1, updated_at = $2 WHERE id = $3', [newStatus, new Date().toISOString(), bookingData.id]);

            // Notify Admin
            await sock.sendMessage(msg.key.remoteJid, { text: `✅ Successfully marked booking ${bookingId} as ${newStatus}.` });

            // Notify Customer using local API
            fetch('http://localhost:3000/api/notify-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ booking: { ...bookingData, status: newStatus } })
            }).catch(err => logger.error(err, "Failed to call local notify API"));
          } finally {
            await dbClient.end();
          }

        } catch (error) {
          logger.error(error, "WhatsApp Command Error:");
        }
      }
    }
  });
  } catch (error) {
    logger.error(error, "Failed to initialize WhatsApp connection:");
    // If initialization fails (e.g. corrupted session), clear the directory to recover gracefully
    try {
      if (fs.existsSync(SESSION_DIR)) {
        fs.rmSync(SESSION_DIR, { recursive: true, force: true });
        logger.info("Cleared corrupted WhatsApp session directory");
      }
    } catch(e) {
       logger.error(e, "Failed to clear session dir");
    }
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 60000);
    reconnectAttempts++;
    setTimeout(connectToWhatsApp, delay);
  }
}

// Don't await connection here to let server start
if (isEnvValid) {
  connectToWhatsApp().catch(logger.error);
} else {
  logger.warn("Skipping WhatsApp connection due to invalid environment variables.");
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error(reason, 'Unhandled Rejection:');
});

process.on('uncaughtException', (error) => {
  logger.error(error, 'Uncaught Exception:');
});

/**
 * Bootstraps the Express.js API server and configures Vite middleware for local development.
 * Sets up routing, security middlewares, and the WhatsApp messaging endpoints.
 */
async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = 3000;

  // Security headers
    app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));


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

  app.use(express.json());

  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: "Too many requests from this IP, please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/api/whatsapp-status',
    // Trust proxy is set above, so express-rate-limit will automatically use the correct client IP.
  });

  app.use("/api/", apiLimiter);

  // Validation Schemas
  const bookingSchema = z.object({
    id: z.string().uuid().optional(),
    booking_id: z.string(),
    name: z.string().min(1, "Name is required").transform(val => xss(val)),
    phone: z.string().min(10, "Valid phone number is required").transform(val => xss(val)),
    booking_date: z.string().min(1, "Date is required"),
    booking_time: z.string().min(1, "Time is required"),
    pickup_location: z.string().nullable().optional().transform(val => val ? xss(val) : null),
    status: z.enum(["Pending", "Confirmed", "Completed", "Cancelled"]).optional()
  });

  // API Routes
  
  app.post("/api/log-auth-error", (req, res) => {
    try {
      const { email, error } = req.body;
      if (email && error) {
        // Log securely without logging the raw password or sensitive session data
        const redactedEmail = email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => { 
          return gp2 + '*'.repeat(gp3.length);
        });
        logger.warn(`[Auth Error] Failed login attempt for ${redactedEmail}: ${error}`);
      }
      res.json({ success: true });
    } catch (err) {
      logger.error(err, "Error in auth logging endpoint:");
      res.status(500).json({ error: "Internal server error" });
    }
  });

  
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
      logger.error(err, "Search error:");
      res.status(500).json({ error: "Failed to search booking" });
    }
  });

  app.post("/api/create-booking", async (req, res) => {
    try {
      const parsed = z.object({
        booking: bookingSchema,
        adminNumber: z.string().optional().transform(val => val ? xss(val) : undefined)
      }).safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid booking data", details: parsed.error.issues });
      }

      const { booking, adminNumber } = parsed.data;

      // Insert into database
      const dbClient = new pg.Client({
        connectionString: dbConnectionString,
        ssl: { rejectUnauthorized: false }
      });
      await dbClient.connect();

      let newBooking;
      try {
        const result = await dbClient.query(
          `INSERT INTO public.bookings (booking_id, name, phone, booking_date, booking_time, pickup_location, status) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [booking.booking_id, booking.name, booking.phone, booking.booking_date, booking.booking_time, booking.pickup_location, booking.status || 'Pending']
        );
        newBooking = result.rows[0];
      } finally {
        await dbClient.end();
      }

      // Proceed to notify
      const targetNumber = adminNumber || process.env.WHATSAPP_ADMIN_NUMBER;
      
      if (!targetNumber) {
        return res.json({ success: true, booking: newBooking, message: "Booking created, but WhatsApp admin number not configured" });
      }

      if (!isConnected || !sock) {
        return res.json({ success: true, booking: newBooking, message: "Booking created, but WhatsApp service not connected" });
      }

      let cleanNumber = targetNumber.replace(/\D/g, '');
      if (cleanNumber.length === 10) cleanNumber = '91' + cleanNumber;
      const jid = `${cleanNumber}@s.whatsapp.net`;
      
      const adminMessage = `📋 *New Booking Request* | Ram Autos & Cabs\n\n` +
        `Customer Details:\n` +
        `👤 Name: ${newBooking.name}\n` +
        `📞 Phone: ${newBooking.phone}\n\n` +
        `Trip Details:\n` +
        `🆔 Booking ID: ${newBooking.booking_id}\n` +
        `📅 Date: ${newBooking.booking_date}\n` +
        `⏰ Time: ${newBooking.booking_time}\n` +
        `📍 Pickup: ${newBooking.pickup_location || 'Not provided'}\n` +
        `📌 Status: ${newBooking.status}\n\n` +
        `Action Required:\n` +
        `Please approve or decline this request by replying with:\n` +
        `✅ \`/accept ${newBooking.booking_id}\`\n` +
        `❌ \`/decline ${newBooking.booking_id}\``;

      const buttons = [
        { buttonId: `/accept ${newBooking.booking_id}`, buttonText: { displayText: '✅ Accept' }, type: 1 },
        { buttonId: `/decline ${newBooking.booking_id}`, buttonText: { displayText: '❌ Decline' }, type: 1 }
      ];

      await sock.sendMessage(jid, { 
        text: adminMessage,
        footer: 'Ram Autos & Cabs',
        buttons: buttons,
        headerType: 1
      }).catch((e: any) => logger.error(e));

      if (newBooking.phone) {
        let customerClean = newBooking.phone.replace(/\D/g, '');
        if (customerClean.length === 10) customerClean = '91' + customerClean;
        const customerJid = `${customerClean}@s.whatsapp.net`;
        
        const customerMessage = `👋 Welcome to Ram Autos & Cabs!\n\n` +
          `Hi ${newBooking.name}, thank you for choosing us!\n` +
          `Your ride request has been successfully received.\n\n` +
          `Your Trip Details:\n\n` +
          `🆔Booking ID: ${newBooking.booking_id}\n\n` +
          `📅Date: ${newBooking.booking_date}\n\n` +
          `⏰Time: ${newBooking.booking_time}\n\n` +
          `📍Pickup: ${newBooking.pickup_location || 'Not provided'}\n\n` +
          `Please give us a few moments to find the nearest available driver for you. We will message you back shortly with their contact details!\n\n` +
          `_Powered by Jemx Automation System_`;

        await sock.sendMessage(customerJid, { text: customerMessage }).catch((e: any) => logger.error(e));
      }

      res.json({ success: true, booking: newBooking, message: "Booking created and WhatsApp notifications sent" });
    } catch (error: any) {
      logger.error(error, "Error creating booking:");
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notify-booking", async (req, res) => {
    try {
      const parsed = z.object({
        booking: bookingSchema,
        adminNumber: z.string().optional().transform(val => val ? xss(val) : undefined)
      }).safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid booking data", details: parsed.error.issues });
      }

      const { booking, adminNumber } = parsed.data;
      const targetNumber = adminNumber || process.env.WHATSAPP_ADMIN_NUMBER;
      
      if (!targetNumber) {
        return res.status(500).json({ error: "WhatsApp admin number not configured" });
      }

      if (!isConnected || !sock) {
        return res.status(503).json({ error: "WhatsApp service not connected" });
      }

      // Clean the phone number (remove +, spaces, dashes, etc.)
      let cleanNumber = targetNumber.replace(/\D/g, '');
      
      // Auto-prepend 91 for Indian numbers if only 10 digits are provided
      if (cleanNumber.length === 10) {
        cleanNumber = '91' + cleanNumber;
      }
      
      const jid = `${cleanNumber}@s.whatsapp.net`;
      
      try {
        const [result] = await sock.onWhatsApp(jid);
        if (!result?.exists) {
          logger.warn(`WhatsApp number ${cleanNumber} does not exist on WhatsApp.`);
        }
      } catch (err) {
        logger.error(err, "Error checking if number exists on WhatsApp:");
      }
      
      const adminMessage = `📋 *New Booking Request* | Ram Autos & Cabs\n\n` +
        `Customer Details:\n` +
        `👤 Name: ${booking.name}\n` +
        `📞 Phone: ${booking.phone}\n\n` +
        `Trip Details:\n` +
        `🆔 Booking ID: ${booking.booking_id}\n` +
        `📅 Date: ${booking.booking_date}\n` +
        `⏰ Time: ${booking.booking_time}\n` +
        `📍 Pickup: ${booking.pickup_location || 'Not provided'}\n` +
        `📌 Status: ${booking.status}\n\n` +
        `Action Required:\n` +
        `Please approve or decline this request by replying with:\n` +
        `✅ \`/accept ${booking.booking_id}\`\n` +
        `❌ \`/decline ${booking.booking_id}\``;

      const buttons = [
        { buttonId: `/accept ${booking.booking_id}`, buttonText: { displayText: '✅ Accept' }, type: 1 },
        { buttonId: `/decline ${booking.booking_id}`, buttonText: { displayText: '❌ Decline' }, type: 1 }
      ];

      await sock.sendMessage(jid, { 
        text: adminMessage,
        footer: 'Ram Autos & Cabs',
        buttons: buttons,
        headerType: 1
      });

      // --- Send confirmation to customer ---
      if (booking.phone) {
        let customerClean = booking.phone.replace(/\D/g, '');
        if (customerClean.length === 10) {
          customerClean = '91' + customerClean;
        }
        const customerJid = `${customerClean}@s.whatsapp.net`;
        
        const customerMessage = `👋 Welcome to Ram Autos & Cabs!\n\n` +
          `Hi ${booking.name}, thank you for choosing us!\n` +
          `Your ride request has been successfully received.\n\n` +
          `Your Trip Details:\n\n` +
          `🆔Booking ID: ${booking.booking_id}\n\n` +
          `📅Date: ${booking.booking_date}\n\n` +
          `⏰Time: ${booking.booking_time}\n\n` +
          `📍Pickup: ${booking.pickup_location || 'Not provided'}\n\n` +
          `Please give us a few moments to find the nearest available driver for you. We will message you back shortly with their contact details!\n\n` +
          `_Powered by Jemx Automation System_`;

        try {
          await sock.sendMessage(customerJid, { text: customerMessage });
        } catch (err) {
          logger.error(err, "Error sending customer WhatsApp notification:");
        }
      }

      res.json({ success: true, message: "WhatsApp notifications sent" });
    } catch (error: any) {
      logger.error(error, "Error sending WhatsApp notification:");
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/update-booking-status", async (req, res) => {
    try {
      const updateSchema = z.object({
        booking_id: z.string().transform(val => xss(val)),
        status: z.enum(["Pending", "Confirmed", "Completed", "Cancelled"]),
        adminNumber: z.string().optional().transform(val => val ? xss(val) : undefined)
      });
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
      }
      const { booking_id, status, adminNumber } = parsed.data;

      // Access control
      if (status !== "Cancelled") {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return res.status(401).json({ error: "Unauthorized. Only admins can set status other than Cancelled." });
        }
        const token = authHeader.split(" ")[1];
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
          return res.status(403).json({ error: "Forbidden. Invalid token." });
        }
      }

      const dbClient = new pg.Client({
        connectionString: dbConnectionString,
        ssl: { rejectUnauthorized: false }
      });
      await dbClient.connect();

      let booking;
      try {
        const result = await dbClient.query(
          'UPDATE public.bookings SET status = $1, updated_at = $2 WHERE booking_id = $3 RETURNING *',
          [status, new Date().toISOString(), booking_id]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Booking not found" });
        }
        booking = result.rows[0];
      } finally {
        await dbClient.end();
      }

      // Notify via WhatsApp if connected
      if (isConnected && sock) {
        // Notify Customer
        if (booking.phone) {
          let customerClean = booking.phone.replace(/\D/g, '');
          if (customerClean.length === 10) {
            customerClean = '91' + customerClean;
          }
          const customerJid = `${customerClean}@s.whatsapp.net`;
          
          let statusMessage = '';
          if (booking.status === 'Confirmed') {
            statusMessage = `✅ Ride Confirmed!\n\n` +
              `Hi ${booking.name},\n` +
              `Great news! Your ride (Booking ID: ${booking.booking_id}) has been confirmed.\n\n` +
              `Trip Details:\n` +
              `📅 Date: ${booking.booking_date}\n` +
              `⏰ Time: ${booking.booking_time}\n` +
              `📍 Pickup: ${booking.pickup_location || 'Not provided'}\n` +
              `📞 Driver Phone: ${adminNumber || process.env.WHATSAPP_ADMIN_NUMBER || 'Not provided'}\n\n` +
              `Our driver will arrive at the scheduled time. Thank you for choosing Ram Autos & Cabs!\n\n` +
              `_Powered by Jemx Automation System_`;
          } else if (booking.status === 'Completed') {
            statusMessage = `🎉 Ride Completed!\n\n` +
              `Hi ${booking.name},\n` +
              `Your ride (Booking ID: ${booking.booking_id}) is now marked as completed.\n\n` +
              `We hope you had a great trip with Ram Autos & Cabs! If you have a moment, we'd love to hear your feedback.\n\n` +
              `_Powered by Jemx Automation System_`;
          } else if (booking.status === 'Cancelled') {
            statusMessage = `❌ Ride Cancelled\n\n` +
              `Hi ${booking.name},\n` +
              `We regret to inform you that your ride (Booking ID: ${booking.booking_id}) has been cancelled.\n\n` +
              `If you have any questions or would like to rebook, please contact our support team.\n\n` +
              `_Powered by Jemx Automation System_`;
          } else {
             statusMessage = `🔔 Booking Status Update\n\n` +
              `Hi ${booking.name},\n` +
              `Your ride (Booking ID: ${booking.booking_id}) status has been updated to: ${booking.status}.\n\n` +
              `_Powered by Jemx Automation System_`;
          }

          try {
            await sock.sendMessage(customerJid, { text: statusMessage });
          } catch (err) {
            logger.error(err, "Error sending customer status notification:");
          }
        }

        // Notify Admin
        const targetAdminNumber = adminNumber || process.env.WHATSAPP_ADMIN_NUMBER;
        if (targetAdminNumber) {
          let adminClean = targetAdminNumber.replace(/\D/g, '');
          if (adminClean.length === 10) adminClean = '91' + adminClean;
          const adminJid = `${adminClean}@s.whatsapp.net`;
          
          let adminStatusMessage = `🔄 *Status Update* | Ram Autos & Cabs\n\n` +
            `The following booking has been updated:\n` +
            `🆔 Booking ID: ${booking.booking_id}\n` +
            `👤 Customer: ${booking.name}\n` +
            `📌 New Status: *${booking.status}*`;

          try {
            await sock.sendMessage(adminJid, { text: adminStatusMessage });
          } catch (err) {
            logger.error(err, "Error sending admin status notification:");
          }
        }
      }

      res.json({ success: true, booking });
    } catch (error: any) {
      logger.error(error, "Error updating booking status:");
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/notify-status", async (req, res) => {
    try {
      const parsed = z.object({
        booking: bookingSchema,
        adminNumber: z.string().optional().transform(val => val ? xss(val) : undefined)
      }).safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
      }

      const { booking, adminNumber } = parsed.data;
      
      if (!isConnected || !sock) {
        return res.status(503).json({ error: "WhatsApp service not connected" });
      }

      // 1. Notify Customer
      if (booking.phone) {
        let customerClean = booking.phone.replace(/\D/g, '');
        if (customerClean.length === 10) {
          customerClean = '91' + customerClean;
        }
        const customerJid = `${customerClean}@s.whatsapp.net`;
        
        let statusMessage = '';
        if (booking.status === 'Confirmed') {
          statusMessage = `✅ Ride Confirmed!\n\n` +
            `Hi ${booking.name},\n` +
            `Great news! Your ride (Booking ID: ${booking.booking_id}) has been confirmed.\n\n` +
            `Trip Details:\n` +
            `📅 Date: ${booking.booking_date}\n` +
            `⏰ Time: ${booking.booking_time}\n` +
            `📍 Pickup: ${booking.pickup_location || 'Not provided'}\n` +
            `📞 Driver Phone: ${adminNumber || process.env.WHATSAPP_ADMIN_NUMBER || 'Not provided'}\n\n` +
            `Our driver will arrive at the scheduled time. Thank you for choosing Ram Autos & Cabs!\n\n` +
            `_Powered by Jemx Automation System_`;
        } else if (booking.status === 'Completed') {
          statusMessage = `🎉 Ride Completed!\n\n` +
            `Hi ${booking.name},\n` +
            `Your ride (Booking ID: ${booking.booking_id}) is now marked as completed.\n\n` +
            `We hope you had a great trip with Ram Autos & Cabs! If you have a moment, we'd love to hear your feedback.\n\n` +
            `_Powered by Jemx Automation System_`;
        } else if (booking.status === 'Cancelled') {
          statusMessage = `❌ Ride Cancelled\n\n` +
            `Hi ${booking.name},\n` +
            `We regret to inform you that your ride (Booking ID: ${booking.booking_id}) has been cancelled.\n\n` +
            `If you have any questions or would like to rebook, please contact our support team.\n\n` +
            `_Powered by Jemx Automation System_`;
        } else {
           statusMessage = `🔔 Booking Status Update\n\n` +
            `Hi ${booking.name},\n` +
            `Your ride (Booking ID: ${booking.booking_id}) status has been updated to: ${booking.status}.\n\n` +
            `_Powered by Jemx Automation System_`;
        }

        try {
          await sock.sendMessage(customerJid, { text: statusMessage });
        } catch (err) {
          logger.error(err, "Error sending customer status notification:");
        }
      }

      // 2. Notify Admin
      const targetAdminNumber = adminNumber || process.env.WHATSAPP_ADMIN_NUMBER;
      if (targetAdminNumber) {
        let adminClean = targetAdminNumber.replace(/\D/g, '');
        if (adminClean.length === 10) adminClean = '91' + adminClean;
        const adminJid = `${adminClean}@s.whatsapp.net`;
        
        let adminStatusMessage = `🔄 *Status Update* | Ram Autos & Cabs\n\n` +
          `The following booking has been updated:\n` +
          `🆔 Booking ID: ${booking.booking_id}\n` +
          `👤 Customer: ${booking.name}\n` +
          `📌 New Status: *${booking.status}*`;

        try {
          await sock.sendMessage(adminJid, { text: adminStatusMessage });
        } catch (err) {
          logger.error(err, "Error sending admin status notification:");
        }
      }

      res.json({ success: true, message: "Status notification sent to customer and admin" });
    } catch (error: any) {
      logger.error(error, "Error sending status notification:");
      res.status(500).json({ error: error.message });
    }
  });

  const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(403).json({ error: "Forbidden. Invalid token." });
    }
    next();
  };

  app.get("/api/whatsapp-status", requireAdmin, (req, res) => {
    res.json({ isConnected, hasQr: !!qrCodeValue, qr: qrCodeValue });
  });

  app.post("/api/whatsapp-reconnect", requireAdmin, (req, res) => {
    if (sock) {
      try {
        sock.end(undefined);
      } catch (e) {
        logger.error(e, "Error ending existing socket");
      }
      sock = null;
    }
    
    qrCodeValue = null;
    isConnected = false;

    // Reconnect should just restart the socket, not wipe the session.
    
    connectToWhatsApp().catch(logger.error);
    
    res.json({ success: true });
  });


  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(err, "Unhandled API Error:");
    res.status(500).json({ success: false, error: "Internal Server Error" });
  });

  // Vite middleware for development
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));
  if (!isProduction) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
        host: '0.0.0.0'
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', async (req, res) => {
      try {
        let html = await fs.promises.readFile(path.join(distPath, 'index.html'), 'utf-8');
        const envScript = `<script>window.ENV = {
          VITE_SUPABASE_URL: "${process.env.VITE_SUPABASE_URL || ''}",
          VITE_SUPABASE_ANON_KEY: "${process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''}"
        };</script>`;
        html = html.replace('</head>', `${envScript}</head>`);
        res.send(html);
      } catch (err) {
        res.status(500).send('Error loading index.html');
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
