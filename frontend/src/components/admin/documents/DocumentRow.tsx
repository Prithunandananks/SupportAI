interface Props {
  name: string;
  type: string;
  uploaded: string;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

function DocumentRow({ name, type, uploaded, onView, onDownload, onDelete }: Props) {
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800 transition">

      <td className="py-3 md:py-4 px-2 md:px-4 text-sm md:text-base text-left w-1/3">
        {name}
      </td>

      <td className="py-3 md:py-4 px-2 md:px-4 text-center">

        <span
          className="
            bg-cyan-500/20
            text-cyan-400
            px-2
            md:px-3
            py-1
            rounded-full
            text-xs
            md:text-sm
          "
        >
          {type}
        </span>

      </td>

      <td className="py-3 md:py-4 px-2 md:px-4 text-slate-400 text-sm md:text-base text-center">
        {uploaded}
      </td>

      <td className="py-3 md:py-4 px-2 md:px-4 text-center">

        <div className="flex gap-2 justify-center items-center">
          <button
            onClick={onView}
            className="
              bg-slate-700
              hover:bg-slate-600
              px-3
              md:px-4
              py-2
              rounded-lg
              text-xs
              md:text-sm
              transition
              text-white
            "
          >
            View
          </button>
          
          <button
            onClick={onDownload}
            className="
              border border-cyan-500
              text-cyan-400
              hover:bg-cyan-500/10
              px-3
              md:px-4
              py-2
              rounded-lg
              text-xs
              md:text-sm
              transition
              flex items-center gap-1.5
            "
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span className="hidden md:inline">Download</span>
          </button>

          <button
            onClick={onDelete}
            className="
              bg-red-500
              hover:bg-red-600
              px-3
              md:px-4
              py-2
              rounded-lg
              text-xs
              md:text-sm
              transition
              text-white
            "
          >
            Delete
          </button>
        </div>

      </td>

    </tr>
  );
}

export default DocumentRow;