import { ReactNode } from "react";
import hiiLogo from "@/assets/hii-logo.png";

interface AuthCardProps {
  title: string;
  children: ReactNode;
  showLogo?: boolean;
}

export const AuthCard = ({ title, children, showLogo = true }: AuthCardProps) => {
  return (
    <div className="w-full max-w-md animate-fade-in">
      {showLogo && (
        /*<div className="flex justify-center mb-8">
          <img 
            src={hiiLogo} 
            alt="Hydro-Informatics Institute" 
            className="h-24 w-auto animate-float"
          />
        </div>
        */
       <div></div>
      )}
      
      <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-elevated border border-primary/20 p-8">
        <h1 className="text-3xl font-semibold text-center mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
};
