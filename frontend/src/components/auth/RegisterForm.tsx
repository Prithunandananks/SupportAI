import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function RegisterForm() {
  const navigate = useNavigate();

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    alert("Registration successful! (Temporary)");

    navigate("/login");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 p-8 rounded-2xl shadow-xl w-full max-w-md"
    >
      <h2 className="text-3xl font-bold text-center text-white mb-2">
        Create Account 
      </h2>

      <p className="text-slate-400 text-center mb-8">
        Join SupportAI and get started
      </p>

      {error && (
        <p className="text-red-400 text-sm mb-4">
          {error}
        </p>
      )}

      <div className="mb-4">
        <label className="block text-slate-300 mb-2">
          Full Name
        </label>

        <input
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          placeholder="Enter your full name"
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block text-slate-300 mb-2">
          Email
        </label>

        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Enter your email"
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block text-slate-300 mb-2">
          Password
        </label>

        <div className="relative">

          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Create a password"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 pr-12 text-white"
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
        <label className="block text-slate-300 mb-2">
          Confirm Password
        </label>

        <div className="relative">

          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 pr-12 text-white"
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition"
          >
            {showConfirmPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>

        </div>
      </div>

       {/*<div className="mb-6">
        <label className="block text-slate-300 mb-2">
          Register As
        </label>

       <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white"
        >
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>
      </div>*/}

      <button
        className="w-full bg-cyan-500 hover:bg-cyan-600 py-3 rounded-lg font-semibold transition"
      >
        Create Account
      </button>

      <p className="text-center text-slate-400 mt-6">
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