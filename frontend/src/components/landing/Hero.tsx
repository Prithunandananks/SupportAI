function Hero() {
  return (
    <section className="relative overflow-hidden flex flex-col items-center justify-center text-center py-32 px-6">

      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl -z-10"></div>

      {/* Badge */}
      <span className="mb-6 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-sm font-medium">
        🤖 AI Customer Support Platform
      </span>

      {/* Title */}
      <h1 className="text-6xl md:text-7xl font-extrabold leading-tight">
        <span className="text-white">
          Support
        </span>

        <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          AI
        </span>
      </h1>

      {/* Subtitle */}
      <p className="mt-6 max-w-2xl text-xl text-slate-300 leading-8">
        Upload your company's documents, FAQs and policies.
        SupportAI retrieves trusted information from your own
        knowledge base to deliver fast, accurate and reliable
        customer support.
      </p>

      {/* Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mt-10">

        <a
          href="/login"
          className="bg-cyan-500 hover:bg-cyan-600 transition px-8 py-4 rounded-xl font-semibold"
        >
          Get Started
        </a>

        <a
          href="/register"
          className="
            px-8
            py-4
            rounded-xl
            border
            border-slate-700
            text-white
            hover:border-cyan-500
            hover:bg-slate-800
            transition-all
            duration-300
          "
        >
          Create Account
        </a>
      </div>

    </section>
  );
}

export default Hero;