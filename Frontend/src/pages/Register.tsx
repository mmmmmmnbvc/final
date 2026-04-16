import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/AuthCard";
import { User, Mail, Lock, Chrome, Check } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { supabase } from "@/supabaseClient";

import { useEffect } from "react";
// const REDIRECT_URL = 'http://localhost:8080/verify'; 
const REDIRECT_URL = 'https://gnss-network-management-system-sigma.vercel.app/verify';
const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: "Passwords do not match!" });
      return;
    }
    
    setLoading(true);

const { error } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: { 
      username: formData.username,
      password: formData.password, // ✅ จะถูก insert ลง profiles
      status: "USER"
    },
    emailRedirectTo: REDIRECT_URL
  },
});

    setLoading(false);

    if (error) {
      console.error("Supabase SignUp Error:", error);
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ 
        type: 'success', 
        text: "Success! Check your email to confirm your account and complete registration." 
      });
      // ล้างข้อมูลฟอร์ม
      setFormData({ username: "", email: "", password: "", confirmPassword: "" });
    }
  };


const handleGoogleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://gnss-network-management-system-sigma.vercel.app/#/google"
    },
  });

  if (error) {
    console.error("OAuth Error:", error);
    return;
  }

  if (data?.url) {
    console.log("Redirecting to:", data.url);
    window.location.href = data.url; // ⭐ ตัวนี้แหละที่ขาด
  } else {
    console.log("No URL returned");
  }
};
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== "";

    useEffect(() => {
      // เปิด Light Mode ตอนเข้า page
      document.documentElement.classList.add("station-light");

      // ลบออกตอนออกจาก page (สำคัญมาก)
      return () => {
        document.documentElement.classList.remove("station-light");
      };
    }, []);
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0  backdrop-blur-sm" />
      
      <div className="relative z-10">
        <AuthCard title="Create Account">
          
          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                <span className="text-primary font-semibold">1</span>
              </div>
              <span className="text-primary">Register</span>
            </div>
            <div className="w-12 h-px bg-border"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                <span className="text-muted-foreground font-semibold">2</span>
              </div>
              <span>Verify Email</span>
            </div>
          </div>
          
         
          {message && (
            <div className={`p-3 rounded-lg text-center text-sm mb-4 ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
           
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="John Doe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="pl-10 bg-input/50 border-border focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 bg-input/50 border-border focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 bg-input/50 border-border focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`pl-10 bg-input/50 border-border focus:border-primary transition-colors ${
                    passwordsMatch ? 'border-green-500' : ''
                  }`}
                  required
                />
                {passwordsMatch && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-glow-soft hover:shadow-glow transition-all"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Create Account'}
            </Button>
            
          
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">Or sign up with</span>
              </div>
            </div>

   <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full border-border hover:bg-secondary/50 hover:border-primary transition-colors"
            >
              <Chrome className="mr-2 h-5 w-5" />
              Sign in with Google
            </Button>

            <div className="text-center mt-6 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:text-accent font-medium transition-colors">
                  Login
                </Link>
              </p>
            </div>
          </form>
        </AuthCard>
      </div>
    </div>
  );
};

export default Register;