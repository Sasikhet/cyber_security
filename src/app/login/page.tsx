"use client";
import { useState } from "react";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { motion } from "framer-motion";
import { toast,Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    console.log(form);
    try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    console.log(data);
    if (res.status === 200) {
      toast.success('Login successfully!')
    }else if (res.status === 403) 
      toast.error('Login fail! please try again')
  } catch (error) {
    console.log(error);
    toast.error('Something went wrong!')
  }};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600">
      <div><Toaster/></div>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Welcome Back
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Login to access your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <FaEnvelope className="absolute top-3 left-3 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 pl-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition text-black"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="relative">
            <FaLock className="absolute top-3 left-3 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 pl-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition text-black"
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-500 text-white py-3 rounded-xl font-semibold hover:bg-indigo-600 transition"
          >
            Login
          </button>
        </form>

        <div className="flex justify-between mt-4 text-sm text-gray-500">
          <a href="/reset-request" className="hover:underline">
            Forgot password?
          </a>
          <a href="/register" className="hover:underline">
            Register
          </a>
        </div>

        <div className="mt-6 text-center text-gray-400 text-sm">
          &copy; 2025 CyberSecure App
        </div>
      </motion.div>
    </div>
  );
}
