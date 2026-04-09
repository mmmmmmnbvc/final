import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/AuthCard";
import heroBg from "@/assets/hero-bg.jpg";
import { supabase } from "@/supabaseClient";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  // ✅ ตรวจว่าเข้ามาจาก email reset จริง
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValid(true);
        setLoading(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // ✅ update password
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    // 🔥 sync กับ profiles (ของคุณ)
    if (user) {
      await supabase
        .from("profiles")
        .update({ password })
        .eq("id", user.id);
    }

    alert("Password updated successfully!");
    navigate("/login");
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
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <AuthCard title="Reset Password">
        {loading ? (
          <p className="text-center">Checking reset link...</p>
        ) : !isValid ? (
          <p className="text-center text-red-500">
            Invalid or expired reset link
          </p>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <Label>New Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full">
              Confirm Password
            </Button>
          </form>
        )}
      </AuthCard>
    </div>
  );
};

export default ResetPassword;