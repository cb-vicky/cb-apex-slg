import { Component, type ReactNode, type ErrorInfo } from "react";

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

export class RootErrorBoundary extends Component<{ children: ReactNode }, State> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RootErrorBoundary] Caught error:", error);
    console.error("[RootErrorBoundary] Component stack:", info.componentStack);
    this.setState({ error, info });
  }

  reset = () => {
    this.setState({ error: null, info: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white p-8 overflow-auto">
          <div className="max-w-[800px] rounded-lg border-2 border-red-300 bg-red-50 p-6 shadow-xl">
            <h1 className="text-[18px] font-bold text-red-900 mb-2">Application Error</h1>
            <p className="text-[14px] font-semibold text-red-800 mb-3">
              {this.state.error.name}: {this.state.error.message}
            </p>
            <details open className="mb-3">
              <summary className="cursor-pointer text-[13px] font-semibold text-red-700">Stack trace</summary>
              <pre className="mt-2 text-[11px] text-red-800 whitespace-pre-wrap overflow-auto max-h-[300px] bg-white p-3 rounded border border-red-200">
                {this.state.error.stack}
              </pre>
            </details>
            {this.state.info && (
              <details className="mb-3">
                <summary className="cursor-pointer text-[13px] font-semibold text-red-700">Component stack</summary>
                <pre className="mt-2 text-[11px] text-red-800 whitespace-pre-wrap overflow-auto max-h-[300px] bg-white p-3 rounded border border-red-200">
                  {this.state.info.componentStack}
                </pre>
              </details>
            )}
            <button
              type="button"
              onClick={this.reset}
              className="rounded-md bg-red-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-red-700"
            >
              Reset and try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
