import FlaggedRow from "./FlaggedRow";

const questions = [
  {
    question: "How do I install VPN?",
    confidence: 42,
    status: "Pending" as const,
  },
  {
    question: "Refund policy?",
    confidence: 58,
    status: "Pending" as const,
  },
  {
    question: "Leave policy?",
    confidence: 91,
    status: "Resolved" as const,
  },
];

function FlaggedTable() {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">

      <h2 className="text-2xl font-semibold mb-6">
        Flagged Questions
      </h2>

      <table className="w-full text-left">

        <thead>

          <tr className="border-b border-slate-700">

            <th className="pb-4">Question</th>

            <th className="pb-4">Confidence</th>

            <th className="pb-4">Status</th>

            <th className="pb-4">Action</th>

          </tr>

        </thead>

        <tbody>

          {questions.map((question) => (
            <FlaggedRow
              key={question.question}
              {...question}
            />
          ))}

        </tbody>

      </table>

    </div>
  );
}

export default FlaggedTable;