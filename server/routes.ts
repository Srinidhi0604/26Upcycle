import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertProductSchema, insertChatSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

// Connection tracking
interface ExtendedWebSocket extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

// Message types
type WebSocketMessage = {
  type: string;
  data: any;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // HTTP Server
  const httpServer = createServer(app);

  // WebSocket Server for chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Store active connections by userId
  const clients = new Map<number, ExtendedWebSocket[]>();

  // Heartbeat to keep connections alive
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (ws.isAlive === false) return ws.terminate();
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  wss.on('connection', (ws: ExtendedWebSocket) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', async (message) => {
      try {
        const data: WebSocketMessage = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'auth':
            // Authenticate the WebSocket connection
            if (data.data?.userId) {
              const user = await storage.getUser(data.data.userId);
              if (user) {
                ws.userId = user.id;
                
                // Store the connection
                if (!clients.has(user.id)) {
                  clients.set(user.id, []);
                }
                clients.get(user.id)?.push(ws);
                
                // Notify client of successful connection
                ws.send(JSON.stringify({ 
                  type: 'auth_success', 
                  data: { message: 'Authentication successful' } 
                }));
              }
            }
            break;
            
          case 'message':
            // Handle new message
            if (!ws.userId) {
              ws.send(JSON.stringify({ 
                type: 'error', 
                data: { message: 'Not authenticated' } 
              }));
              return;
            }
            
            try {
              const { chatId, content } = data.data;
              
              // Validate data
              if (!chatId || !content) {
                ws.send(JSON.stringify({ 
                  type: 'error', 
                  data: { message: 'Invalid message data' } 
                }));
                return;
              }
              
              const chat = await storage.getChat(chatId);
              if (!chat) {
                ws.send(JSON.stringify({ 
                  type: 'error', 
                  data: { message: 'Chat not found' } 
                }));
                return;
              }
              
              // Save message
              const message = await storage.createMessage({
                chatId,
                senderId: ws.userId,
                content
              });
              
              // Broadcast to all participants
              const participantIds = [chat.sellerId, chat.collectorId];
              participantIds.forEach(userId => {
                const userConnections = clients.get(userId) || [];
                userConnections.forEach(client => {
                  // Make sure client is open before sending messages
                  if (client.readyState === WebSocket.OPEN) {
                    try {
                      client.send(JSON.stringify({
                        type: 'new_message',
                        data: message
                      }));
                      console.log(`Message sent to user ${userId}`);
                    } catch (err) {
                      console.error(`Error sending message to user ${userId}:`, err);
                    }
                  } else {
                    console.log(`Cannot send to user ${userId}, connection not open (state: ${client.readyState})`);
                  }
                });
              });
            } catch (error) {
              console.error('Error handling message:', error);
              ws.send(JSON.stringify({ 
                type: 'error', 
                data: { message: 'Failed to process message' } 
              }));
            }
            break;
            
          default:
            ws.send(JSON.stringify({ 
              type: 'error', 
              data: { message: 'Unknown message type' } 
            }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        // Remove connection from clients map
        const userConnections = clients.get(ws.userId);
        if (userConnections) {
          const index = userConnections.indexOf(ws);
          if (index !== -1) {
            userConnections.splice(index, 1);
          }
          if (userConnections.length === 0) {
            clients.delete(ws.userId);
          }
        }
      }
    });
  });

  // API Routes
  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      let products;
      
      if (category) {
        products = await storage.getProductsByCategory(category);
      } else {
        products = await storage.getProducts();
      }
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (req.user.userType !== "seller") {
        return res.status(403).json({ message: "Only sellers can create listings" });
      }
      
      const validatedData = insertProductSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: validatedData.error.format() 
        });
      }
      
      const product = await storage.createProduct(validatedData.data, req.user.id);
      res.status(201).json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // User's products (for seller dashboard)
  app.get("/api/my-products", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const products = await storage.getProductsBySeller(req.user.id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Chat endpoints
  app.post("/api/chats", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const validatedData = insertChatSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ 
          message: "Invalid chat data", 
          errors: validatedData.error.format() 
        });
      }
      
      // Check if chat already exists
      const { productId, sellerId, collectorId } = validatedData.data;
      
      // Only collector can initiate chat
      if (req.user.id !== collectorId) {
        return res.status(403).json({ message: "Only collectors can initiate chats" });
      }
      
      // Check if product exists
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if seller exists
      const seller = await storage.getUser(sellerId);
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }
      
      // Check if chat already exists
      const existingChat = await storage.getChatByProductAndUsers(productId, sellerId, collectorId);
      if (existingChat) {
        return res.json(existingChat);
      }
      
      // Create new chat
      const chat = await storage.createChat(validatedData.data);
      res.status(201).json(chat);
    } catch (error) {
      res.status(500).json({ message: "Failed to create chat" });
    }
  });

  app.get("/api/chats", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const chats = await storage.getChatsByUser(req.user.id);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.get("/api/chats/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }
      
      const chat = await storage.getChat(id);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Check if user is part of this chat
      if (chat.sellerId !== req.user.id && chat.collectorId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to chat" });
      }
      
      res.json(chat);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat" });
    }
  });

  app.get("/api/chats/:id/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid chat ID" });
      }
      
      const chat = await storage.getChat(id);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      // Check if user is part of this chat
      if (chat.sellerId !== req.user.id && chat.collectorId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized access to chat" });
      }
      
      const messages = await storage.getMessages(id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get user by ID (for product detail, etc.)
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send sensitive information
      const { password, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Categories (for filtering)
  app.get("/api/categories", async (req, res) => {
    try {
      // Static list of categories
      const categories = [
        { id: "furniture", name: "Furniture" },
        { id: "home-decor", name: "Home Decor" },
        { id: "vintage-collectibles", name: "Vintage Collectibles" },
        { id: "clothing", name: "Clothing" },
        { id: "lighting", name: "Lighting" },
        { id: "electronics", name: "Electronics" },
        { id: "art", name: "Art" },
        { id: "jewelry", name: "Jewelry" }
      ];
      
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  return httpServer;
}
