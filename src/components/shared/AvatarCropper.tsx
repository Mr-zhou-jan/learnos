"use client";
import { useState, useRef, useEffect } from "react";
import { Check, X, ZoomIn, ZoomOut } from "lucide-react";

interface Props { open: boolean; onClose: () => void; onCrop: (dataUrl: string) => void; }

const VIEW = 280; // 圆环显示尺寸
const OUT = 256;  // 输出尺寸

export default function AvatarCropper({ open, onClose, onCrop }: Props) {
  const [src, setSrc] = useState("");
  const [tx, setTx] = useState(0);  // 水平偏移(px)
  const [ty, setTy] = useState(0);  // 垂直偏移(px)
  const [scale, setScale] = useState(1);
  const [natW, setNatW] = useState(100);
  const [natH, setNatH] = useState(100);
  const [dragging, setDragging] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => { if (open) { setSrc(""); setTx(0); setTy(0); setScale(1); } }, [open]);

  // 图片加载完成：初始缩放让短边刚好填满圆环
  const onLoad = () => {
    const img = imgRef.current; if (!img) return;
    const w = img.naturalWidth; const h = img.naturalHeight;
    setNatW(w); setNatH(h);
    setScale(VIEW / Math.min(w, h));
    setTx(0); setTy(0);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setSrc(r.result as string); r.readAsDataURL(f);
  };

  // 拖拽
  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      setTx(p => p + (e.clientX - lastMouse.current.x));
      setTy(p => p + (e.clientY - lastMouse.current.y));
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const up = () => setDragging(false);
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [dragging]);

  // Canvas 裁剪
  const crop = () => {
    const img = imgRef.current; if (!img) return;
    const c = document.createElement("canvas"); c.width = OUT; c.height = OUT;
    const ctx = c.getContext("2d")!;
    // 源图坐标映射：显示圆中心(VIEW/2, VIEW/2) 对应源图位置
    const cx = (VIEW / 2 - tx) / scale;
    const cy = (VIEW / 2 - ty) / scale;
    const r = (VIEW / 2) / scale;
    ctx.beginPath(); ctx.arc(OUT / 2, OUT / 2, OUT / 2, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2, 0, 0, OUT, OUT);
    onCrop(c.toDataURL("image/png")); onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-100">
          <h3 className="font-bold text-lg">裁剪头像</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5"/></button>
        </div>

        {!src ? (
          <div className="p-12 text-center">
            <label className="cursor-pointer group">
              <div className="w-24 h-24 mx-auto mb-5 rounded-full bg-zinc-100 border-2 border-dashed border-zinc-300 flex items-center justify-center group-hover:border-primary-300 group-hover:bg-primary-50 transition-colors">
                <svg className="w-10 h-10 text-zinc-400 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15"/></svg>
              </div>
            </label>
            <p className="text-sm text-zinc-500 mb-1 font-medium">选择一张照片</p>
            <p className="text-xs text-zinc-400 mb-6">拖动图片定位 · 滑动条缩放</p>
            <label className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold text-sm cursor-pointer hover:shadow-lg hover:shadow-purple-200 transition-all active:scale-95">
              📁 从相册选择
              <input type="file" accept="image/*" className="hidden" onChange={handleFile}/>
            </label>
          </div>
        ) : (
          <div>
            {/* 裁剪画布 */}
            <div className="bg-[#1a1a2e] flex items-center justify-center py-10 select-none">
              <div className="relative rounded-full overflow-hidden shadow-2xl shadow-black/50"
                style={{ width: VIEW, height: VIEW, cursor: "grab" }}
                onMouseDown={e => { setDragging(true); lastMouse.current = { x: e.clientX, y: e.clientY }; }}
                onWheel={e => { e.preventDefault(); setScale(s => Math.max(0.3, Math.min(5, s - e.deltaY * 0.002))); }}>
                {/* 图片：居中 + translate偏移 + scale缩放 */}
                <div className="absolute top-1/2 left-1/2"
                  style={{
                    width: natW, height: natH,
                    transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${scale})`,
                    transformOrigin: "center center",
                  }}>
                  <img ref={imgRef} src={src} alt="" style={{ width: "100%", height: "100%", display: "block" }}
                    draggable={false} onLoad={onLoad}/>
                </div>
                {/* 暗色遮罩 + 十字参考线 */}
                <div className="absolute inset-0 pointer-events-none rounded-full"
                  style={{ boxShadow: `0 0 0 999px rgba(0,0,0,0.5)` }}/>
                <div className="absolute inset-0 pointer-events-none rounded-full border-2 border-white/40" />
              </div>
            </div>

            {/* 控制栏 */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-100 bg-zinc-50">
              <div className="flex items-center gap-3">
                <button onClick={() => setScale(s => Math.max(0.3, s - 0.1))}
                  className="p-2 rounded-lg hover:bg-zinc-200 text-zinc-600 transition-colors"><ZoomOut className="w-4 h-4"/></button>
                <input type="range" min={30} max={500}
                  value={Math.round(scale * 100)}
                  onChange={e => setScale(Number(e.target.value) / 100)}
                  className="w-28 h-1.5 bg-zinc-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:cursor-pointer"/>
                <button onClick={() => setScale(s => Math.min(5, s + 0.1))}
                  className="p-2 rounded-lg hover:bg-zinc-200 text-zinc-600 transition-colors"><ZoomIn className="w-4 h-4"/></button>
                <span className="text-xs text-zinc-400 ml-1">{Math.round(scale * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-100 cursor-pointer transition-colors">
                  📁 重选<input type="file" accept="image/*" className="hidden" onChange={handleFile}/>
                </label>
                <button onClick={crop} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-sm">
                  <Check className="w-4 h-4"/>确认
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
