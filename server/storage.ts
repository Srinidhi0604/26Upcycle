import { supabase } from './db';
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import type { Database } from '../types/supabase';

type User = Database['public']['Tables']['users']['Row'];
type InsertUser = Database['public']['Tables']['users']['Insert'];
type Product = Database['public']['Tables']['products']['Row'];
type InsertProduct = Database['public']['Tables']['products']['Insert'];
type Chat = Database['public']['Tables']['chats']['Row'];
type InsertChat = Database['public']['Tables']['chats']['Insert'];
type Message = Database['public']['Tables']['messages']['Row'];
type InsertMessage = Database['public']['Tables']['messages']['Insert'];

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
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('username', username)
      .single();
    
    if (error) throw error;
    return data || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .single();
    
    if (error) throw error;
    return data || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create user');
    return data;
  }

  // Product operations
  async getProduct(id: number): Promise<Product | undefined> {
    const { data, error } = await supabase
      .from('products')
      .select()
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data || undefined;
  }

  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select()
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select()
      .eq('category', category)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getProductsBySeller(sellerId: number): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select()
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createProduct(product: InsertProduct, sellerId: number): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...product, seller_id: sellerId })
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create product');
    return data;
  }

  async updateProduct(id: number, updates: Partial<Product>): Promise<Product | undefined> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data || undefined;
  }

  // Chat operations
  async getChat(id: number): Promise<Chat | undefined> {
    const { data, error } = await supabase
      .from('chats')
      .select()
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data || undefined;
  }

  async getChatsByUser(userId: number): Promise<Chat[]> {
    const { data, error } = await supabase
      .from('chats')
      .select()
      .or(`seller_id.eq.${userId},collector_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getChatByProductAndUsers(
    productId: number,
    sellerId: number,
    collectorId: number
  ): Promise<Chat | undefined> {
    const { data, error } = await supabase
      .from('chats')
      .select()
      .eq('product_id', productId)
      .eq('seller_id', sellerId)
      .eq('collector_id', collectorId)
      .single();
    
    if (error) throw error;
    return data || undefined;
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const { data, error } = await supabase
      .from('chats')
      .insert(chat)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create chat');
    return data;
  }

  // Message operations
  async getMessages(chatId: number): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select()
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create message');
    return data;
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
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      full_name: insertUser.full_name,
      email: insertUser.email,
      user_type: insertUser.user_type,
      avatar: insertUser.avatar || null,
      created_at: new Date().toISOString()
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
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.category === category && !product.sold)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getProductsBySeller(sellerId: number): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.seller_id === sellerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async createProduct(product: InsertProduct, sellerId: number): Promise<Product> {
    const id = this.productId++;
    const newProduct: Product = {
      ...product,
      id,
      seller_id: sellerId,
      sold: false,
      created_at: new Date().toISOString()
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
      .filter(chat => chat.seller_id === userId || chat.collector_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getChatByProductAndUsers(productId: number, sellerId: number, collectorId: number): Promise<Chat | undefined> {
    return Array.from(this.chats.values()).find(
      chat => chat.product_id === productId && chat.seller_id === sellerId && chat.collector_id === collectorId
    );
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const id = this.chatId++;
    const newChat: Chat = {
      ...chat,
      id,
      created_at: new Date().toISOString()
    };
    this.chats.set(id, newChat);
    return newChat;
  }

  // Message operations
  async getMessages(chatId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.chat_id === chatId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const newMessage: Message = {
      ...message,
      id,
      created_at: new Date().toISOString()
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }
}

// Now using DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
