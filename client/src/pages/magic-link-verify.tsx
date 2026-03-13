import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { setAccessToken } from "../lib/auth";
import { Nav } from "../components/layout/nav";

export default function MagicLinkVerify() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");

    if (token) {
      // Token was passed via redirect from server — store it and go to dashboard
      setAccessToken(token);
      setLocation("/dashboard");
    } else {
      setError("Invalid or missing verification token.");
    }
  }, [search, setLocation]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Verification failed
            </h2>
            <p className="mt-2 text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}
