import { useEffect } from "react";
import { adminLoginUrl } from "../lib/adminUrl";

export function LoginPage() {
  useEffect(() => {
    window.location.replace(adminLoginUrl());
  }, []);

  return null;
}
