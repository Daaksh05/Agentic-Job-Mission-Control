import React from 'react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-screen text-center p-12 bg-background">
                    <div className="text-6xl mb-6">⚠️</div>
                    <h2 className="text-2xl font-black text-white mb-3 uppercase italic tracking-tighter">
                        Mission Failure
                    </h2>
                    <p className="text-gray-400 text-sm mb-8 max-w-md leading-relaxed">
                        {this.state.error?.message || "An unexpected error disrupted the mission pipeline."}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-accent-blue text-white rounded-xl text-sm font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-blue-500/20"
                    >
                        Reinitialize System
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
