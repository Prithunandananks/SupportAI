import { useMemo, useState } from "react";
import { toast } from "sonner";

import SearchBar from "../conversations/SearchBar";
import FlaggedRow from "./FlaggedRow";
import ReviewModal from "./ReviewModal";

export interface FlaggedQuestion {
  question: string;
  confidence: number;
  status: "Pending" | "Resolved";
}

const initialQuestions: FlaggedQuestion[] = [];

function FlaggedTable() {
  const [questions, setQuestions] = useState(initialQuestions);
  const [search, setSearch] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<typeof initialQuestions[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredQuestions = useMemo(() => {
    const query = search.toLowerCase();

    return questions.filter((item) => {
      return (
        item.question.toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query) ||
        item.confidence.toString().includes(query)
      );
    });
  }, [search, questions]);

  return (
    <div
      className="
        bg-slate-900
        rounded-xl
        md:rounded-2xl
        border
        border-slate-800
        p-4
        md:p-6
      "
    >
      <h2 className="text-lg md:text-2xl font-semibold mb-5">
        Flagged Questions
      </h2>

      <SearchBar
        value={search}
        onChange={setSearch}
      />

      {/* ================= Desktop ================= */}

      <div className="hidden md:block overflow-x-auto">
        {filteredQuestions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-lg text-slate-300">
              ✓ All Clear
            </p>

            <p className="text-sm mt-2">
              There are currently no flagged questions. All conversations are operating within confidence thresholds.
            </p>
          </div>
        ) : (
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
              {filteredQuestions.map((item) => (
                <FlaggedRow
                  key={item.question}
                  {...item}
                  onReview={() => {
                    setSelectedQuestion(item);
                    setIsModalOpen(true);
                  }}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= Mobile ================= */}

      <div className="space-y-4 md:hidden">
        {filteredQuestions.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 text-center">
            <p className="text-slate-300 text-lg">
              ✓ All Clear
            </p>

            <p className="text-slate-500 text-sm mt-2">
              There are currently no flagged questions.
            </p>
          </div>
        ) : (
          filteredQuestions.map((item) => (
            <div
              key={item.question}
              className="rounded-xl border border-slate-700 bg-slate-800 p-4"
            >
              <h3 className="font-semibold text-white">
                ❓ {item.question}
              </h3>

              <div className="flex justify-between mt-4 text-sm">
                <span className="text-slate-400">
                  Confidence
                </span>

                <span
                  className={`font-semibold ${
                    item.confidence < 60
                      ? "text-red-400"
                      : "text-green-400"
                  }`}
                >
                  {item.confidence}%
                </span>
              </div>

              <div className="flex justify-between mt-3 text-sm">
                <span className="text-slate-400">
                  Status
                </span>

                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    item.status === "Resolved"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <button
                onClick={() => {
                  setSelectedQuestion(item);
                  setIsModalOpen(true);
                }}
                className="
                  mt-4
                  w-full
                  rounded-lg
                  bg-cyan-500
                  hover:bg-cyan-600
                  py-2
                  text-sm
                  transition
                  text-white
                "
              >
                Review
              </button>
            </div>
          ))
        )}
      </div>

      <ReviewModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedQuestion}
        onResolve={() => {
          if (selectedQuestion) {
            setQuestions(prev => prev.map(q => 
              q.question === selectedQuestion.question 
                ? { ...q, status: "Resolved" } 
                : q
            ));
            toast.success("Question marked as resolved");
            setIsModalOpen(false);
          }
        }}
        onReopen={() => {
          if (selectedQuestion) {
            setQuestions(prev => prev.map(q => 
              q.question === selectedQuestion.question 
                ? { ...q, status: "Pending" } 
                : q
            ));
            toast.success("Question moved back to pending");
            setIsModalOpen(false);
          }
        }}
      />
    </div>
  );
}

export default FlaggedTable;