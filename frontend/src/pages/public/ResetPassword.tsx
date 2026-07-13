import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "../../services/auth.service";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token.");
      navigate("/login");
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    const policyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
    if (!policyRegex.test(password)) {
      toast.error("Password must be at least 12 characters, and include uppercase, lowercase, number, and special character.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword(token, password);
      toast.success(res.message || "Password successfully reset.");
      navigate("/login");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-6 sm:p-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-2">
          Reset Password
        </h2>
        <p className="text-center text-slate-400 text-sm sm:text-base mb-8">
          Enter your new password below.
        </p>

        <div className="mb-4">
          <label className="block text-slate-300 mb-1.5 text-sm">New Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3.5 text-sm sm:text-base text-white outline-none focus:border-cyan-400"
            disabled={loading}
          />
        </div>

        <div className="mb-6">
          <label className="block text-slate-300 mb-1.5 text-sm">Confirm Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3.5 text-sm sm:text-base text-white outline-none focus:border-cyan-400"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-500 hover:bg-cyan-600 py-3.5 rounded-lg font-semibold transition text-white disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default ResetPassword;
