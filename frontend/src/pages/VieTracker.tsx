import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Globe, Clock, CheckCircle2, AlertCircle, ExternalLink, ShieldCheck, Mail, Calendar, Search, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import PageSkeleton from '../components/PageSkeleton';

const API_BASE = 'http://localhost:8000';

export default function VieTracker() {
    const queryClient = useQueryClient();

    const { data: jobs, isLoading: jobsLoading } = useQuery({
        queryKey: ['vie-jobs'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/jobs/`);
            return res.data.filter((j: any) => j.job_type === 'VIE');
        }
    });

    const { data: eligibility, isLoading: eligibilityLoading } = useQuery({
        queryKey: ['vie-eligibility'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/jobs/vie/eligibility`);
            return res.data;
        }
    });

    const triggerScan = useMutation({
        mutationFn: async () => {
            const res = await axios.post(`${API_BASE}/jobs/vie/scan`);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vie-jobs'] });
        }
    });

    const getDeadlineColor = (deadline: string) => {
        if (!deadline) return 'text-gray-500';
        const days = Math.floor((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (days < 3) return 'text-red-500 animate-pulse';
        if (days < 7) return 'text-accent-amber';
        return 'text-accent-green';
    };

    if (jobsLoading || eligibilityLoading) return <PageSkeleton rows={3} />;

    return (
        <div className="p-10 space-y-10 max-w-[1400px] mx-auto overflow-y-auto h-screen pb-32 custom-scrollbar text-white">
            {/* Eligibility Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#2D1B69] to-[#1a1a2e] border border-white/10 p-12 shadow-2xl"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent-blue/10 blur-[120px] -mr-48 -mt-48"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">🇫🇷</span>
                            <h1 className="text-5xl font-black font-display tracking-tighter italic uppercase">VIE MISSION TRACKER</h1>
                        </div>
                        <p className="text-xl text-gray-400 font-medium max-w-xl font-display italic">
                            Your legal route to France. {eligibility?.eligible ? "You meet all legal requirements." : "Checking requirements..."}
                        </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-2 shadow-xl">
                        <div className="flex items-center gap-2 text-accent-green font-black uppercase tracking-widest text-xs">
                            <ShieldCheck size={16} /> Eligibility Status
                        </div>
                        <div className="text-3xl font-black uppercase italic tracking-tighter">
                            {eligibility?.eligible ? 'Verified ✓' : 'Checking...'}
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Daakshayani Senthilkumar</div>
                    </div>
                </div>

                <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Your Age', value: `${eligibility?.age || 20} / 28 ✓`, color: 'text-accent-blue' },
                        { label: 'Nationality', value: 'Indian ✓', color: 'text-accent-green' },
                        { label: 'Monthly Pay', value: '€2,747', color: 'text-accent-amber' },
                        { label: 'Tax Status', value: 'Tax-Free', color: 'text-accent-green' }
                    ].map((item, i) => (
                        <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-5 text-center space-y-2">
                            <div className={`text-xl font-black italic tracking-tighter uppercase ${item.color}`}>{item.value}</div>
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.label}</div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* VIE Job Feed */}
            <div className="space-y-8">
                <div className="flex justify-between items-end px-2">
                    <div>
                        <h2 className="text-3xl font-black font-display italic uppercase tracking-tighter">Active Missions</h2>
                        <p className="text-gray-500 text-sm font-medium">Monitoring civiweb.com for IT/Telecom roles.</p>
                    </div>
                    <button
                        onClick={() => triggerScan.mutate()}
                        disabled={triggerScan.isPending}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                        {triggerScan.isPending ? <RefreshCw className="animate-spin" size={14} /> : <Search size={14} />}
                        {triggerScan.isPending ? 'Scanning...' : 'Scan Now'}
                    </button>
                </div>

                {jobs && jobs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobs.map((job: any) => (
                            <motion.div
                                key={job.id}
                                whileHover={{ y: -5 }}
                                className="glass-card p-6 flex flex-col gap-6 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-blue/5 blur-2xl -mr-12 -mt-12"></div>

                                <div className="space-y-4 flex-1">
                                    <div className="flex justify-between items-start">
                                        <div className="bg-accent-blue/10 text-accent-blue px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-accent-blue/20">
                                            VIE {job.duration || '12m'}
                                        </div>
                                        <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${getDeadlineColor(job.deadline)}`}>
                                            <Clock size={12} /> {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Rolling'}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-lg font-black font-display uppercase italic tracking-tighter leading-tight group-hover:text-accent-blue transition-colors">
                                            {job.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-accent-blue font-black text-[10px] uppercase tracking-widest">
                                            {job.company}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pt-4 border-t border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        <div className="flex items-center gap-1.5">
                                            <Globe size={12} /> {job.location}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-accent-green">
                                            <CheckCircle2 size={12} /> ~€2,747
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                                    <button className="glass-card py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all text-gray-400 hover:text-white">
                                        <Mail size={14} /> Docs
                                    </button>
                                    <a
                                        href={job.url} target="_blank" rel="noreferrer"
                                        className="bg-accent-blue text-white py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                                    >
                                        Apply <ExternalLink size={12} />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 flex flex-col items-center gap-6 bg-white/[0.02] border border-white/5 border-dashed rounded-[3rem]">
                        <div className="text-7xl opacity-50">🔍</div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Scanning Civiweb.com...</h3>
                            <p className="text-gray-500 max-w-sm mx-auto font-medium leading-relaxed">
                                The agent scans for IT/Telecom missions every 12 hours. Hit "Scan Now" to manually trigger discovery.
                            </p>
                        </div>
                        <button
                            onClick={() => triggerScan.mutate()}
                            className="px-10 py-4 bg-accent-blue text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 shadow-lg shadow-blue-500/20"
                        >
                            <RefreshCw size={14} /> Discover Missions
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
