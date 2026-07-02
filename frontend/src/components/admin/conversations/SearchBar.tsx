function SearchBar() {
  return (
    <div className="mb-6">
      <input
        type="text"
        placeholder="Search conversations..."
        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 outline-none focus:border-cyan-500"
      />
    </div>
  );
}

export default SearchBar;