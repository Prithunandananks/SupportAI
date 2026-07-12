function Footer() {
  return (
    <footer className="border-t border-slate-800 mt-10">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">

        <p className="text-sm text-slate-500 text-center md:text-left">
          © 2026 <span className="text-cyan-400 font-medium">SupportAI</span>.
          All rights reserved.
        </p>

        <p className="text-xs md:text-sm text-slate-500 text-center">
          Built with React • FastAPI • PostgreSQL • Qdrant
        </p>

      </div>
    </footer>
  );
}

export default Footer;