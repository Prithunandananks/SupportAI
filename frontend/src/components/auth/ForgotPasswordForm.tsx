import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

function ForgotPasswordForm() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock functionality
    toast.success("Password reset link sent to your email.");
    
    setTimeout(() => {
      navigate("/login");
    }, 2000);
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
      relative
      "
    >
      <Link to="/login" className="absolute top-6 left-6 text-slate-400 hover:text-white transition">
        <ArrowLeft size={20} />
      </Link>

      <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-2 mt-4 sm:mt-2">
        Forgot Password
      </h2>

      <p className="text-center text-slate-400 text-sm sm:text-base mb-8">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <div className="mb-6">
        <label className="block text-slate-300 mb-1.5 text-sm">
          Email
        </label>

        <input
          type="email"
          required
          placeholder="Enter your email"
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3.5 text-sm sm:text-base text-white outline-none focus:border-cyan-400"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-cyan-500 hover:bg-cyan-600 py-3.5 rounded-lg font-semibold transition text-white"
      >
        Send Reset Link
      </button>
    </form>
  );
}

export default ForgotPasswordForm;
