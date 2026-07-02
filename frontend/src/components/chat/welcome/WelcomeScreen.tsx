import SuggestedQuestions from "./SuggestedQuestions";

interface Props {
  onQuestionClick: (question: string) => void;
}

function WelcomeScreen({ onQuestionClick }: Props) {
  return (
    <div className="flex-1 flex flex-col justify-center items-center text-center px-10">

      <div className="mb-5 text-6xl">
        🤖
      </div>

      <h1 className="text-5xl md:text-6xl font-bold leading-tight">
        Welcome to{" "}
        <span className="text-cyan-400">
          SupportAI
        </span>
      </h1>

      <p className="text-slate-400 mt-6 max-w-2xl text-lg leading-8">
        Ask anything about your company's documents,
        policies, FAQs and manuals.
        Every response is generated using your organization's
        knowledge base.
      </p>

      <SuggestedQuestions
        onQuestionClick={onQuestionClick}
      />

    </div>
  );
}

export default WelcomeScreen;