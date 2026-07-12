import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col justify-center items-center px-5 py-10 md:py-20 text-center">
        <h1 className="text-7xl md:text-9xl font-extrabold text-cyan-500/20 mb-4">
          404
        </h1>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Page Not Found
        </h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto text-sm md:text-base">
          The page you are looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-none justify-center">
          <button
            onClick={() => navigate("/")}
            className="w-full sm:w-auto px-8 bg-cyan-500 hover:bg-cyan-600 py-3.5 rounded-lg font-semibold transition text-white"
          >
            Go Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-8 border border-slate-700 bg-slate-800 hover:bg-slate-700 py-3.5 rounded-lg font-semibold transition text-white"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
