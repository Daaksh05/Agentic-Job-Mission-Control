import React from 'react';

interface Props {
    rows?: number;
}

export default function PageSkeleton({ rows = 3 }: Props) {
    return (
        <div className="p-10 space-y-8 max-w-[1800px] mx-auto animate-pulse">
            {/* Header Skeleton */}
            <div className="space-y-3">
                <div className="h-10 bg-white/10 rounded-lg w-64" />
                <div className="h-4 bg-white/5 rounded w-96" />
            </div>

            {/* Content Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {Array(rows).fill(0).map((_, i) => (
                    <div key={i} className="flex flex-col gap-4">
                        <div className="h-6 bg-white/10 rounded w-24 mb-2" />
                        <div className="bg-white/5 border border-white/5 rounded-[2rem] p-6 h-[400px] space-y-4">
                            <div className="h-32 bg-white/10 rounded-2xl" />
                            <div className="h-32 bg-white/10 rounded-2xl opacity-50" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
