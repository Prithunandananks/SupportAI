import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-6 bg-slate-950 border-b border-slate-800">
      <h1 className="text-2xl font-bold text-cyan-400">
        🤖 SupportAI
      </h1>

      <div className="flex gap-4">
        <Link
          to="/login"
          className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white transition"
        >
          Login
        </Link>

        <Link
          to="/register"
          className="px-5 py-2 rounded-lg border border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white transition"
        >
          Register
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;