
import { Loader2 } from "lucide-react";

export function LoadingSpinner({ size = "medium", className = "" }: { size?: "small" | "medium" | "large", className?: string }) {
  const sizeClass = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClass[size]} ${className}`} 
    />
  );
}

export function LoadingIndicator({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <LoadingSpinner size="large" className="text-eduBlue-500 mb-2" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
