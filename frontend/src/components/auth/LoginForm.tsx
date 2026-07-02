import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function LoginForm() {
  

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Temporary until backend authentication
    navigate("/chat");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 p-8 rounded-2xl shadow-xl w-full max-w-md"
    >
      <h2 className="text-3xl font-bold text-center text-white mb-8">
        Welcome Back 
      </h2>

      <div className="mb-5">
        <label className="block text-slate-300 mb-2">
          Email
        </label>

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-400"
        />
      </div>

      <div className="mb-5">
        <label className="block text-slate-300 mb-2">
          Password
        </label>

        <div className="relative">

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 pr-12 text-white outline-none focus:border-cyan-400"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition"
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>

        </div>
      </div>

    

      <button
        type="submit"
        className="w-full bg-cyan-500 hover:bg-cyan-600 py-3 rounded-lg font-semibold transition"
      >
        Login
      </button>

      <p className="text-center text-slate-400 mt-6">
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