import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuthCore";

function AdminDevLogin() {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();

  const handleLogin = () => {
    loginAdmin();
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-md bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-6 sm:p-8 text-center">
        <h1 className="text-3xl font-bold text-cyan-400 mb-2">SupportAI</h1>
        <h2 className="text-xl font-semibold text-white mb-4">Administrator Login (Development)</h2>
        
        <p className="text-slate-400 text-sm mb-8">
          This is a temporary development login page. It allows frontend developers to test the Administrator interface without a backend.
        </p>
        
        <button
          onClick={handleLogin}
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3.5 rounded-lg transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
        >
          Login as Administrator
        </button>
      </div>
    </div>
  );
}

export default AdminDevLogin;

