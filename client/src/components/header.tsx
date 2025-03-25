import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { Search, Menu, MessageSquare, User, LogOut, ShoppingBag, Plus } from "lucide-react";

export default function Header() {
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Track scrolling for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.fullName) return "U";
    const names = user.fullName.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchValue)}`);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/");
  };

  return (
    <header className={`bg-white ${isScrolled ? "shadow-md" : "shadow"} sticky top-0 z-10`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <Link href="/" className="text-2xl font-bold text-primary">UpcycleHub</Link>
          </div>
          
          {/* Search - Desktop */}
          <div className="hidden md:flex items-center space-x-2">
            <form onSubmit={handleSearch} className="relative">
              <Input 
                type="text" 
                placeholder="Search products..." 
                className="pl-10 pr-4 py-2 rounded-full bg-gray-100 focus-visible:ring-primary w-64"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </form>
          </div>
          
          {/* Navigation - Desktop */}
          {!user ? (
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                variant="ghost"
                className="px-4 py-2 text-primary hover:text-primary-dark transition-colors"
                onClick={() => navigate("/auth")}
              >
                Login
              </Button>
              <Button 
                variant="default"
                className="px-4 py-2 bg-primary text-white hover:bg-primary-dark"
                onClick={() => navigate("/auth?type=seller")}
              >
                Sign Up
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-4">
              {(user.userType === "seller" || user.userType === "both") && (
                <Button 
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={() => navigate("/seller/create")}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Listing</span>
                </Button>
              )}
              
              <Link href="/chats" className="text-gray-700 hover:text-primary transition-colors">
                <MessageSquare className="h-6 w-6" />
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 h-auto">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                      <span>{getUserInitials()}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  
                  {(user.userType === "seller" || user.userType === "both") && (
                    <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/seller/dashboard")}>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      <span>Seller Dashboard</span>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/chats")}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Messages</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          
          {/* Mobile Menu Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[250px] sm:w-[300px]">
              <div className="py-4 space-y-4">
                <form onSubmit={handleSearch} className="relative">
                  <Input 
                    type="text" 
                    placeholder="Search products..." 
                    className="pl-10 pr-4 py-2"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </form>
                
                <div className="space-y-1">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    onClick={() => navigate("/")}
                  >
                    Home
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start" 
                    onClick={() => navigate("/products")}
                  >
                    Browse Products
                  </Button>
                  {!user ? (
                    <>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        onClick={() => navigate("/auth")}
                      >
                        Login
                      </Button>
                      <Button 
                        className="w-full justify-start bg-primary hover:bg-primary-dark text-white"
                        onClick={() => navigate("/auth?type=seller")}
                      >
                        Sign Up
                      </Button>
                    </>
                  ) : (
                    <>
                      {(user.userType === "seller" || user.userType === "both") && (
                        <>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start"
                            onClick={() => navigate("/seller/dashboard")}
                          >
                            Seller Dashboard
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start"
                            onClick={() => navigate("/seller/create")}
                          >
                            Create Listing
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        onClick={() => navigate("/chats")}
                      >
                        Messages
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        onClick={() => navigate("/profile")}
                      >
                        Profile
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-600"
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Navigation Links - Desktop */}
        <nav className="mt-4 hidden md:block">
          <ul className="flex space-x-6">
            <li>
              <Link 
                href="/" 
                className="font-medium text-primary border-b-2 border-primary pb-2"
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                href="/products" 
                className="font-medium text-gray-700 hover:text-primary transition-colors"
              >
                Shop
              </Link>
            </li>
            <li>
              <Link 
                href="/products" 
                className="font-medium text-gray-700 hover:text-primary transition-colors"
              >
                Categories
              </Link>
            </li>
            <li>
              <Link 
                href="#about" 
                className="font-medium text-gray-700 hover:text-primary transition-colors"
              >
                About
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
