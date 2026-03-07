import { RefreshCw } from 'lucide-react';

interface BackendErrorStateProps {
    error?: any;
    refetch?: () => void;
}

export default function BackendErrorState({ error, refetch }: BackendErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-16 text-white">
            <div className="text-7xl mb-8 animate-pulse">🔌</div>
            <h2 className="text-3xl font-black font-display italic uppercase tracking-tighter mb-4">
                Signal Lost: Cannot connect to backend
            </h2>
            <p className="text-gray-400 font-medium font-display italic mb-6 max-w-md">
                The agent is unable to reach the orbital command module.
                Ensure the FastAPI server is running on port <span className="text-accent-blue">8000</span>.
            </p>

            <div className="bg-black/40 border border-white/5 rounded-2xl p-6 text-left text-sm text-gray-500 mb-8 max-w-sm w-full font-mono">
                <p className="text-accent-green mb-2"># Run this in your terminal:</p>
                <p className="text-gray-300">cd backend</p>
                <p className="text-gray-300">python3 main.py</p>
                {error?.message && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-red-400/60 text-[10px] uppercase font-black mb-1">Error Trace:</p>
                        <p className="text-red-400 text-xs overflow-hidden text-ellipsis whitespace-nowrap">{error.message}</p>
                    </div>
                )}
            </div>

            <button
                onClick={() => refetch ? refetch() : window.location.reload()}
                className="px-10 py-4 bg-accent-blue text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.05] active:scale-95 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-3"
            >
                <RefreshCw size={16} /> Re-establish Connection
            </button>
        </div>
    );
}
