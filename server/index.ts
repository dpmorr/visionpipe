import '../server/config'; // ✅ good

import cors from 'cors';
import session from 'express-session';

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupAuth } from "./auth";
import { db } from "@db";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { setupSwagger } from './openapi';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Allow cross-origin cookies from frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

// Basic middleware setup - ensure these are before any routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Log incoming requests with body
  if (req.method === 'POST') {
    console.log(`Incoming ${req.method} ${path}:`, {
      headers: req.headers,
      body: req.body
    });
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Set up authentication before routes
console.log('Setting up authentication...', new Date().toISOString());
setupAuth(app);
console.log('Authentication setup completed', new Date().toISOString());

// Register API routes before static file serving
console.log('Registering routes...', new Date().toISOString());
registerRoutes(app);
console.log('Routes registered successfully', new Date().toISOString());

// Add JSON error handling middleware after routes but before static serving
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);

  // Ensure we always return JSON for API routes
  if (req.path.startsWith('/api')) {
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } else {
    next(err);
  }
});

setupSwagger(app);

const startServer = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    let retryCount = 0;
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 1000;
    let server: any = null;

    const PORT = process.env.PORT || 3000;
    console.log(`Using port ${PORT} for server`);

    // Function to attempt starting the server
    const attemptStart = () => new Promise<void>((resolve, reject) => {
      try {
        if (server) {
          server.close();
        }

        console.log(`Attempting to start server on port ${PORT} (attempt ${retryCount + 1}/${MAX_RETRIES})...`);

        const newServer = app.listen(PORT, '0.0.0.0', () => {
          console.log(`Server is running on port ${PORT}`);
          console.log('Server is accessible externally');

          // Log static file serving details
          const staticDir = path.resolve(__dirname, "public");
          console.log(`Static files directory: ${staticDir}`);
          if (fs.existsSync(staticDir)) {
            try {
              const symlinkTarget = fs.readlinkSync(staticDir);
              console.log(`Static files symlink target: ${symlinkTarget}`);
            } catch (error) {
              console.log('Static directory exists but is not a symlink');
            }
          } else {
            console.log('Static directory does not exist');
          }

          server = newServer;

          // Setup static file serving since we're in production mode
          console.log('Setting up static file serving...', new Date().toISOString());
          serveStatic(app);
          console.log('Static file serving setup completed', new Date().toISOString());

          resolve();
        });

        newServer.on('error', (err: any) => {
          console.error('Detailed server error:', {
            code: err.code,
            message: err.message,
            stack: err.stack
          });

          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${PORT} is in use, attempting cleanup...`);
            reject(err);
          } else {
            console.error('Server error:', err);
            reject(err);
          }
        });
      } catch (error) {
        console.error('Error in server start attempt:', error);
        reject(error);
      }
    });

    // Retry logic with cleanup
    while (retryCount < MAX_RETRIES) {
      try {
        await attemptStart();
        break;
      } catch (error) {
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          throw new Error(`Failed to start server after ${MAX_RETRIES} attempts`);
        }
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle cleanup on shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Performing cleanup...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Performing cleanup...');
  process.exit(0);
});

startServer();