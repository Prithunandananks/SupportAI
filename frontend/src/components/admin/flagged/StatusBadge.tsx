interface Props {
  status: "Pending" | "Resolved";
}

function StatusBadge({ status }: Props) {
  const pending = status === "Pending";

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${
        pending
          ? "bg-yellow-500/20 text-yellow-400"
          : "bg-green-500/20 text-green-400"
      }`}
    >
      {pending ? "🟡 Pending" : "🟢 Resolved"}
    </span>
  );
}

export default StatusBadge;