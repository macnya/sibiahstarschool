"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { createUserWithEmailPassword } from "@/lib/firebase"; // Assuming this function exists in firebase.ts

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement Firebase email/password registration logic here
    try {
      await createUserWithEmailPassword(email, password);
      // After successful registration, redirect to login or a success page
      router.push('/student-portal'); // or '/parent-portal', depending on the user type
    } catch (error) {
      console.error("Error registering:", error);
      // TODO: Display an error message to the user
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold">Create an Account</h2>
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Register
          </Button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/student-portal" className="text-blue-500 hover:underline" prefetch={false}>
              Login here (Student)
            </Link>{" "}
            or{" "}
            <Link href="/parent-portal" className="text-blue-500 hover:underline" prefetch={false}>
              Login here (Parent)
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}