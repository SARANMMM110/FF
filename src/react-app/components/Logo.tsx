import { Zap } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const sizeClasses = {
    sm: {
      container: "w-8 h-8",
      icon: "w-4 h-4",
      text: "text-lg",
    },
    md: {
      container: "w-10 h-10", 
      icon: "w-5 h-5",
      text: "text-xl",
    },
    lg: {
      container: "w-12 h-12",
      icon: "w-6 h-6", 
      text: "text-2xl",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${classes.container} bg-gradient-to-br from-[#E50914] to-[#FFD400] rounded-xl flex items-center justify-center shadow-lg shadow-[#E50914]/20`}>
        <Zap className={`${classes.icon} text-black`} strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={`${classes.text} font-bold bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent`}>
          FocusFlow
        </span>
      )}
    </div>
  );
}
