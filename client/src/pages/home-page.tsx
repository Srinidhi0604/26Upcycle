import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import ProductCard from "@/components/product-card";
import CategoryCard from "@/components/category-card";
import { Product } from "@shared/schema";

const categories = [
  { id: "furniture", name: "Furniture", imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc" },
  { id: "home-decor", name: "Home Decor", imageUrl: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d" },
  { id: "vintage-collectibles", name: "Vintage Collectibles", imageUrl: "https://images.unsplash.com/photo-1617503752587-97d2103a96ea" },
  { id: "clothing", name: "Clothing", imageUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f" }
];

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch featured products
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products?limit=4");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    }
  });

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-primary-dark text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">Give Items a Second Life</h1>
            <p className="text-lg mb-8">Join our community of sustainable sellers and conscious collectors to buy, sell, and upcycle items that deserve a new home.</p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {user?.userType === "seller" ? (
                <Button 
                  className="bg-[#FFB300] text-[#333333] font-bold hover:bg-[#FF8F00]"
                  onClick={() => navigate("/seller/create")}
                >
                  Create Listing
                </Button>
              ) : (
                <Button 
                  className="bg-[#FFB300] text-[#333333] font-bold hover:bg-[#FF8F00]"
                  onClick={() => user ? navigate("/products") : navigate("/auth")}
                >
                  {user?.userType === "collector" ? "Start Collecting" : "Start Selling"}
                </Button>
              )}
              <Button 
                variant="outline" 
                className="bg-white text-primary font-bold hover:bg-neutral-200"
                onClick={() => navigate("/products")}
              >
                Browse Items
              </Button>
            </div>
          </div>
        </div>
        {/* We don't render the image because it has data-mock="true" in the HTML */}
      </section>

      {/* Categories */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Browse by Category</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map(category => (
              <CategoryCard 
                key={category.id} 
                category={category} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Link href="/products" className="text-primary font-medium flex items-center hover:text-primary-dark transition-colors">
              View all
              <ArrowRight className="h-5 w-5 ml-1" />
            </Link>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products?.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-light text-white w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Create an Account</h3>
              <p className="text-gray-600">Sign up as a seller or collector to start your sustainable journey.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-light text-white w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">List or Browse Items</h3>
              <p className="text-gray-600">Upload your upcycled creations or find unique products to purchase.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-light text-white w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
                  <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Chat & Connect</h3>
              <p className="text-gray-600">Negotiate prices and discuss details directly with other users.</p>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            {!user ? (
              <Button 
                className="bg-primary hover:bg-primary-dark text-white font-bold"
                onClick={() => navigate("/auth")}
              >
                Join Our Community
              </Button>
            ) : (
              <Button 
                className="bg-primary hover:bg-primary-dark text-white font-bold"
                onClick={() => user.userType === "seller" ? navigate("/seller/create") : navigate("/products")}
              >
                {user.userType === "seller" ? "Create a Listing" : "Start Browsing"}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-primary text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Community Says</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-10 p-6 rounded-xl backdrop-blur-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-[#FFB300] flex items-center justify-center mr-4">
                  <span className="text-neutral-dark font-bold">SM</span>
                </div>
                <div>
                  <h4 className="font-bold">Sarah M.</h4>
                  <p className="text-sm opacity-80">Collector</p>
                </div>
              </div>
              <p className="italic">"I've found the most unique pieces for my home on UpcycleHub. The chat feature makes it easy to learn the story behind each item."</p>
            </div>
            
            <div className="bg-white bg-opacity-10 p-6 rounded-xl backdrop-blur-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-[#FFB300] flex items-center justify-center mr-4">
                  <span className="text-neutral-dark font-bold">JT</span>
                </div>
                <div>
                  <h4 className="font-bold">James T.</h4>
                  <p className="text-sm opacity-80">Seller</p>
                </div>
              </div>
              <p className="italic">"As an artisan who creates furniture from reclaimed wood, UpcycleHub has connected me with customers who truly appreciate sustainable craftsmanship."</p>
            </div>
            
            <div className="bg-white bg-opacity-10 p-6 rounded-xl backdrop-blur-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-[#FFB300] flex items-center justify-center mr-4">
                  <span className="text-neutral-dark font-bold">KL</span>
                </div>
                <div>
                  <h4 className="font-bold">Kira L.</h4>
                  <p className="text-sm opacity-80">Collector & Seller</p>
                </div>
              </div>
              <p className="italic">"I started as a buyer, but was so inspired by the community that I now create and sell my own upcycled clothing. The platform is intuitive and supportive."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-[#00796B]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Join the Circular Economy?</h2>
          <p className="text-white text-lg max-w-2xl mx-auto mb-8">Whether you're looking to sell unique upcycled items or find sustainable treasures, UpcycleHub is your community.</p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            {!user ? (
              <>
                <Button 
                  className="bg-[#FFB300] text-[#333333] font-bold hover:bg-[#FF8F00]"
                  onClick={() => navigate("/auth?type=seller")}
                >
                  Create Seller Account
                </Button>
                <Button 
                  variant="outline"
                  className="bg-white text-[#00796B] font-bold hover:bg-gray-200"
                  onClick={() => navigate("/auth?type=collector")}
                >
                  Sign Up as Collector
                </Button>
              </>
            ) : (
              <Button 
                className="bg-[#FFB300] text-[#333333] font-bold hover:bg-[#FF8F00]"
                onClick={() => user.userType === "seller" ? navigate("/seller/create") : navigate("/products")}
              >
                {user.userType === "seller" ? "Create a Listing" : "Browse Products"}
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
