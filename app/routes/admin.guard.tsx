import { useEffect } from "react";
import { useNavigate } from "react-router";

const ADMIN_TOKEN_KEY = "admin_token";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token !== "ok") {
      navigate("/admin/auth", { replace: true });
    }
  }, [navigate]);

  return <>{children}</>;
}
