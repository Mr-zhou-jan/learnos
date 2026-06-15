export default function DashboardLoading() {
  return (
    <div className="flex h-screen bg-zinc-50">
      <aside className="hidden lg:flex w-60 bg-white border-r border-zinc-200 p-4 flex-col gap-4 shrink-0">
        <div className="skeleton h-10 w-full rounded-xl" />
        {[...Array(3)].map((_, g) => (
          <div key={g} className="space-y-2">
            <div className="skeleton h-3 w-16 rounded" />
            {[...Array(g===1?9:5)].map((_, i) => <div key={i} className="skeleton h-8 w-full rounded-lg" />)}
          </div>
        ))}
      </aside>
      <main className="flex-1 p-6 space-y-4 overflow-auto bg-page">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-4 w-96 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
        <div className="skeleton h-48 rounded-2xl mt-4" />
      </main>
    </div>
  );
}
