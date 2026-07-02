import Navbar from "@/components/layout/Navbar";
import RegisterForm from "@/components/auth/RegisterForm";
import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <div className="px-8 py-6">
        <Link
          to="/"
          className="text-cyan-400 hover:underline"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="flex justify-center items-center px-5 pb-20">
        <RegisterForm />
      </div>
    </div>
  );
}

export default Register;