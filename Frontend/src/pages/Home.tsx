import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Map, Database, Shield, Zap } from "lucide-react";
import hiiLogo from "@/assets/hii-logo.png";
import heroBg from "@/assets/hero-bg.jpg";
import heroBgs from "@/assets/1758772306473-removebg-preview.png";
import { useEffect } from "react";
const Index = () => {
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
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0  backdrop-blur-sm" />
      
      <div className="relative z-10">
  <header className="container mx-auto px-4 py-10"> 
 
  <div className="flex items-center justify-center"> 
    <img 
      src={heroBgs} 
      alt="Hydro-Informatics Institute" 
     
      className="w-auto animate-fade-in" 
      style={{ height: '300px' }} 
    />
    
 
    <div className="flex items-center gap-3">
    </div>

  </div>
</header>
    <main className="container mx-auto px-4 py-20">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="grid md:grid-cols-2  gap-6 pt-16">
          {[
            
            // { icon: Map, title: "Real-time Maps", desc: "Interactive GNSS visualization", path: "/map" },
          
            { icon: Database, title: "Database", desc: "แก้ไขข้อมูลโครงข่าย", path: "/Upload" },
          
            // { icon: Shield, title: "User Management", desc: "Manage users, permissions", path: "/Admin" }, lg:grid-cols-4
          
            { icon: Zap, title: "Upload Data", desc: "อัปโหลดข้อมูลโครงข่าย", path: "/Updates" },
          ].map((feature, i) => (
        
            <Link 
              key={i}
              to={feature.path} 
              className="bg-card/80 backdrop-blur-xl rounded-xl p-6 border border-primary/20 shadow-elevated hover:shadow-glow-soft transition-all hover:scale-105 block cursor-pointer" // 💡 เพิ่ม block และ cursor-pointer
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 mx-auto">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </Link> 
  ))}
</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
