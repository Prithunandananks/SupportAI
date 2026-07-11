interface Props {
  onQuestionClick: (question: string) => void;
}

const questions = [
  "How do I reset my password?",
  "How can I request a refund?",
  "How do I contact customer support?",
];

function SuggestedQuestions({ onQuestionClick }: Props) {
  return (
    <div className="mt-10 flex flex-col items-center gap-4 w-full">
      {questions.map((question) => (
        <button
          key={question}
          onClick={() => onQuestionClick(question)}
          className="
            group
            flex
            items-center
            gap-4

            w-full
            max-w-[460px]

            rounded-xl
            border
            border-slate-700
            bg-slate-800/70

            px-4
            py-3
            md:px-5
            md:py-4

            text-left

            transition-all
            duration-300

            hover:border-cyan-500
            hover:bg-slate-700
            hover:shadow-lg
            hover:shadow-cyan-500/10
            hover:-translate-y-0.5
          "
        >
          <div
            className="
              flex
              h-8
              w-8
              md:h-10
              md:w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-cyan-500/10
              text-cyan-400
              font-semibold
              transition-transform
              duration-300
              group-hover:scale-110
            "
          >
            ?
          </div>

          <span
            className="
              text-[15px]
              md:text-base
              text-slate-200
              leading-6
            "
          >
            {question}
          </span>
        </button>
      ))}
    </div>
  );
}

export default SuggestedQuestions;