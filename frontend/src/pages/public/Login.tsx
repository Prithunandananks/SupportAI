import Navbar from "@/components/layout/Navbar";
import LoginForm from "@/components/auth/LoginForm";

function Login() {

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <div className="flex justify-center items-center px-5 py-10 md:py-20 min-h-[calc(100vh-80px)]">
        <LoginForm />
      </div>
    </div>
  );
}

export default Login;