import React, { useEffect } from "react";
import { useNavigate } from "react-router";
import { useSession } from "@/features/account/useSession";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { status } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "unauthenticated") {
      navigate("/?login=true", { replace: true });
    }
  }, [status, navigate]);

  if (status === "loading") {
    return (
      <div className="min-h-screen text-brand-text flex flex-col justify-center items-center bg-transparent">
        <Loader2 className="w-10 h-10 text-brand-accent animate-spin" />
        <p className="mt-4 font-sans text-brand-secondary text-sm">Synchronizing session...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
};
