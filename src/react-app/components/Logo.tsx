import { Zap } from "lucide-react";
import { useBranding } from "@/react-app/contexts/BrandingContext";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = "md", showText = true, className = "" }: LogoProps) {
  const { appName, logoUrl, logoDisplayMode } = useBranding();
  const fullLogo = logoDisplayMode === "full_logo" && logoUrl;

  const iconBox = {
    sm: { box: "w-8 h-8", icon: "w-4 h-4", text: "text-lg" },
    md: { box: "w-10 h-10", icon: "w-5 h-5", text: "text-xl" },
    lg: { box: "w-12 h-12", icon: "w-6 h-6", text: "text-2xl" },
  };

  const fullImg = {
    sm: "h-8 w-auto max-w-[160px]",
    md: "h-10 w-auto max-w-[220px]",
    lg: "h-12 w-auto max-w-[280px]",
  };

  const c = iconBox[size];

  if (fullLogo) {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          key={logoUrl}
          src={logoUrl}
          alt={appName}
          className={`${fullImg[size]} object-contain object-left`}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {logoUrl ? (
        <img
          key={logoUrl}
          src={logoUrl}
          alt={appName}
          className={`${c.box} object-contain`}
        />
      ) : (
        <div
          className={`${c.box} bg-gradient-to-br from-[#E50914] to-[#FFD400] rounded-xl flex items-center justify-center shadow-lg shadow-[#E50914]/20`}
        >
          <Zap className={`${c.icon} text-black`} strokeWidth={2.5} />
        </div>
      )}
      {showText && (
        <span
          className={`${c.text} font-bold bg-gradient-to-r from-[#E50914] to-[#FFD400] bg-clip-text text-transparent`}
        >
          {appName}
        </span>
      )}
    </div>
  );
}
