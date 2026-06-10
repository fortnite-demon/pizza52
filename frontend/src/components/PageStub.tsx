type PageStubProps = {
  title: string;
};

export default function PageStub({ title }: PageStubProps) {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-3xl font-semibold text-slate-800">{title}</h2>
      </div>
    </main>
  );
}
