import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Chat, Message, User } from "@shared/schema";

interface ChatInterfaceProps {
  chat: Chat;
  messages: Message[];
  isLoading: boolean;
  partner: User | null;
  product: {
    id: number;
    title: string;
    price: number;
    images?: string[];
  } | null;
}

interface WebSocketMessage {
  type: string;
  data: any;
}

export default function ChatInterface({ chat, messages, isLoading, partner, product }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messageText, setMessageText] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Combine server messages with local ones
  useEffect(() => {
    if (messages) {
      setLocalMessages(messages);
    }
  }, [messages]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!chat || !user) {
      console.log("Chat or user not available, not connecting WebSocket");
      return;
    }

    // Create WebSocket connection using correct protocol and path
    // We need to use the same host as the API requests since we're using a proxy in development
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    
    // Determine the correct WebSocket URL based on environment
    let wsUrl;
    if (import.meta.env.PROD) {
      // In production on Netlify, use their functions for WebSocket communication
      wsUrl = `${protocol}//${window.location.host}/.netlify/functions/websocket`;
    } else {
      // In development, use the /ws path configured in the WebSocketServer setup in server/routes.ts
      wsUrl = `${protocol}//${window.location.host}/ws`;
    }
    console.log(`Connecting to WebSocket at: ${wsUrl}`);
    
    let ws: WebSocket | undefined;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    const reconnectDelay = 2000; // 2 seconds
    
    const connectWebSocket = () => {
      try {
        console.log("Creating new WebSocket connection");
        ws = new WebSocket(wsUrl);
        
        // Add connection event handlers
        ws.onopen = () => {
          console.log("WebSocket connected successfully");
          reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          
          // Authenticate the connection
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: "auth",
              data: { userId: user.id }
            }));
            console.log("Sent authentication message");
          } else {
            console.error("WebSocket not open when trying to authenticate");
          }
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log("Received WebSocket message:", message.type);
            
            switch (message.type) {
              case "auth_success":
                setWsConnected(true);
                console.log("WebSocket authenticated successfully");
                break;
              case "new_message":
                // Add message to local state if it's for this chat
                if (message.data.chatId === chat.id) {
                  console.log("Received new message for current chat");
                  setLocalMessages(prev => [...prev, message.data]);
                  scrollToBottom();
                }
                break;
              case "error":
                console.error("WebSocket error from server:", message.data.message);
                toast({
                  title: "Error",
                  description: message.data.message,
                  variant: "destructive"
                });
                break;
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket connection error:", error);
          setWsConnected(false);
        };

        ws.onclose = (event) => {
          console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
          setWsConnected(false);
          
          // Only attempt to reconnect if it was an abnormal closure and we haven't exceeded max attempts
          if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts}) in ${reconnectDelay}ms`);
            
            setTimeout(() => {
              connectWebSocket();
            }, reconnectDelay);
          } else if (event.code !== 1000) {
            // Only show toast for unexpected disconnections that won't be automatically reconnected
            toast({
              title: "Connection Lost",
              description: "Chat connection was lost. Please refresh the page to reconnect.",
              variant: "destructive"
            });
          }
        };

        setWebsocket(ws);
      } catch (error) {
        console.error("Error creating WebSocket:", error);
        toast({
          title: "Connection Error",
          description: "Failed to establish chat connection",
          variant: "destructive"
        });
      }
    };
    
    // Start the connection
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log("Closing WebSocket connection");
        ws.close(1000, "Component unmounting");
      }
    };
  }, [chat, user, toast]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !websocket || !wsConnected) return;

    websocket.send(JSON.stringify({
      type: "message",
      data: {
        chatId: chat.id,
        content: messageText.trim()
      }
    }));

    setMessageText("");
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      {/* Chat Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mr-3">
            {partner ? partner.fullName.charAt(0).toUpperCase() : "?"}
          </div>
          <div>
            <h3 className="font-semibold">
              {partner ? partner.fullName : "Loading..."}
            </h3>
            <p className="text-sm text-gray-500">{partner?.userType === "seller" ? "Seller" : "Collector"}</p>
          </div>
        </div>
      </div>

      {/* Product Info (if available) */}
      {product && (
        <div className="p-3 border-b bg-gray-50">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img 
                  src={product.images[0]} 
                  alt={product.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="font-medium text-sm line-clamp-1">{product.title}</p>
              <p className="text-primary text-sm font-semibold">{formatPrice(product.price)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {localMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {localMessages.map((message) => {
              const isMe = message.senderId === user?.id;
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isMe 
                        ? 'bg-primary text-white rounded-br-none' 
                        : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-primary-50' : 'text-gray-500'}`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-3 border-t bg-white">
        <div className="flex items-end space-x-2">
          <Textarea
            placeholder="Type your message..."
            className="flex-1 min-h-[60px] resize-none"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!wsConnected || !messageText.trim()}
            className="bg-primary hover:bg-primary-dark"
          >
            {!wsConnected ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        {!wsConnected && (
          <p className="text-xs text-amber-600 mt-1">Connecting to chat service...</p>
        )}
      </div>
    </div>
  );
}
