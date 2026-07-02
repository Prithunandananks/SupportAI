function UploadBox() {
  return (
    <div className="bg-slate-900 border-2 border-dashed border-cyan-500 rounded-2xl p-10 text-center">

      <h2 className="text-2xl font-semibold">
        📄 Upload Knowledge Documents
      </h2>

      <p className="text-slate-400 mt-3">
        Drag & drop your PDF, DOCX or TXT files here
      </p>

      <button className="mt-6 bg-cyan-500 hover:bg-cyan-600 px-6 py-3 rounded-xl transition">
        Browse Files
      </button>

    </div>
  );
}

export default UploadBox;