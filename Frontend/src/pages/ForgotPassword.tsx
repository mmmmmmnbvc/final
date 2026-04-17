import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/AuthCard";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { supabase } from "@/supabaseClient";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [cooldown, setCooldown] = useState(false);

  // ✅ ตรวจว่าเข้ามาจากลิงก์ reset password จริง ๆ
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsResetMode(true);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // ✅ ส่ง email reset password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cooldown) {
      alert("Please wait 60 seconds before trying again");
      return;
    }

    setCooldown(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // redirectTo: "http://localhost:8080/forgot-password",
      // https://gnss-network-management-system-sigma.vercel.app/google
      redirectTo: "https://gnss-network-management-system-sigma.vercel.app/forgot-password",
    });

    if (error) {
      alert(error.message);
    } else {
      setIsSubmitted(true);
    }

    // ⏱ cooldown 60 วิ
    setTimeout(() => setCooldown(false), 60000);
  };

  // ✅ อัปเดตรหัสผ่านใหม่
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      alert(error.message);
      return;
    }

    // 🔥 sync กับ profiles (เพราะระบบคุณยังใช้ DB password)
    if (user) {
      await supabase
        .from("profiles")
        .update({ password: newPassword })
        .eq("id", user.id);
    }

    alert("Password updated successfully!");
    window.location.href = "/login";
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
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0  backdrop-blur-sm" />

      <div className="relative z-10">
        <AuthCard
          title={
            isResetMode
              ? " New Password"
              : isSubmitted
              ? "Check Your Email"
              : "Reset Password"
          }
        >
          {/* ================= RESET PASSWORD ================= */}
          {isResetMode ? (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground">
                  {/* Enter your new password. */}
                </p>
              </div>

              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                Confirm Password
              </Button>

              <div className="text-center mt-4">
                <Link to="/login" className="text-sm text-primary hover:underline">
                  Back to Login
                </Link>
              </div>
            </form>

          ) : !isSubmitted ? (

            /* ================= REQUEST EMAIL ================= */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground">
                  Enter your email address and we'll send you a link to reset your password.
                  {/* ใส่ Email Address เพื่อส่ง link สำหรับ เปลี่ยนรหัสผ่าน */}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={cooldown}>
                {cooldown ? "Please wait..." : "Confirm"}
              </Button>

              <div className="text-center mt-6 pt-6 border-t">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </form>

          ) : (

            /* ================= SUCCESS ================= */
            <div className="text-center space-y-6 py-4">
              <div className="flex justify-center">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>

              <p>We've sent a reset link to Email </p>
              <p className="text-primary font-medium">{email}</p>

              <p className="text-sm text-muted-foreground">
                Check your email and click the link to reset your password.
              </p>

              <div className="pt-6 border-t space-y-3">
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>

                <Link to="/login" className="block text-sm text-primary hover:underline">
                  Back to Login
                </Link>
              </div>
            </div>

          )}
        </AuthCard>
      </div>
    </div>
  );
};

export default ForgotPassword;