export default function DashboardLoading() {
  return (
    <div className="flex h-screen bg-zinc-50">
      <aside className="w-60 bg-white border-r border-zinc-200 p-4 space-y-4">
        <div className="skeleton h-10 w-full rounded-lg" />
        <div className="space-y-2">
          <div className="skeleton h-4 w-16 rounded" />
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-9 w-full rounded-lg" />)}
        </div>
        <div className="space-y-2 mt-6">
          <div className="skeleton h-4 w-16 rounded" />
          {[...Array(9)].map((_, i) => <div key={i} className="skeleton h-9 w-full rounded-lg" />)}
        </div>
      </aside>
      <main className="flex-1 p-6 space-y-4 overflow-auto">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-4 w-96 rounded" />
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
        <div className="skeleton h-64 rounded-2xl mt-4" />
      </main>
    </div>
  );
}
