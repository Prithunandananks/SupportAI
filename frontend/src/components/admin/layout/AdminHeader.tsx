interface Props {
  title: string;
}

function AdminHeader({ title }: Props) {
  return (
    <header className="border-b border-slate-800 px-8 py-6">
      <h1 className="text-3xl font-bold">
        {title}
      </h1>

      <p className="text-slate-400 mt-2">
        Manage your SupportAI workspace.
      </p>
    </header>
  );
}

export default AdminHeader;