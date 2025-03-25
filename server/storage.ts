import { users, type User, type InsertUser, products, type Product, type InsertProduct, chats, type Chat, type InsertChat, messages, type Message, type InsertMessage } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product operations
  getProduct(id: number): Promise<Product | undefined>;
  getProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getProductsBySeller(sellerId: number): Promise<Product[]>;
  createProduct(product: InsertProduct, sellerId: number): Promise<Product>;
  updateProduct(id: number, product: Partial<Product>): Promise<Product | undefined>;
  
  // Chat operations
  getChat(id: number): Promise<Chat | undefined>;
  getChatsByUser(userId: number): Promise<Chat[]>;
  getChatByProductAndUsers(productId: number, sellerId: number, collectorId: number): Promise<Chat | undefined>;
  createChat(chat: InsertChat): Promise<Chat>;
  
  // Message operations
  getMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result.length ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result.length ? result[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result.length ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result.length ? result[0] : undefined;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select()
      .from(products)
      .where(eq(products.sold, false))
      .orderBy(desc(products.createdAt));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db.select()
      .from(products)
      .where(and(
        eq(products.category, category),
        eq(products.sold, false)
      ))
      .orderBy(desc(products.createdAt));
  }

  async getProductsBySeller(sellerId: number): Promise<Product[]> {
    return await db.select()
      .from(products)
      .where(eq(products.sellerId, sellerId))
      .orderBy(desc(products.createdAt));
  }

  async createProduct(product: InsertProduct, sellerId: number): Promise<Product> {
    const result = await db.insert(products)
      .values({ ...product, sellerId, sold: false })
      .returning();
    return result[0];
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const result = await db.update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return result.length ? result[0] : undefined;
  }

  // Chat operations
  async getChat(id: number): Promise<Chat | undefined> {
    const result = await db.select().from(chats).where(eq(chats.id, id)).limit(1);
    return result.length ? result[0] : undefined;
  }

  async getChatsByUser(userId: number): Promise<Chat[]> {
    return await db.select()
      .from(chats)
      .where(and(
        eq(chats.sellerId, userId),
        eq(chats.collectorId, userId)
      ))
      .orderBy(desc(chats.createdAt));
  }

  async getChatByProductAndUsers(productId: number, sellerId: number, collectorId: number): Promise<Chat | undefined> {
    const result = await db.select()
      .from(chats)
      .where(and(
        eq(chats.productId, productId),
        eq(chats.sellerId, sellerId),
        eq(chats.collectorId, collectorId)
      ))
      .limit(1);
    return result.length ? result[0] : undefined;
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const result = await db.insert(chats).values(chat).returning();
    return result[0];
  }

  // Message operations
  async getMessages(chatId: number): Promise<Message[]> {
    return await db.select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }
}

// For in-memory storage (keeping this as a fallback if needed)
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private chats: Map<number, Chat>;
  private messages: Map<number, Message>;
  sessionStore: session.Store;
  private userId: number;
  private productId: number;
  private chatId: number;
  private messageId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.userId = 1;
    this.productId = 1;
    this.chatId = 1;
    this.messageId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    // Explicitly assign values to make TypeScript happy
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      fullName: insertUser.fullName,
      email: insertUser.email,
      userType: insertUser.userType,
      avatar: insertUser.avatar || null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => !product.sold)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.category === category && !product.sold)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getProductsBySeller(sellerId: number): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.sellerId === sellerId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createProduct(product: InsertProduct, sellerId: number): Promise<Product> {
    const id = this.productId++;
    const newProduct: Product = {
      ...product,
      id,
      sellerId,
      sold: false,
      createdAt: new Date()
    };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  // Chat operations
  async getChat(id: number): Promise<Chat | undefined> {
    return this.chats.get(id);
  }

  async getChatsByUser(userId: number): Promise<Chat[]> {
    return Array.from(this.chats.values())
      .filter(chat => chat.sellerId === userId || chat.collectorId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getChatByProductAndUsers(productId: number, sellerId: number, collectorId: number): Promise<Chat | undefined> {
    return Array.from(this.chats.values()).find(
      chat => chat.productId === productId && chat.sellerId === sellerId && chat.collectorId === collectorId
    );
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const id = this.chatId++;
    const newChat: Chat = {
      ...chat,
      id,
      createdAt: new Date()
    };
    this.chats.set(id, newChat);
    return newChat;
  }

  // Message operations
  async getMessages(chatId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.chatId === chatId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const newMessage: Message = {
      ...message,
      id,
      createdAt: new Date()
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }
}

// Now using DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
