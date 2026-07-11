function Hero() {
  return (
    <section className="relative overflow-hidden flex flex-col items-center justify-center text-center px-6 py-16 md:py-28 min-h-[70vh] md:min-h-[80vh]">

      {/* Background Glow */}
      <div
        className="
          absolute
          w-80
          h-80
          md:w-[550px]
          md:h-[550px]
          rounded-full
          bg-cyan-400/20
          blur-[120px]
          animate-pulse
          -z-10
        "
      />

      {/* Badge */}
      <span
        className="
          mb-6
          px-3
          py-1.5
          text-xs
          md:text-sm
          font-medium
          text-cyan-300
          bg-cyan-500/10
          border
          border-cyan-500/30
          rounded-full
          backdrop-blur-sm
        "
      >
        AI Customer Support Platform
      </span>

      {/* Title */}
      <h1
        className="
          text-4xl
          sm:text-5xl
          md:text-6xl
          lg:text-7xl
          font-extrabold
          leading-tight
          tracking-tight
        "
      >
        <span className="text-white">
          Support
        </span>

        <span
          className="
            bg-gradient-to-r
            from-cyan-400
            to-blue-500
            bg-clip-text
            text-transparent
          "
        >
          AI
        </span>
      </h1>

      {/* Subtitle */}
      <p
        className="
          mt-6
          max-w-sm
          sm:max-w-xl
          md:max-w-2xl
          text-base
          sm:text-lg
          md:text-xl
          text-slate-300
          leading-7 md:leading-8
        "
      >
        Upload your company's documents, FAQs and policies.
        SupportAI retrieves trusted information from your own
        knowledge base to deliver fast, accurate and reliable
        customer support.
      </p>

      {/* Buttons */}
      <div
        className="
          mt-10
          flex
          flex-col
          sm:flex-row
          items-center
          justify-center
          gap-4
          w-full
        "
      >
        <a
          href="/login"
          className="
            w-full
            max-w-sm
            sm:w-auto
            sm:min-w-[180px]
            bg-cyan-500
            hover:bg-cyan-600
            text-white
            text-sm md:text-base
            font-semibold
            px-8
            py-3.5 md:py-4
            rounded-xl
            shadow-lg
            shadow-cyan-500/20
            hover:shadow-cyan-500/40
            transition-all
            duration-300
          "
        >
          Get Started
        </a>

        <a
          href="/register"
          className="
            w-full
            max-w-sm
            sm:w-auto
            sm:min-w-[180px]
            px-8
            py-3.5 md:py-4
            rounded-xl
            border
            border-slate-700
            text-white
            text-sm md:text-base
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