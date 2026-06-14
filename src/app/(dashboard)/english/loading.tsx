export default function EnglishLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="skeleton h-8 w-40 rounded-lg mb-2" />
      <div className="skeleton h-4 w-80 rounded mb-6" />
      <div className="skeleton h-12 w-full rounded-xl mb-8" />
      <div className="grid grid-cols-1 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
    </div>
  );
}
