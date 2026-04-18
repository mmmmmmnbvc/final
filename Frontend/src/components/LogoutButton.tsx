import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  variant?: "default" | "secondary" | "outline" | "ghost";
  className?: string;
  showText?: boolean;
}

export const LogoutButton = ({ 
  variant = "default", 
  className = "",
  showText = true 
}: LogoutButtonProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("userStatus");
    
    // Redirect to login page
    navigate("/login");
  };

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      className={`gap-2 ${className}`}
      title="Logout"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
};
