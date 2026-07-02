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
    <div className="flex flex-wrap justify-center gap-5 mt-12">

      {questions.map((question) => (

        <button
          key={question}
          onClick={() => onQuestionClick(question)}
          className="
            group
            bg-slate-800
            border
            border-slate-700
            hover:border-cyan-500
            hover:bg-slate-700
            rounded-2xl
            px-6
            py-4
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-lg
            hover:shadow-cyan-500/10
            text-left
          "
        >
          <div className="flex items-center gap-3">

            <span className="text-xl group-hover:scale-110 transition">
              ❓
            </span>

            <span>{question}</span>

          </div>

        </button>

      ))}

    </div>
  );
}

export default SuggestedQuestions;