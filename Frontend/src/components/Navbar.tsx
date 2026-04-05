import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Map, LayoutDashboard, Database, Info, User } from "lucide-react";
import hiiLogo from "@/assets/hii-logo.png";

export const Navbar = () => {
  return (
    <nav className="bg-card/80 backdrop-blur-xl border-b border-primary/20 sticky top-0 z-50 shadow-elevated">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <img 
                src={hiiLogo} 
                alt="HII" 
                className="h-10 w-auto transition-transform group-hover:scale-105"
              />
              <span className="text-lg font-semibold text-foreground hidden md:block">
                HII Data Portal
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link to="/dashboard">
                <Button variant="ghost" className="gap-2 hover:bg-secondary/50">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost" className="gap-2 hover:bg-secondary/50">
                  <Database className="h-4 w-4" />
                  Stations
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost" className="gap-2 hover:bg-secondary/50 text-primary">
                  <Map className="h-4 w-4" />
                  Map
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost" className="gap-2 hover:bg-secondary/50">
                  <Info className="h-4 w-4" />
                  About
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full hover:bg-secondary/50 hover:shadow-glow-soft transition-all"
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
