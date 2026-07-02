interface Props {
  name: string;
  type: string;
  uploaded: string;
}

function DocumentRow({ name, type, uploaded }: Props) {
  return (
    <tr className="border-b border-slate-800 hover:bg-slate-800 transition">
      <td className="py-4 px-4">{name}</td>

      <td className="py-4 px-4">
        <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full">
          {type}
        </span>
      </td>

      <td className="py-4 px-4 text-slate-400">
        {uploaded}
      </td>

      <td className="py-4 px-4">
        <button className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition">
          Delete
        </button>
      </td>
    </tr>
  );
}

export default DocumentRow;