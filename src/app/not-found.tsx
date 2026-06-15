import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-8xl mb-4">🔍</div>
        <h1 className="text-3xl font-bold mb-2">页面未找到</h1>
        <p className="text-zinc-500 mb-8">你访问的页面不存在或已被移除</p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-secondary px-6 py-3">返回首页</Link>
          <Link href="/cockpit" className="btn-primary px-6 py-3">去驾驶舱</Link>
        </div>
      </div>
    </div>
  );
}
