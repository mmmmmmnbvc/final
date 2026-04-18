
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/AuthCard";
import { Mail, Lock, Chrome } from "lucide-react";
import { supabase } from "@/supabaseClient";
import heroBg from "@/assets/hero-bg.jpg";
import { useEffect, useState } from "react";
const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,email, username, password, status")
        .or(`username.eq.${email},email.eq.${email}`)
        .eq("password", password)
        .single();

      if (error || !data) {
        alert("Email/Username หรือ Password ไม่ถูกต้อง");
        return;
      }

      // บันทึก role ลง localStorage
      // localStorage.setItem("userStatus", data.status);
      sessionStorage.clear();
      sessionStorage.setItem("userStatus", data.status);

      // ตรวจสถานะ (role)
      if (data.status === "ADMIN") {
        navigate("/Admin");
      } else if (data.status === "STAFF" ) {
        navigate("/Home");
      } else if(data.status === "USER"){
        navigate("/map");
      } 
      else {
        alert("ไม่พบสิทธิ์ของผู้ใช้งาน");
      }
    } catch (err: any) {
      console.error(err);
      alert("เกิดข้อผิดพลาด: " + err.message);
    }
  };

 const handleGoogleLogin = async () => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // redirectTo: "http://localhost:8080/google",
        redirectTo: "https://gnss-network-management-system-sigma.vercel.app/google",
      },
    });
    if (error) throw error;
  } catch (err: any) {
    alert(err.error_description || err.message);
  }
};

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
        <AuthCard title="Member Login">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email Address or Username</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id=""
                  type=""
                  placeholder="Email Address or Username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-input/50 border-border focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link to="/forgot-password" className="text-sm text-primary hover:text-accent transition-colors">
                Forgot Password?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-glow-soft hover:shadow-glow transition-all"
            >
              Login
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">Or continue with</span>
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
                Don't have an account?{" "}
                <Link to="/register" className="text-primary hover:text-accent font-medium transition-colors">
                  Register
                </Link>
              </p>
            </div>
          </form>
        </AuthCard>
      </div>
    </div>
  );
};

export default Login;
