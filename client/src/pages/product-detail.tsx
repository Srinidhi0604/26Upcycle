import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircle, Heart, Calendar, Tag, DollarSign, Info, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Product, Chat, User as UserType } from "@shared/schema";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch product details
  const { 
    data: product, 
    isLoading: loadingProduct,
    error: productError
  } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error("Failed to fetch product");
      return res.json();
    },
    enabled: !!id
  });

  // Fetch seller info
  const { 
    data: seller,
    isLoading: loadingSeller 
  } = useQuery<UserType>({
    queryKey: [`/api/users/${product?.sellerId}`],
    queryFn: async () => {
      // Since we don't have a specific endpoint for this, we're mocking it
      // In a real app, we would fetch the seller info from the backend
      return {
        id: product?.sellerId || 0,
        username: "seller" + product?.sellerId,
        fullName: "Seller " + product?.sellerId,
        email: "seller@example.com",
        userType: "seller",
        createdAt: new Date().toISOString()
      } as UserType;
    },
    enabled: !!product?.sellerId
  });

  // Create chat mutation
  const createChatMutation = useMutation({
    mutationFn: async () => {
      if (!product || !user) return null;
      const chatData = {
        productId: product.id,
        sellerId: product.sellerId,
        collectorId: user.id
      };
      const res = await apiRequest("POST", "/api/chats", chatData);
      return res.json();
    },
    onSuccess: (data: Chat) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
        navigate(`/chats/${data.id}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start chat",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle chat button click
  const handleStartChat = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to chat with the seller",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    if (user.userType !== "collector" && user.userType !== "both") {
      toast({
        title: "Collector account required",
        description: "Only collectors or users with both roles can start chats with sellers",
        variant: "destructive"
      });
      return;
    }

    if (user.id === product?.sellerId) {
      toast({
        title: "Cannot chat with yourself",
        description: "You cannot start a chat for your own product",
        variant: "destructive"
      });
      return;
    }

    createChatMutation.mutate();
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format price
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loadingProduct) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-8">The product you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate("/products")}>
          Browse Other Products
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product images */}
        <div>
          <div className="bg-white rounded-lg overflow-hidden shadow-sm mb-4 aspect-square">
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[currentImageIndex]} 
                alt={product.title} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Info className="h-12 w-12 text-gray-400" />
                <p className="text-gray-500">No image available</p>
              </div>
            )}
          </div>
          
          {/* Thumbnail images */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((img, index) => (
                <div 
                  key={index}
                  className={`cursor-pointer rounded-md overflow-hidden border-2 ${
                    index === currentImageIndex ? 'border-primary' : 'border-transparent'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img 
                    src={img} 
                    alt={`${product.title} thumbnail ${index + 1}`} 
                    className="w-full h-full object-cover aspect-square"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <Badge variant="outline" className="mb-2 bg-primary/10 text-primary border-primary">
                  {product.category}
                </Badge>
                <h1 className="text-3xl font-bold">{product.title}</h1>
              </div>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-primary">
                <Heart className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="flex items-center text-2xl font-bold text-primary mt-2">
              {formatPrice(product.price)}
            </div>
            
            <div className="flex items-center mt-4 text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Listed on {formatDate(product.createdAt || new Date())}</span>
            </div>
            
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <Tag className="h-4 w-4 mr-1" />
              <span>Condition: {product.condition}</span>
            </div>
            
            <Separator className="my-6" />
            
            <div className="flex items-center mb-6">
              {loadingSeller ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-primary-light text-white flex items-center justify-center mr-3">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{seller?.fullName || "Seller"}</p>
                    <p className="text-sm text-gray-500">Seller</p>
                  </div>
                </>
              )}
            </div>
            
            <Tabs defaultValue="description">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="details" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-gray-600">Category</span>
                        <span className="font-medium">{product.category}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Condition</span>
                        <span className="font-medium">{product.condition}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Listed</span>
                        <span className="font-medium">{formatDate(product.createdAt || new Date())}</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              {user && user.id === product.sellerId ? (
                <Button className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600" onClick={() => navigate("/seller/dashboard")}>
                  Manage Your Listing
                </Button>
              ) : (
                <>
                  <Button 
                    className="w-full sm:w-auto flex-1 bg-primary hover:bg-primary-dark"
                    onClick={handleStartChat}
                    disabled={createChatMutation.isPending}
                  >
                    {createChatMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="mr-2 h-5 w-5" />
                    )}
                    Chat with Seller
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
