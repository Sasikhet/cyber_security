"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";  
export default function ResetPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  //Request OTP
  const handleRequestOtp = async () => {
    try {
      const res = await fetch("/api/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      //const data = await res.json();
      if (res.ok) {
        setMessage("OTP sent! Check your email.");
        setStep(2);
      } else {
       setMessage("Failed to send OTP");
      }
    } catch (err) {
      setMessage("Server error while sending OTP.");
    }
  };

  //Verify OTP
  const handleVerifyOtp = async () => {
    try {
      const res = await fetch("/api/verify-otp2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("OTP verified! Enter your new password.");
        setStep(3);
      } else {
        setMessage(data.message || "Invalid or expired OTP.");
      }
    } catch {
      setMessage("Error verifying OTP.");
    }
  };

  //Change Password
  const handleChangePassword = async () => {
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Password changed successfully!");
        setStep(1);
        setEmail("");
        setOtp("");
        setNewPassword("");
        router.push("/");
      } else {
        setMessage(data.message || "Failed to change password.");
      }
    } catch {
      setMessage(`Error changing password.`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-400 to-purple-500">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Reset Password
        </h1>
        
        {message && (
          <p className="mb-4 text-center text-sm text-gray-700 bg-gray-100 p-2 rounded">
            {message}
          </p>
        )}

        {step === 1 && (
          <div className="flex flex-col">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 mb-4 border rounded-xl text-black"
              required
            />
            <button
              onClick={handleRequestOtp}
              className="w-full bg-indigo-500 text-white py-3 rounded-xl font-semibold hover:bg-indigo-600 transition"
            >
              Send OTP
            </button>
            <a href="/" className="hover:underline text-purple-500 mt-3">
              Back
            </a>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 mb-4 border rounded-xl text-black"
              required
            />
            <button
              onClick={handleVerifyOtp}
              className="w-full bg-indigo-500 text-white py-3 rounded-xl font-semibold hover:bg-indigo-600 transition"
            >
              Verify OTP
            </button>
            <a href="/" className="hover:underline text-purple-500 mt-3">
              Back
            </a>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col">
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 mb-4 border rounded-xl text-black"
              required
            />
            <button
              onClick={handleChangePassword}
              className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition"
            >
              Change Password
            </button>
            <a href="/" className="hover:underline text-purple-500 mt-3">
              Back
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
