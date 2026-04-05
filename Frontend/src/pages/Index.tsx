import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Map, Database, Shield, Zap } from "lucide-react";
import hiiLogo from "@/assets/hii-logo.png";
import heroBg from "@/assets/hero-bg.jpg";

const Index = () => {
  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-background/50 backdrop-blur-sm" />
      
      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              
              <div>
                <h1 className="text-xl font-bold text-foreground"></h1>
                <p className="text-sm text-muted-foreground"></p>
              </div>
            </div>
    
          </div>
        </header>

        <main className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent">
                Hydro-Informatics Institute
              </h2>
              <p className="text-xl text-foreground/90 max-w-2xl mx-auto">
                
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-8">
              <Link to="/login">
                <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-glow hover:shadow-glow-soft transition-all text-lg px-8">
                  Login 
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="outline" className="border-primary/50 hover:bg-secondary/50 text-lg px-8">
                  Register
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-16">
              {[
                { icon: Map, title: "Real-time Maps", desc: "Interactive GNSS visualization" },
                { icon: Database, title: "Data Analytics", desc: "Comprehensive water data" },
                { icon: Shield, title: "Secure Access", desc: "Protected member portal" },
                { icon: Zap, title: "Fast Updates", desc: "Live monitoring system" },
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="bg-card/80 backdrop-blur-xl rounded-xl p-6 border border-primary/20 shadow-elevated hover:shadow-glow-soft transition-all hover:scale-105"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4 mx-auto">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
