import Navbar from "@/components/layout/Navbar";
import LoginForm from "@/components/auth/LoginForm";

function Login() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <div className="flex justify-center items-center py-20 px-5">
        <LoginForm />
      </div>
    </div>
  );
}

export default Login;