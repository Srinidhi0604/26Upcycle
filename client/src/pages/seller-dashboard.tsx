import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Plus, 
  MessageCircle, 
  Settings, 
  Package, 
  ShoppingBag,
  ChevronRight,
  Edit,
  Trash2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Product, Chat } from "@shared/schema";

export default function SellerDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("products");

  // Redirect if not a seller
  if (user && user.userType !== "seller") {
    navigate("/");
    toast({
      title: "Access Denied",
      description: "Only sellers can access the dashboard",
      variant: "destructive"
    });
  }

  // Fetch seller's products
  const { 
    data: products, 
    isLoading: loadingProducts
  } = useQuery<Product[]>({
    queryKey: ["/api/my-products"],
    queryFn: async () => {
      const res = await fetch("/api/my-products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    enabled: !!user && user.userType === "seller"
  });

  // Fetch chats
  const { 
    data: chats, 
    isLoading: loadingChats
  } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
    queryFn: async () => {
      const res = await fetch("/api/chats");
      if (!res.ok) throw new Error("Failed to fetch chats");
      return res.json();
    },
    enabled: !!user && user.userType === "seller"
  });

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format price
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Seller Dashboard</h1>
          <p className="text-gray-600">Manage your upcycled products and conversations</p>
        </div>
        <Button 
          className="mt-4 md:mt-0 bg-primary hover:bg-primary-dark"
          onClick={() => navigate("/seller/create")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Listing
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Stats cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingProducts ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                products?.length || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Chats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingChats ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                chats?.length || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Sold Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingProducts ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                products?.filter(p => p.sold).length || 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingProducts ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                formatPrice((products?.reduce((sum, p) => sum + p.price, 0) || 0))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="products" className="flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Products
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center">
            <MessageCircle className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b">
              <h2 className="text-xl font-semibold">Your Listings</h2>
            </div>
            
            {loadingProducts ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products?.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Listings Yet</h3>
                <p className="text-gray-600 mb-6">You haven't created any product listings yet.</p>
                <Button 
                  onClick={() => navigate("/seller/create")}
                  className="bg-primary hover:bg-primary-dark"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Listing
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {products?.map((product) => (
                  <div key={product.id} className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center flex-1">
                      <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img 
                            src={product.images[0]} 
                            alt={product.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center">
                          <h3 className="font-semibold text-lg">{product.title}</h3>
                          {product.sold && (
                            <Badge variant="secondary" className="ml-2">Sold</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{formatPrice(product.price)}</p>
                        <p className="text-gray-500 text-xs mt-1">Listed on {formatDate(product.createdAt || new Date())}</p>
                      </div>
                    </div>
                    <div className="flex items-center mt-4 md:mt-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mr-2"
                        onClick={() => toast({
                          title: "Coming Soon",
                          description: "Edit functionality will be available soon",
                        })}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => toast({
                          title: "Coming Soon",
                          description: "Delete functionality will be available soon",
                        })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate(`/products/${product.id}`)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b">
              <h2 className="text-xl font-semibold">Conversations</h2>
            </div>
            
            {loadingChats ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : chats?.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
                <p className="text-gray-600">When collectors contact you about your products, their messages will appear here.</p>
              </div>
            ) : (
              <div className="divide-y">
                {chats?.map((chat) => (
                  <div 
                    key={chat.id} 
                    className="p-4 md:p-6 flex items-start justify-between hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/chats/${chat.id}`)}
                  >
                    <div className="flex items-center flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary-light text-white flex items-center justify-center">
                        <span>C{chat.collectorId}</span>
                      </div>
                      <div className="ml-4">
                        <p className="font-medium">Collector {chat.collectorId}</p>
                        <p className="text-gray-600 text-sm">Product #{chat.productId}</p>
                        <p className="text-gray-500 text-xs mt-1">Started {formatDate(chat.createdAt || new Date())}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your seller profile and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Account Information</h3>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p>{user?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p>{user?.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p>{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Type</p>
                    <p className="capitalize">{user?.userType}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Account Settings</h3>
                <Separator />
                <p className="text-gray-600 text-sm">
                  Account settings management will be available in a future update.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Coming Soon",
                    description: "Account settings management will be available soon"
                  });
                }}
              >
                Edit Profile
              </Button>
              <Button
                variant="default"
                className="bg-primary hover:bg-primary-dark"
                onClick={() => {
                  toast({
                    title: "Coming Soon",
                    description: "Account settings management will be available soon"
                  });
                }}
              >
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
