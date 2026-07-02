import ConversationRow from "./ConversationRow";

const conversations = [
  {
    customer: "John",
    question: "Refund policy",
    time: "10:22 AM",
    status: "Completed" as const,
  },
  {
    customer: "Sarah",
    question: "VPN setup",
    time: "Yesterday",
    status: "Flagged" as const,
  },
  {
    customer: "David",
    question: "Leave policy",
    time: "Monday",
    status: "Completed" as const,
  },
];

function ConversationTable() {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">

      <h2 className="text-2xl font-semibold mb-6">
        Recent Conversations
      </h2>

      <table className="w-full text-left">

        <thead>

          <tr className="border-b border-slate-700">

            <th className="pb-4">Customer</th>

            <th className="pb-4">Last Question</th>

            <th className="pb-4">Time</th>

            <th className="pb-4">Status</th>

            <th className="pb-4">Action</th>

          </tr>

        </thead>

        <tbody>

          {conversations.map((conversation) => (
            <ConversationRow
              key={conversation.customer}
              {...conversation}
            />
          ))}

        </tbody>

      </table>

    </div>
  );
}

export default ConversationTable;