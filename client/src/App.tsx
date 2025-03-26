import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import HomePage from "./pages/home-page";
import NotFound from "./pages/not-found";
import AuthPage from "./pages/auth-page";
import ProductListing from "./pages/product-listing";
import ProductDetail from "./pages/product-detail";
import SellerDashboard from "./pages/seller-dashboard";
import CreateListing from "./pages/create-listing";
import Chat from "./pages/chat";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import Header from "./components/header";
import Footer from "./components/footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/products" component={ProductListing} />
      <Route path="/products/category/:category" component={ProductListing} />
      <Route path="/products/:id" component={ProductDetail} />
      <ProtectedRoute path="/seller/dashboard" component={SellerDashboard} />
      <ProtectedRoute path="/seller/create" component={CreateListing} />
      <ProtectedRoute path="/chats" component={Chat} />
      <ProtectedRoute path="/chats/:id" component={Chat} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
