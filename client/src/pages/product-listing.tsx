import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Search, Filter } from "lucide-react";
import ProductCard from "@/components/product-card";
import { Product } from "@shared/schema";

interface Category {
  id: string;
  name: string;
}

export default function ProductListing() {
  const { category } = useParams();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    }
  });

  // Fetch products
  const { data: products, isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products", category],
    queryFn: async () => {
      const url = category 
        ? `/api/products?category=${encodeURIComponent(category)}`
        : "/api/products";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    }
  });

  // Filter and sort products
  useEffect(() => {
    if (!products) return;

    let filtered = [...products];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "price-low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered.sort((a, b) => b.price - a.price);
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, sortBy]);

  // Get current category name
  const currentCategory = category 
    ? categories?.find(c => c.id === category)?.name
    : "All Products";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{currentCategory || (loadingCategories ? "Loading..." : "All Products")}</h1>
          <p className="text-gray-600">
            {filteredProducts?.length || 0} items available
          </p>
        </div>

        <div className="flex items-center mt-4 md:mt-0">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search products..."
              className="pl-10 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="ml-2 w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Categories</h2>
              <Filter className="h-5 w-5 text-gray-500" />
            </div>
            <Separator className="mb-4" />
            <div className="space-y-2">
              <Button
                variant={!category ? "default" : "ghost"}
                className={!category ? "w-full justify-start bg-primary text-white hover:bg-primary-dark" : "w-full justify-start"}
                onClick={() => navigate("/products")}
              >
                All Products
              </Button>
              {loadingCategories ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                categories?.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={category === cat.id ? "default" : "ghost"}
                    className={category === cat.id ? "w-full justify-start bg-primary text-white hover:bg-primary-dark" : "w-full justify-start"}
                    onClick={() => navigate(`/products/category/${cat.id}`)}
                  >
                    {cat.name}
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Product grid */}
        <div className="md:col-span-3">
          {loadingProducts ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : filteredProducts?.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? `No results for "${searchTerm}"`
                  : "There are no products in this category yet."}
              </p>
              {searchTerm && (
                <Button onClick={() => setSearchTerm("")}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
