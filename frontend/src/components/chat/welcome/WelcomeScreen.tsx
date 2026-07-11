import SuggestedQuestions from "./SuggestedQuestions";

interface Props {
  onQuestionClick: (question: string) => void;
}

function WelcomeScreen({ onQuestionClick }: Props) {
  return (
    <div
      className="
        flex-1
        flex
        flex-col
        items-center
        justify-center
        text-center
        px-6
        md:px-10
        py-8
        md:py-12
      "
    >
      {/* Mobile Badge */}
      <span
        className="
          mb-4
          rounded-full
          border
          border-cyan-500/30
          bg-cyan-500/10
          px-3
          py-0.5
          text-[11px]
          font-medium
          text-cyan-300
        "
      >
        AI Customer Support
      </span>

      {/* Heading */}
      <h1
        className="
          text-2xl
          sm:text-4xl
          md:text-5xl
          lg:text-6xl
          font-bold
          leading-tight
        "
      >
        Welcome to

        <br />

        <span className="text-cyan-400">
          SupportAI
        </span>
      </h1>

      {/* Subtitle */}
      <p
        className="
          mt-5
          max-w-md
          text-xs
          sm:text-base
          md:text-lg
          leading-6
          text-slate-400
        "
      >
        Ask questions about your company's
        documents, policies, FAQs and manuals.

        <br />

        Responses are generated using your
        organization's knowledge base.
      </p>

      <SuggestedQuestions
        onQuestionClick={onQuestionClick}
      />
    </div>
  );
}

export default WelcomeScreen;