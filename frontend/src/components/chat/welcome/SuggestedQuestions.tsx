interface Props {
  onQuestionClick: (question: string) => void;
}

const questions = [
  { text: "How do I reset my password?", icon: "🔑" },
  { text: "How can I request a refund?", icon: "💸" },
  { text: "How do I contact customer support?", icon: "📞" },
  { text: "Where can I find the API docs?", icon: "📖" },
];

function SuggestedQuestions({ onQuestionClick }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 w-full max-w-3xl">

      {questions.map((q) => (

        <button
          key={q.text}
          onClick={() => onQuestionClick(q.text)}
          className="
            group
            bg-slate-800/50
            border
            border-slate-700/50
            hover:border-cyan-500/50
            hover:bg-slate-700/50
            rounded-2xl
            px-5
            py-4
            transition-all
            duration-300
            hover:-translate-y-1
            text-left
            flex
            flex-col
            gap-2
          "
        >
          <span className="text-2xl group-hover:scale-110 transition opacity-80">
            {q.icon}
          </span>
          <span className="text-sm text-slate-300 group-hover:text-cyan-100 font-medium">
            {q.text}
          </span>
        </button>

      ))}

    </div>
  );
}

export default SuggestedQuestions;