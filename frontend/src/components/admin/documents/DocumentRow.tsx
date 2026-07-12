interface Props {
  name: string;
  type: string;
  uploaded: string;
  onView: () => void;
  onDelete: () => void;
}

function DocumentRow({ name, type, uploaded, onView, onDelete }: Props) {
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800 transition">

      <td className="py-3 md:py-4 px-2 md:px-4 text-sm md:text-base">
        {name}
      </td>

      <td className="py-3 md:py-4 px-2 md:px-4">

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

      <td className="py-3 md:py-4 px-2 md:px-4 text-slate-400 text-sm md:text-base">
        {uploaded}
      </td>

      <td className="py-3 md:py-4 px-2 md:px-4">

        <div className="flex gap-2">
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