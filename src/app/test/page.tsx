"use client";
import { useState } from "react";

export default function Test() {
  const [show, setShow] = useState(false);
  return (
    <div className="p-20 text-center">
      <button onClick={() => setShow(!show)} className="px-6 py-3 bg-blue-500 text-white rounded-xl text-lg">
        点击测试: {show ? "展开 ✅" : "收起"}
      </button>
      {show && <div className="mt-4 p-4 bg-green-100 rounded-xl">视频链接输入框在这里</div>}
    </div>
  );
}
