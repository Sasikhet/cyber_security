"use client";
import { useState } from "react";
import { FaEnvelope } from "react-icons/fa";
import { motion } from "framer-motion";

export default function ResetRequestPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const res = await fetch("/api/reset-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    alert(await res.text());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Reset Password
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Enter your email to receive a password reset link
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <FaEnvelope className="absolute top-3 left-3 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 pl-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-500 text-white py-3 rounded-xl font-semibold hover:bg-indigo-600 transition"
          >
            Send Reset Link
          </button>
        </form>

        <div className="flex justify-between mt-4 text-sm text-gray-500">
          <a href="/login" className="hover:underline">
            Back to Login
          </a>
        </div>
      </motion.div>
    </div>
  );
}
