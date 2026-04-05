
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Mail } from "lucide-react";
import { AuthCard } from "@/components/AuthCard";
import heroBg from "@/assets/hero-bg.jpg";
import { supabase } from "@/supabaseClient";

const Verify = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [username, setUsername] = useState('...');

    useEffect(() => {
        const checkUserAndVerify = async () => {
            setLoading(true);
            
            // ตรวจสอบ Session ที่ Supabase สร้างไว้ให้หลังคลิกลิงก์
            const { data: { user } } = await supabase.auth.getUser();
            

            //  user ยืนยันอีเมลสำเร็จแล้ว
            if (user) {
                const profileUsername = user.user_metadata.username; 
                const profilePassword = user.user_metadata.password;
                setUsername(profileUsername || 'User');

                if (profileUsername && profilePassword) {
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ 
                            username: profileUsername,
                            email: user.email, 
                            password: profilePassword, 
                            status: 'USER' 
                        })
                        .eq('id', user.id); 

                    if (updateError) {
                        console.error("Profile Update Error (Check RLS/Table Schema):", updateError);
                        setStatus('error');
                    } else {
                        setStatus('success');
                        setTimeout(() => {
                            navigate('/Home'); 
                        }, 3000);
                    }
                } else {
                    // ไม่เจอ username หรือ password
                    console.error("Missing username or password");
                    setStatus('error');
                }
            }
            setLoading(false);
        };

        checkUserAndVerify();
    }, [navigate]);


    const renderContent = () => {
        if (loading || status === 'verifying') {
            return (
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <p className="text-lg text-foreground font-medium">Verifying Account...</p>
                    <p className="text-sm text-muted-foreground">Please wait while we complete your profile setup.</p>
                </div>
            );
        }

        if (status === 'success') {
            return (
                <div className="text-center space-y-4">
                    <Check className="h-10 w-10 text-green-500 mx-auto" />
                    <p className="text-lg text-foreground font-medium">Email Confirmed! 🎉</p>
                    <p className="text-sm text-muted-foreground">
                        Welcome back, **{username}**. Redirecting you to the Home shortly...
                    </p>
                    <Button onClick={() => navigate('/Home')} className="w-full mt-4">
                        Go to Home Now
                    </Button>
                </div>
            );
        }

        if (status === 'error') {
            return (
                <div className="text-center space-y-4">
                    <Mail className="h-10 w-10 text-red-500 mx-auto" />
                    <p className="text-lg text-foreground font-medium">Verification Failed</p>
                    <p className="text-sm text-muted-foreground">
                        There was an issue verifying your account. Please log in to complete the process or contact support.
                    </p>
                    <Link to="/login">
                        <Button className="w-full mt-4" variant="outline">Go to Login</Button>
                    </Link>
                </div>
            );
        }
    };


    return (
        <div 
          className="min-h-screen flex items-center justify-center p-4 relative"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
          
          <div className="relative z-10">
            <AuthCard title="Verify Account">
              
              <div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                    <span className="text-muted-foreground font-semibold">1</span>
                  </div>
                  <span className="">Register</span>
                </div>
                <div className="w-12 h-px bg-border"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                    <span className="text-primary font-semibold">2</span>
                  </div>
                  <span className="text-primary">Verify Email</span>
                </div>
              </div>
              
              {renderContent()}
            </AuthCard>
          </div>
        </div>
    );
};

export default Verify;