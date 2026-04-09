  import { useEffect, useState } from "react";
  import { useNavigate } from "react-router-dom";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { AuthCard } from "@/components/AuthCard";
  import { User, Mail, Lock, Check } from "lucide-react";
  import heroBg from "@/assets/hero-bg.jpg";
  import { supabase } from "@/supabaseClient";

  const Google = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // ดึงข้อมูลผู้ใช้จาก Google OAuth
    useEffect(() => {
      const fetchUser = async () => {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          console.log("No user session from Google");
          return;
        }
        const googleUser = data.user;
        setFormData((prev) => ({
          ...prev,
          email: googleUser.email || "",
          username: googleUser.user_metadata.full_name || "",
        }));
      };
      fetchUser();
    }, []);

    // ฟังก์ชันเมื่อกด Create Account
    const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);

      if (formData.password !== formData.confirmPassword) {
        setMessage({ type: "error", text: "Passwords do not match!" });
        return;
      }

      setLoading(true);

      // ดึง user ปัจจุบันจาก Google OAuth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: "error", text: "No authenticated user found!" });
        setLoading(false);
        return;
      }

      // เช็กว่ามี email นี้อยู่ใน profiles แล้วหรือยัง
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", formData.email)
        .maybeSingle();

      if (existingUser) {
        setMessage({ type: "error", text: "This Google account is already registered!" });
        setLoading(false);
        return;
      }

      // เพิ่ม/อัปเดตข้อมูลลง profiles ทันที
      const { error: upsertError } = await supabase.from("profiles").upsert(
        [
          {
            id: user.id,
            username: formData.username,
            email: formData.email,
            password: formData.password,
            status: "USER",
          },
        ],
        { onConflict: ["id"] } // ถ้ามี id อยู่แล้ว ให้ update แทน insert
      );

      setLoading(false);

      if (upsertError) {
        console.error("Profile upsert error:", upsertError);
        setMessage({ type: "error", text: upsertError.message });
        return;
      }

      setMessage({ type: "success", text: "Registration complete! Redirecting to Home..." });

      setTimeout(() => navigate("/Home"), 1500);
    };

    const passwordsMatch =
      formData.password === formData.confirmPassword && formData.confirmPassword !== "";
      
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
        <div className="relative z-10">
          <AuthCard title="Complete Your Registration">
            <div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                  <span className="text-primary font-semibold">1</span>
                </div>
                <span className="text-primary">Set Account Info</span>
              </div>
              <div className="w-12 h-px bg-border"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                  <span className="text-muted-foreground font-semibold">2</span>
                </div>
                <span>Finish</span>
              </div>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-center text-sm mb-4 ${
                  message.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">
                  Username
                </Label>
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
                <Label htmlFor="email" className="text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    readOnly
                    className="pl-10 bg-gray-100 border-border text-muted-foreground cursor-not-allowed"
                    required
                  />
                </div>
              </div>

            
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
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
                <Label htmlFor="confirmPassword" className="text-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`pl-10 bg-input/50 border-border focus:border-primary transition-colors ${
                      passwordsMatch ? "border-green-500" : ""
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
                {loading ? "Registering..." : "Create Account"}
              </Button>
            </form>
          </AuthCard>
        </div>
      </div>
    );
  };

  export default Google;
