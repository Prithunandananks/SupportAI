const topics = [
  "Refund Policy",
  "VPN Setup",
  "Employee Handbook",
  "Leave Policy",
  "Payroll",
];

function TopTopics() {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">

      <h2 className="text-2xl font-semibold mb-6">
        Top Topics
      </h2>

      <div className="space-y-4">

        {topics.map((topic, index) => (

          <div
            key={topic}
            className="flex justify-between items-center border-b border-slate-800 pb-3"
          >

            <span>{topic}</span>

            <span className="text-cyan-400 font-semibold">
              #{index + 1}
            </span>

          </div>

        ))}

      </div>

    </div>
  );
}

export default TopTopics;