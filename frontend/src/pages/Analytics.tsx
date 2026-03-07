import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import {
    TrendingUp,
    Users,
    Target,
    CheckCircle,
    Globe,
    Sparkles,
    Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import PageSkeleton from '../components/PageSkeleton';
import BackendErrorState from '../components/BackendErrorState';

const API_BASE = 'http://localhost:8000';

export default function AnalyticsPage() {
    const { data: apps, isLoading, error, isError, refetch } = useQuery({
        queryKey: ['applications'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/applications/`, { timeout: 10000 });
            return res.data || [];
        },
        retry: 1,
        staleTime: 5 * 60 * 1000
    });

    if (isLoading) return <PageSkeleton rows={3} />;
    if (isError) return <BackendErrorState error={error} refetch={() => refetch()} />;

    const stats = [
        { label: 'Total Missions', value: apps?.length || 0, icon: Target, color: 'text-accent-blue' },
        { label: 'Interviews', value: apps?.filter((a: any) => a.status === 'INTERVIEW').length || 0, icon: Users, color: 'text-accent-amber' },
        { label: 'Success Rate', value: `${((apps?.filter((a: any) => a.status === 'OFFER').length / (apps?.length || 1)) * 100).toFixed(1)}%`, icon: CheckCircle, color: 'text-accent-green' },
        { label: 'Agency Pulse', value: '98.2%', icon: Activity, color: 'text-accent-purple' },
    ];

    const chartData = [
        { name: 'FR 🇫🇷', count: apps?.filter((a: any) => a.job.country === 'FR').length || 0, color: '#3b82f6' },
        { name: 'US 🇺🇸', count: apps?.filter((a: any) => a.job.country === 'US').length || 0, color: '#white' },
        { name: 'UK 🇬🇧', count: apps?.filter((a: any) => a.job.country === 'GB').length || 0, color: '#white' },
        { name: 'EU 🇪🇺', count: apps?.filter((a: any) => !['FR', 'US', 'GB'].includes(a.job.country)).length || 0, color: '#white' },
    ];

    return (
        <div className="p-10 space-y-10 max-w-[1600px] mx-auto pb-32 text-white overflow-y-auto h-screen custom-scrollbar">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <h1 className="text-5xl font-black font-display tracking-tighter italic uppercase">Analytics Audit</h1>
                <p className="text-gray-400 font-medium font-display italic mt-2">Historical mission performance and market analysis.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card p-8 flex items-center gap-6 group hover:-translate-y-1 transition-all"
                    >
                        <div className={`p-4 rounded-2xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                            <p className="text-3xl font-black font-display italic tracking-tighter uppercase">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-3 glass-card p-10 font-display"
                >
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">Global Mission Volume</h3>
                        <div className="flex items-center gap-2 text-[10px] font-black text-accent-blue uppercase tracking-widest">
                            <Globe size={14} /> PERSISTENT AGENT LOGS
                        </div>
                    </div>
                    <div className="h-96 w-full font-mono">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="name" stroke="#4B5563" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                                <YAxis stroke="#4B5563" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{ backgroundColor: '#0A0A0B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '10px' }}
                                />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={48}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name.includes('FR') ? '#3b82f6' : 'rgba(255,255,255,0.05)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-2 glass-card p-10 flex flex-col justify-between"
                >
                    <div>
                        <h3 className="font-black text-xs uppercase tracking-widest text-gray-500 mb-10">Intelligence distribution</h3>
                        <div className="space-y-8">
                            {[
                                { range: 'High Accuracy (>90%)', val: '42%', color: 'bg-accent-green' },
                                { range: 'Medium Range (70-90%)', val: '38%', color: 'bg-accent-blue' },
                                { range: 'Discovery Phase (<70%)', val: '20%', color: 'bg-white/10' }
                            ].map((row, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="flex justify-between text-xs font-black uppercase tracking-tight italic">
                                        <span className="text-gray-400">{row.range}</span>
                                        <span className="text-white">{row.val}</span>
                                    </div>
                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: row.val }}
                                            transition={{ duration: 1.5, delay: i * 0.2 }}
                                            className={`h-full ${row.color} rounded-full`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-12 p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
                        <TrendingUp size={24} className="text-accent-green" />
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                            Market resonance in <span className="text-accent-blue">France</span> is currently 15% higher than all other territories combined.
                        </p>
                    </div>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card overflow-hidden"
            >
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                        <Globe size={24} className="text-accent-blue" />
                        Market Analysis Matrix
                    </h3>
                    <span className="text-[10px] text-accent-blue font-black tracking-widest bg-accent-blue/10 px-4 py-2 rounded-full border border-accent-blue/20">
                        AUDITED MISSIONS
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-white/[0.03] text-gray-500 uppercase text-[10px] font-black tracking-widest">
                                <th className="px-10 py-6 border-b border-white/5">Territory</th>
                                <th className="px-10 py-6 border-b border-white/5 text-center">Signals Found</th>
                                <th className="px-10 py-6 border-b border-white/5 text-center">Deployed</th>
                                <th className="px-10 py-6 border-b border-white/5 text-center">Interviews</th>
                                <th className="px-10 py-6 border-b border-white/5 text-right">Yield Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <tr className="bg-accent-blue/5 hover:bg-accent-blue/10 transition-all group">
                                <td className="px-10 py-8 font-black flex items-center gap-4">
                                    <span className="text-3xl">🇫🇷</span>
                                    <span className="flex flex-col gap-1">
                                        <span className="text-white italic uppercase tracking-tight">FRANCE</span>
                                        <span className="text-[8px] text-accent-blue font-black uppercase tracking-[0.2em] flex items-center gap-1">
                                            <Sparkles size={10} /> PRIMARY TARGET
                                        </span>
                                    </span>
                                </td>
                                <td className="px-10 py-8 text-center font-mono font-bold text-gray-400">124</td>
                                <td className="px-10 py-8 text-center font-mono font-black text-white">34</td>
                                <td className="px-10 py-8 text-center font-mono font-black text-accent-amber">8</td>
                                <td className="px-10 py-8 text-right">
                                    <span className="text-3xl font-black font-display italic tracking-tighter text-accent-green">23.5%</span>
                                </td>
                            </tr>
                            {[
                                { name: 'USA', flag: '🇺🇸', disc: 89, app: 21, int: 4, rate: '21.0%', color: 'text-gray-400' },
                                { name: 'UNITED KINGDOM', flag: '🇬🇧', disc: 67, app: 12, int: 2, rate: '17.9%', color: 'text-gray-400' },
                                { name: 'GERMANY', flag: '🇩🇪', disc: 45, app: 8, int: 1, rate: '12.5%', color: 'text-gray-400' },
                                { name: 'NETHERLANDS', flag: '🇳🇱', disc: 32, app: 5, int: 1, rate: '20.0%', color: 'text-gray-400' },
                            ].map((c, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-10 py-8 text-gray-400 font-black italic uppercase tracking-tight flex items-center gap-5">
                                        <span className="text-2xl grayscale group-hover:grayscale-0 transition-all opacity-40 group-hover:opacity-100">{c.flag}</span> {c.name}
                                    </td>
                                    <td className="px-10 py-8 text-center font-mono text-gray-600 font-medium italic">{c.disc}</td>
                                    <td className="px-10 py-8 text-center font-mono text-gray-500 font-bold">{c.app}</td>
                                    <td className="px-10 py-8 text-center font-mono text-gray-500 font-bold">{c.int}</td>
                                    <td className="px-10 py-8 text-right font-black italic tracking-tighter text-gray-400 group-hover:text-white transition-colors">
                                        {c.rate}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
