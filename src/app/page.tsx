"use client";
import { useState } from "react";
import { FaEnvelope, FaLock, FaKey } from "react-icons/fa";
import { motion } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {
  const [form, setForm] = useState({ identifier: "", password: "", otp: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: any) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: form.identifier, password: form.password }),
    });

    const text = await res.text(); // read raw response first
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (res.ok) {
      toast.success("OTP sent to your email!");
      setOtpSent(true);
    } else {
      toast.error(data.message || "Login failed!");
    }
    setLoading(false);
  } catch (err) {
    console.error("Error:", err);
    toast.error("Something went wrong!");
    setLoading(false);
  }
  setLoading(false);
};

  const handleVerifyOTP = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: form.identifier, otp: form.otp }),
      });

      const data = await res.json();
      if (res.status === 200) {
        localStorage.setItem("token", data.token);
        toast.success("Login successful!");
        setTimeout(() => (window.location.href = "/home"), 1000);
      } else {
        toast.error(data.message || "OTP invalid!");
      }
      setLoading(false);
    } catch {
      toast.error("Error verifying OTP!");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600">
      <Toaster />
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          {otpSent ? "Enter OTP" : "Welcome Back"}
        </h1>

        <form onSubmit={otpSent ? handleVerifyOTP : handleLogin} className="space-y-6">
          {!otpSent && (
            <>
              <div className="relative">
                <FaEnvelope className="absolute top-3 left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Username or Email"
                  className="w-full p-3 pl-10 border rounded-xl text-black"
                  onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                  required
                />
              </div>
              <div className="relative">
                <FaLock className="absolute top-3 left-3 text-gray-400" />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full p-3 pl-10 border rounded-xl text-black"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <button disabled={loading} className="w-full bg-indigo-500 text-white py-3 rounded-xl font-semibold hover:bg-indigo-600 transition">
                Send OTP
              </button>

              {/* 🔗 Register and Forgot Password links */}
              <div className="flex justify-between text-sm mt-2">
                <Link href="/register" className="text-indigo-600 hover:underline">
                  register
                </Link>
                <Link href="/reset-password" className="text-indigo-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </>
          )}

          {otpSent && (
            <>
              <div className="relative">
                <FaKey className="absolute top-3 left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter OTP"
                  className="w-full p-3 pl-10 border rounded-xl text-black"
                  onChange={(e) => setForm({ ...form, otp: e.target.value })}
                  required
                />
              </div>
              <button disabled={loading} className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition">
                Verify OTP
              </button>

              {/* Back to login link */}
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-indigo-600 hover:underline text-sm"
                >
                  Back to login
                </button>
              </div>
            </>
          )}
        </form>
      </motion.div>
    </div>
  );
}
