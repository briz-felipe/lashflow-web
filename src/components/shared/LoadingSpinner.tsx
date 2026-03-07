import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-brand-200 border-t-brand-500",
        size === "sm" && "h-4 w-4",
        size === "md" && "h-8 w-8",
        size === "lg" && "h-12 w-12",
        className
      )}
    />
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  );
}
