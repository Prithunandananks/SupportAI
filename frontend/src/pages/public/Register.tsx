import Navbar from "@/components/layout/Navbar";
import RegisterForm from "@/components/auth/RegisterForm";
import { Link } from "react-router-dom";

function Register() {

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <div className="px-5 md:px-8 py-5">
        <Link
          to="/"
          className="text-sm md:text-base text-cyan-400 hover:underline"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="flex justify-center items-center px-5 pb-10 md:pb-20 min-h-[calc(100vh-140px)]">
        <RegisterForm />
      </div>
    </div>
  );
}

export default Register;