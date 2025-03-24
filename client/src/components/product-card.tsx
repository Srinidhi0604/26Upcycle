import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    
    toast({
      title: !isFavorite ? "Added to favorites" : "Removed from favorites",
      description: !isFavorite 
        ? `${product.title} has been added to your favorites.` 
        : `${product.title} has been removed from your favorites.`,
      duration: 2000,
    });
  };

  return (
    <Card 
      className="bg-white rounded-xl shadow-md overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/products/${product.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <div className="aspect-[4/3] overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.title} 
              className={`w-full h-full object-cover transition-transform duration-300 ${isHovered ? 'scale-105' : ''}`}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <Button 
            variant="outline" 
            size="icon" 
            className={`bg-white rounded-full p-1.5 shadow hover:text-primary transition-colors ${isFavorite ? 'text-red-500 hover:text-red-600' : ''}`}
            onClick={handleFavoriteClick}
          >
            <Heart className="h-5 w-5" fill={isFavorite ? "currentColor" : "none"} />
          </Button>
        </div>
      </div>
      <div className="p-4">
        <span className="text-sm text-primary font-medium">{product.category}</span>
        <h3 className="font-bold text-lg mt-1 text-gray-900 line-clamp-1">{product.title}</h3>
        <p className="text-gray-600 mt-2 text-sm line-clamp-2">{product.description}</p>
        <div className="flex justify-between items-center mt-4">
          <span className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</span>
          <Link href={`/products/${product.id}`}>
            <Button 
              variant="default" 
              className="px-3 py-1.5 text-sm bg-primary hover:bg-primary-dark"
            >
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
