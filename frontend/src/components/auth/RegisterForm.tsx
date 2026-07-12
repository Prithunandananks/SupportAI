import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthCore";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

function RegisterForm() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.fullName ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const parts = form.fullName.split(" ");
      const firstName = parts[0];
      const lastName = parts.slice(1).join(" ");
      
      // Register
      await authService.register({
        email: form.email,
        password: form.password,
        first_name: firstName,
        last_name: lastName || null,
        role: "Customer"
      });
      
      // Auto login after register
      const formData = new URLSearchParams();
      formData.append("username", form.email);
      formData.append("password", form.password);
      
      const authData = await authService.login(formData);
      const user = await authService.getCurrentUser();
      
      login(authData.access_token, user);
      toast.success("Account created successfully!");
      navigate("/chat");
    } catch (err) {
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as { response?: { status?: number, data?: { detail?: string } } };
        if (axiosErr.response?.status === 400 && axiosErr.response?.data?.detail === "Email already registered") {
          setError("Email already registered. Please login instead.");
          return;
        }
      }
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
        Create Account 
      </h2>

      <p className="text-sm sm:text-base text-slate-400 text-center mb-8">
        Join SupportAI and get started
      </p>

      {error && (
        <p className="text-red-400 text-sm text-center mb-5">
          {error}
        </p>
      )}

      <div className="mb-4">
        <label className="block text-sm text-slate-300 mb-1.5">
          Full Name
        </label>

        <input
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          placeholder="Enter your full name"
          required
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3.5 text-sm sm:text-base text-white outline-none focus:border-cyan-400 transition"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm text-slate-300 mb-1.5">
          Email
        </label>

        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3.5 text-sm sm:text-base text-white outline-none focus:border-cyan-400 transition"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm text-slate-300 mb-1.5">
          Password
        </label>

        <div className="relative">

          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Create a password"
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3.5 pr-12 text-sm sm:text-base text-white outline-none focus:border-cyan-400 transition"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>

        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-slate-300 mb-1.5">
          Confirm Password
        </label>

        <div className="relative">

          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3.5 pr-12 text-sm sm:text-base text-white outline-none focus:border-cyan-400 transition"
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition"
          >
            {showConfirmPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>

        </div>
      </div>

      <button
        disabled={isLoading}
        className={`w-full py-3.5 rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 text-white ${
          isLoading ? "bg-cyan-500/50 cursor-not-allowed" : "bg-cyan-500 hover:bg-cyan-600"
        }`}
      >
        {isLoading ? "Creating Account..." : "Create Account"}
      </button>

      <p className="text-center text-slate-400 mt-8">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-cyan-400 hover:underline"
        >
          Login here
        </Link>
      </p>
    </form>
  );
}

export default RegisterForm;
