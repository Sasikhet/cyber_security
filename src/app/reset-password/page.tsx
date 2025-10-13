"use client";
import { useState } from "react";
import { FaLock } from "react-icons/fa";
import { motion } from "framer-motion";

export default function ResetPasswordPage({ searchParams }: any) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [match, setMatch] = useState(true);

  const token = searchParams?.token; // You send token in the URL

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMatch(false);
      return;
    }

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    alert(await res.text());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Set New Password
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <FaLock className="absolute top-3 left-3 text-gray-400" />
            <input
              type="password"
              placeholder="New Password"
              className="w-full p-3 pl-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <FaLock className="absolute top-3 left-3 text-gray-400" />
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full p-3 pl-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {!match && (
            <p className="text-red-500 text-sm">Passwords do not match</p>
          )}
          <button
            type="submit"
            className="w-full bg-purple-500 text-white py-3 rounded-xl font-semibold hover:bg-purple-600 transition"
          >
            Reset Password
          </button>
        </form>

        <div className="mt-4 text-center text-gray-500 text-sm">
          <a href="/login" className="hover:underline text-purple-500">
            Back to Login
          </a>
        </div>
      </motion.div>
    </div>
  );
}
