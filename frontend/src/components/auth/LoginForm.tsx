import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuthCore";

function LoginForm() {
  const navigate = useNavigate();
  const { loginCustomer } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginCustomer();
    toast.success("Welcome back!");
    navigate("/chat");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="
      w-full
      max-w-md
      bg-slate-900
      rounded-2xl
      shadow-xl
      border
      border-slate-800
      p-6
      sm:p-8
      "
    >
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-2">
        Welcome Back 
      </h2>

      <p className="text-center text-slate-400 text-sm sm:text-base mb-8">
        Sign in to continue to SupportAI
      </p>

      <div className="mb-5">
        <label className="block text-slate-300 mb-1.5 text-sm">
          Email
        </label>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3.5 text-sm sm:text-base text-white outline-none focus:border-cyan-400"
        />
      </div>

      <div className="mb-5">
        <label className="block text-slate-300 mb-1.5 text-sm">
          Password
        </label>

        <div className="relative">

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3.5 pr-12 text-sm sm:text-base text-white outline-none focus:border-cyan-400"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition"
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>

        </div>
      </div>

      <div className="flex justify-end mb-6 mt-2">
        <Link to="/forgot-password" className="text-sm text-cyan-400 hover:underline">
          Forgot Password?
        </Link>
      </div>

      <button
        type="submit"
        className="w-full bg-cyan-500 hover:bg-cyan-600 py-3.5 rounded-lg font-semibold transition"
      >
        Login
      </button>

      <p className="text-center text-slate-400 mt-8">
        Don't have an account?{" "}
        <Link
            to="/register"
            className="text-cyan-400 hover:underline"
        >
            Register here
        </Link>
      </p>
    </form>
  );
}

export default LoginForm;
