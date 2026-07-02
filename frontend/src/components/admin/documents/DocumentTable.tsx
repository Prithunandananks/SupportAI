import DocumentRow from "./DocumentRow";

const documents = [
  {
    name: "Employee_Handbook.pdf",
    type: "PDF",
    uploaded: "Today",
  },
  {
    name: "Refund_Policy.pdf",
    type: "PDF",
    uploaded: "Yesterday",
  },
  {
    name: "HR_Guide.pdf",
    type: "PDF",
    uploaded: "2 days ago",
  },
];

function DocumentTable() {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 mt-8">

      <h2 className="text-2xl font-semibold mb-6">
        Uploaded Documents
      </h2>

      <table className="w-full text-left">

        <thead>

          <tr className="border-b border-slate-700">

            <th className="pb-4">Document</th>

            <th className="pb-4">Type</th>

            <th className="pb-4">Uploaded</th>

            <th className="pb-4">Action</th>

          </tr>

        </thead>

        <tbody>

          {documents.map((doc) => (
            <DocumentRow
              key={doc.name}
              name={doc.name}
              type={doc.type}
              uploaded={doc.uploaded}
            />
          ))}

        </tbody>

      </table>
    </div>
  );
}

export default DocumentTable;