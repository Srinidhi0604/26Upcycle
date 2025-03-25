const express = require('express');
const serverless = require('serverless-http');
const app = express();
const { Pool } = require('pg');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { scrypt, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');
const connectPgSimple = require('connect-pg-simple');
const cors = require('cors');

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Setup middleware
app.use(express.json());
app.use(cors({
  origin: process.env.SITE_URL || true,
  credentials: true
}));

// Utilities for password hashing
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64));
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64));
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Session setup
const PgSessionStore = connectPgSimple(session);
const sessionConfig = {
  store: new PgSessionStore({
    pool,
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  }
};

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// Auth setup
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    
    if (!user || !(await comparePasswords(password, user.password))) {
      return done(null, false);
    } 
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});

// API Routes
app.post("/api/register", async (req, res, next) => {
  try {
    const { username, password, email, fullName, userType, avatar } = req.body;
    
    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length) {
      return res.status(400).json({ error: "Username already exists" });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const result = await pool.query(
      'INSERT INTO users (username, password, email, "fullName", "userType", avatar, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [username, hashedPassword, email, fullName, userType, avatar, new Date()]
    );
    
    const user = result.rows[0];
    
    // Log user in
    req.login(user, (err) => {
      if (err) return next(err);
      return res.status(201).json(user);
    });
  } catch (err) {
    next(err);
  }
});

app.post("/api/login", passport.authenticate("local"), (req, res) => {
  res.status(200).json(req.user);
});

app.post("/api/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

app.get("/api/user", (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  res.json(req.user);
});

// Product routes
app.get("/api/products", async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE sold = false ORDER BY "createdAt" DESC'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.get("/api/products/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.post("/api/products", async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const { title, description, price, category, images, materials } = req.body;
    const sellerId = req.user.id;
    
    const result = await pool.query(
      'INSERT INTO products (title, description, price, category, images, "sellerId", materials, sold, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [title, description, price, category, images, sellerId, materials, false, new Date()]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Categories
app.get("/api/categories", (req, res) => {
  const categories = [
    { id: "furniture", name: "Furniture" },
    { id: "clothing", name: "Clothing" },
    { id: "jewelry", name: "Jewelry" },
    { id: "art", name: "Art" },
    { id: "electronics", name: "Electronics" },
    { id: "home-decor", name: "Home Decor" }
  ];
  res.json(categories);
});

// User routes
app.get("/api/users/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT id, username, "fullName", email, "userType", avatar, "createdAt" FROM users WHERE id = $1', [id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Chat routes
app.get("/api/chats/:chatId/messages", async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const { chatId } = req.params;
    const result = await pool.query(
      'SELECT * FROM messages WHERE "chatId" = $1 ORDER BY "createdAt" ASC',
      [chatId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.get("/api/chats", async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM chats WHERE "sellerId" = $1 OR "collectorId" = $1 ORDER BY "createdAt" DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.post("/api/chats", async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const { productId, sellerId, collectorId } = req.body;
    
    // Check if chat already exists
    const existingChat = await pool.query(
      'SELECT * FROM chats WHERE "productId" = $1 AND "sellerId" = $2 AND "collectorId" = $3',
      [productId, sellerId, collectorId]
    );
    
    if (existingChat.rows.length) {
      return res.json(existingChat.rows[0]);
    }
    
    // Create new chat
    const result = await pool.query(
      'INSERT INTO chats ("productId", "sellerId", "collectorId", "createdAt") VALUES ($1, $2, $3, $4) RETURNING *',
      [productId, sellerId, collectorId, new Date()]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.post("/api/messages", async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const { chatId, senderId, content } = req.body;
    
    // Create message
    const result = await pool.query(
      'INSERT INTO messages ("chatId", "senderId", content, "createdAt") VALUES ($1, $2, $3, $4) RETURNING *',
      [chatId, senderId, content, new Date()]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// Export the serverless function
module.exports.handler = serverless(app);