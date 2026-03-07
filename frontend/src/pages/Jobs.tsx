import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Wand2, ExternalLink, Linkedin, Search, Globe, RefreshCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageSkeleton from '../components/PageSkeleton';
import BackendErrorState from '../components/BackendErrorState';

const API_BASE = 'http://localhost:8000';

export default function JobsPage() {
    const [country, setCountry] = useState('ALL');
    const queryClient = useQueryClient();

    const { data: jobs, isLoading, error, refetch, isError } = useQuery({
        queryKey: ['jobs'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/jobs`, { timeout: 10000 });
            const allJobs = res.data || [];
            return allJobs.sort((a: any, b: any) => {
                if (a.country === 'FR' && b.country !== 'FR') return -1;
                if (a.country !== 'FR' && b.country === 'FR') return 1;
                return b.match_score - a.match_score;
            });
        },
        retry: 1,
        staleTime: 60 * 1000
    });

    const scoreMutation = useMutation({
        mutationFn: (jobId: string) => axios.post(`${API_BASE}/jobs/${jobId}/score`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
    });

    const generateMutation = useMutation({
        mutationFn: (jobId: string) => axios.post(`${API_BASE}/applications/generate/${jobId}`),
        onSuccess: () => alert('Documents generated! Check the Review Queue.'),
    });

    const triggerDiscovery = useMutation({
        mutationFn: async () => {
            await axios.get(`${API_BASE}/jobs/discover`, { params: { country: country === 'ALL' ? 'FR' : country } });
        },
        onSuccess: () => {
            refetch();
        }
    });

    const countries = [
        { id: 'ALL', label: 'All', flag: '🌍' },
        { id: 'FR', label: 'France', flag: '🇫🇷', primary: true },
        { id: 'REMOTE', label: 'Remote', flag: '🌐' },
        { id: 'GB', label: 'UK', flag: '🇬🇧' },
        { id: 'DE', label: 'DE', flag: '🇩🇪' },
        { id: 'NL', label: 'NL', flag: '🇳🇱' },
    ];

    if (isLoading) return <PageSkeleton rows={4} />;
    if (isError) return <BackendErrorState error={error} refetch={() => refetch()} />;

    const filteredJobs = country === 'ALL'
        ? jobs
        : jobs?.filter((j: any) => j.country === country);

    return (
        <div className="p-10 space-y-10 max-w-[1800px] mx-auto text-white pb-32 overflow-y-auto h-screen custom-scrollbar">
            <div className="flex flex-col gap-8">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-5xl font-black font-display tracking-tighter italic uppercase">Intelligence Feed</h1>
                        <p className="text-gray-400 font-medium font-display italic mt-2">Live monitoring for high-match opportunities.</p>
                    </div>
                    <button
                        onClick={() => triggerDiscovery.mutate()}
                        disabled={triggerDiscovery.isPending}
                        className="bg-accent-blue text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.02] flex items-center gap-2 disabled:opacity-50"
                    >
                        {triggerDiscovery.isPending ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                        {triggerDiscovery.isPending ? 'Scanning Markets...' : 'Scan New Markets'}
                    </button>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide border-b border-white/5">
                    {countries.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => setCountry(c.id)}
                            className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-sm font-black italic uppercase tracking-tight transition-all whitespace-nowrap ${country === c.id
                                ? 'bg-white text-black scale-105 shadow-xl'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">{c.flag}</span>
                            {c.label}
                            {c.primary && <span className="text-accent-amber ml-1">★</span>}
                        </button>
                    ))}
                </div>
            </div>

            {(!filteredJobs || filteredJobs.length === 0) ? (
                <div className="text-center py-32 flex flex-col items-center gap-6 bg-white/[0.02] border border-white/5 border-dashed rounded-[3rem]">
                    <div className="text-7xl opacity-50">📡</div>
                    <div className="space-y-2">
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter">No signals detected</h3>
                        <p className="text-gray-500 max-w-sm mx-auto font-medium leading-relaxed font-display italic">
                            Select a market and trigger discovery to populate your feed with tailored missions.
                        </p>
                    </div>
                    <button
                        onClick={() => triggerDiscovery.mutate()}
                        className="px-12 py-5 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                    >
                        Initialize Discovery
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {filteredJobs.map((job: any, i: number) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                whileHover={{ y: -5 }}
                                className={`glass-card p-6 flex flex-col justify-between border-l-2 relative overflow-hidden group ${job.country === 'FR' ? 'border-l-accent-blue' : 'border-l-white/10'
                                    }`}
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-blue/5 blur-2xl -mr-12 -mt-12 group-hover:bg-accent-blue/20 transition-all duration-500"></div>

                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${job.job_type === 'VIE' ? 'bg-accent-purple/10 text-accent-purple border-accent-purple/20' :
                                                    job.source === 'linkedin' ? 'bg-[#0077B5]/10 text-[#0077B5] border-[#0077B5]/20' :
                                                        job.source === 'wttj' ? 'bg-accent-green/10 text-accent-green border-accent-green/20' :
                                                            'bg-white/5 text-gray-500 border-white/10'
                                                    }`}>
                                                    {job.source === 'linkedin' && <Linkedin size={10} className="inline mr-1" />}
                                                    {job.job_type === 'VIE' ? 'VIE MISSION' : job.source}
                                                </span>
                                            </div>
                                            {job.country === 'FR' && (
                                                <span className="flex items-center gap-1.5 text-[8px] font-black text-accent-blue uppercase tracking-widest">
                                                    <Sparkles size={8} /> Primary Target
                                                </span>
                                            )}
                                        </div>
                                        {job.match_score > 0 && (
                                            <div className={`px-2.5 py-1 rounded-full text-[10px] font-black italic tracking-tight ${job.match_score >= 90 ? 'bg-accent-green/20 text-accent-green animate-glow-green' :
                                                job.match_score >= 70 ? 'bg-accent-blue/20 text-accent-blue' :
                                                    'bg-accent-amber/20 text-accent-amber'
                                                }`}>
                                                {job.match_score}% MATCH
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-black font-display uppercase italic tracking-tighter mb-1 leading-tight truncate group-hover:text-accent-blue transition-colors">
                                        {job.title}
                                    </h3>
                                    <p className="text-accent-blue text-[10px] font-black uppercase tracking-widest mb-4">{job.company}</p>
                                    <p className="text-gray-500 text-xs font-medium line-clamp-3 leading-relaxed mb-6 font-display italic">
                                        {job.description}
                                    </p>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-white/5">
                                    <div className="flex gap-2">
                                        <a
                                            href={job.url} target="_blank" rel="noreferrer"
                                            className="flex-1 glass-card py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all text-gray-400 hover:text-white"
                                        >
                                            <ExternalLink size={14} /> VIEW
                                        </a>
                                        <button
                                            onClick={() => scoreMutation.mutate(job.id)}
                                            disabled={scoreMutation.isPending}
                                            className="flex-1 glass-card py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all text-accent-blue hover:text-white"
                                        >
                                            {scoreMutation.isPending ? <RefreshCw className="animate-spin" size={12} /> : 'ANALYZE'}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => generateMutation.mutate(job.id)}
                                        disabled={generateMutation.isPending}
                                        className="w-full bg-[#2D1B69] text-accent-blue border border-accent-blue/30 hover:bg-[#3D2B79] hover:text-white py-3.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10"
                                    >
                                        <Wand2 size={16} /> {generateMutation.isPending ? 'Tailoring Docs...' : 'Draft application'}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
