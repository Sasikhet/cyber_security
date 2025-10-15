"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { toast, Toaster } from "react-hot-toast";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; username: string; role: string; password_last_changed?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    try {
       if (token) {
      type MyJwtPayload = {
        email: string;
        username?: string;
        id?: string;
        role?: string;
        password_last_changed?: string;
        [key: string]: any;
      };
      const decoded = jwtDecode<MyJwtPayload>(token);
      console.log(decoded);
   
      setUser({
        email: decoded.email,
        username: decoded.username || decoded.id || "",
        role: decoded.role || "user",
        password_last_changed: decoded.password_last_changed, // must include in JWT
      });
      }
    } catch (err) {
      console.error("Invalid token:", err);
      localStorage.removeItem("token");
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ✅ Force password reset if older than 90 days
  useEffect(() => {
    console.log("Checking password age...", user);
    if (user?.password_last_changed) {
      const lastChanged = new Date(user.password_last_changed);
      const now = new Date();
      const diffDays = (now.getTime() - lastChanged.getTime()) / (1000*60*60*24);
      console.log("Days since password change:", diffDays);
      if (diffDays > 90) {
        toast.error("Your password has expired. Please change it.");
        router.push("/reset-password");
      }
    }
  }, [user, router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-600 text-lg">
        Loading...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Toaster />
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {user.role === "admin" ? (
            <>
              👑 Welcome, <span className="text-indigo-600 font-semibold">Admin</span>!
            </>
          ) : (
            <>
              👋 Welcome, <span className="text-indigo-600 font-semibold">{user.username}</span>!
            </>
          )}
        </h1>

        <p className="text-gray-500 mb-8">
          {user.role === "admin"
            ? "You have full administrative access."
            : "You are logged in as a regular user."}
        </p>

        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition"
        >
          Log Out
        </button>

        <p className="text-sm text-gray-400 mt-4">
          Logged in as: <span className="font-medium">{user.email}</span>
        </p>
      </div>
    </div>
  );
}
