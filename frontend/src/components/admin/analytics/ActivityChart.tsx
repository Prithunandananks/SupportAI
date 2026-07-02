function ActivityChart() {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">

      <h2 className="text-2xl font-semibold mb-6">
        Weekly Chat Activity
      </h2>

      <div className="flex items-end justify-between h-52 gap-3">

        {[45, 80, 65, 100, 70, 90, 60].map((height, index) => (

          <div
            key={index}
            className="flex-1 bg-cyan-500 rounded-t-xl hover:bg-cyan-400 transition"
            style={{ height: `${height}%` }}
          />

        ))}

      </div>

      <div className="flex justify-between mt-4 text-sm text-slate-400">

        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>

      </div>

    </div>
  );
}

export default ActivityChart;