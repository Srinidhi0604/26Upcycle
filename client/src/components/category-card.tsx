import { useLocation } from "wouter";

interface CategoryProps {
  category: {
    id: string;
    name: string;
    imageUrl: string;
  };
}

export default function CategoryCard({ category }: CategoryProps) {
  const [, navigate] = useLocation();

  const handleClick = () => {
    navigate(`/products/category/${category.id}`);
  };

  return (
    <div 
      className="group cursor-pointer"
      onClick={handleClick}
    >
      <div className="aspect-square rounded-xl overflow-hidden relative shadow-md">
        <img 
          src={category.imageUrl} 
          alt={category.name} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
          <h3 className="text-white font-bold p-4">{category.name}</h3>
        </div>
      </div>
    </div>
  );
}
