import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import ChatInterface from "@/components/chat-interface";
import { Chat as ChatType, Message, User, Product } from "@shared/schema";

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(id ? parseInt(id) : null);

  // Set chat ID from URL parameter if provided
  useEffect(() => {
    if (id) {
      setSelectedChatId(parseInt(id));
    }
  }, [id]);

  // Fetch all chats for the user
  const { 
    data: chats, 
    isLoading: loadingChats,
    error: chatsError
  } = useQuery<ChatType[]>({
    queryKey: ["/api/chats"],
    queryFn: async () => {
      const res = await fetch("/api/chats");
      if (!res.ok) throw new Error("Failed to fetch chats");
      return res.json();
    },
    enabled: !!user
  });

  // Fetch messages for the selected chat
  const { 
    data: messages, 
    isLoading: loadingMessages,
    error: messagesError
  } = useQuery<Message[]>({
    queryKey: [`/api/chats/${selectedChatId}/messages`],
    queryFn: async () => {
      const res = await fetch(`/api/chats/${selectedChatId}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!selectedChatId
  });

  // Fetch product details for the selected chat
  const {
    data: selectedChatDetails,
    isLoading: loadingChatDetails
  } = useQuery<ChatType>({
    queryKey: [`/api/chats/${selectedChatId}`],
    queryFn: async () => {
      const res = await fetch(`/api/chats/${selectedChatId}`);
      if (!res.ok) throw new Error("Failed to fetch chat details");
      return res.json();
    },
    enabled: !!selectedChatId
  });

  // Fetch product details
  const {
    data: productDetails,
    isLoading: loadingProduct
  } = useQuery<Product>({
    queryKey: [`/api/products/${selectedChatDetails?.productId}`],
    queryFn: async () => {
      const res = await fetch(`/api/products/${selectedChatDetails?.productId}`);
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json();
    },
    enabled: !!selectedChatDetails?.productId
  });

  // Helper function to get partner information
  const getPartnerInfo = (chat: ChatType): User | null => {
    if (!user) return null;
    
    // Determine which user in the chat is the partner
    const partnerId = user.id === chat.sellerId ? chat.collectorId : chat.sellerId;
    
    // Find the partner among users we've loaded
    // In a production app, we would fetch this from an API endpoint
    // For now we'll use a simpler approach with the information we have
    return {
      id: partnerId,
      username: user.id === chat.sellerId ? `collector${partnerId}` : `seller${partnerId}`,
      fullName: user.id === chat.sellerId ? `Collector ${partnerId}` : `Seller ${partnerId}`,
      email: user.id === chat.sellerId ? `collector${partnerId}@example.com` : `seller${partnerId}@example.com`,
      userType: user.id === chat.sellerId ? "collector" : "seller",
      createdAt: new Date(),
      password: "", // Required by the type but not used
      avatar: null // Required by the type
    };
  };

  // Get partner info for the selected chat
  const selectedChatPartner = selectedChatDetails 
    ? getPartnerInfo(selectedChatDetails) 
    : null;

  // Format time/date
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return ""; // Handle null date
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Authentication Required</h2>
            <p className="text-gray-600 text-center mb-4">Please log in to access your messages.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadingChats) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (chatsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-center mb-2">Error Loading Chats</h2>
            <p className="text-gray-600 text-center mb-4">{(chatsError as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chat List */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <CardDescription>Your active conversations</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {chats && chats.length > 0 ? (
                <div className="divide-y">
                  {chats.map((chat) => {
                    const partner = getPartnerInfo(chat);
                    const isSelected = selectedChatId === chat.id;
                    
                    return (
                      <div 
                        key={chat.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                          isSelected ? 'bg-gray-50 border-l-4 border-primary' : ''
                        }`}
                        onClick={() => setSelectedChatId(chat.id)}
                      >
                        <div className="flex items-start">
                          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                            {partner?.fullName.charAt(0).toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium text-gray-900 truncate">
                                {partner?.fullName || "Unknown User"}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {formatDate(chat.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {partner?.userType === "seller" ? "Seller" : "Collector"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <MessageCircle className="h-10 w-10 text-gray-300" />
                  </div>
                  <h3 className="font-medium mb-1">No conversations yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Start browsing products to connect with sellers.</p>
                  <Button 
                    className="bg-primary hover:bg-primary-dark"
                    onClick={() => window.location.href = "/products"}
                  >
                    Browse Products
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Chat Window */}
        <div className="md:col-span-2">
          {selectedChatId ? (
            <ChatInterface 
              chat={selectedChatDetails!}
              messages={messages || []}
              isLoading={loadingMessages || loadingChatDetails}
              partner={selectedChatPartner}
              product={productDetails || null}
            />
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <CardContent className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Select a Conversation</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Choose a conversation from the list to start chatting
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
