"use client";
import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[300px] p-6">
          <div className="text-center max-w-sm animate-scale-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">页面出现异常</h3>
            <p className="text-sm text-zinc-500 mb-4">{this.state.error?.message || "渲染错误"}</p>
            <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="btn-primary flex items-center gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" /> 刷新页面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
