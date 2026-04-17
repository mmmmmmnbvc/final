import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

import NotFound from "./pages/NotFound";
import Map from "./pages/Map";
import Home from "./pages/Home";
import Station from "./pages/Station";
import Verify from "./pages/Verify";
import Google from "./pages/Google";
import Admin from "./pages/Admin";
import Upload from "./pages/Upload";
import Updates from "./pages/Updates";
import ResetPassword from "./pages/ResetPassword";
const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme-mode');
    const isDark = savedTheme === 'dark' || 
      (savedTheme === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* <Route path="/" element={<Index />} /> */}
            <Route path="/map" element={<Map />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/google" element={<Google />} />
            <Route path="/Admin" element={<Admin />} />
            <Route path="/station/:stationCode" element={<Station />} />
            <Route path="/Home" element={< Home />} />
            <Route path="/" element={<Login />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/Upload" element={<Upload />} />
            <Route path="/Updates" element={<Updates />} />
            <Route path="/ResetPassword" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
