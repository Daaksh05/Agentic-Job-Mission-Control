import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    Briefcase,
    Target,
    CheckCircle,
    Activity,
    ArrowUpRight,
    TrendingUp,
    Clock,
    Sparkles,
    Zap
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const API_BASE = 'http://localhost:8000';

const useBackendHealth = () => {
    return useQuery({
        queryKey: ['health'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/health`, { timeout: 2000 });
            return res.data;
        },
        refetchInterval: 10000,
        retry: false,
    });
};

const StatCard = ({ title, value, icon: Icon, color, trend, subtext, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={`glass-card p-6 border-l-4 group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}
        style={{ borderLeftColor: color }}
    >
        <div className="absolute top-0 right-0 w-16 h-16 opacity-10 group-hover:scale-150 transition-transform blur-2xl"
            style={{ backgroundColor: color }}></div>

        <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg bg-white/5 ${color.replace('text-', 'text-opacity-80')}`}>
                <Icon size={20} className={color} />
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${trend > 0 ? 'bg-accent-green/10 text-accent-green' : 'bg-red-500/10 text-red-400'
                }`}>
                {trend > 0 ? '+' : ''}{trend} TODAY <TrendingUp size={10} />
            </div>
        </div>

        <div className="space-y-1">
            <div className="text-3xl font-black font-display tracking-tight">{value}</div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{title}</div>
            <p className="text-[10px] text-gray-400 mt-2 font-medium">{subtext}</p>
        </div>
    </motion.div>
);

const activityData = [
    { day: 'Mon', high: 12, applied: 4 },
    { day: 'Tue', high: 18, applied: 5 },
    { day: 'Wed', high: 15, applied: 3 },
    { day: 'Thu', high: 22, applied: 8 },
    { day: 'Fri', high: 14, applied: 4 },
    { day: 'Sat', high: 8, applied: 2 },
    { day: 'Sun', high: 10, applied: 3 },
];

const countries = [
    { name: 'France', flag: '🇫🇷', count: 42, color: 'bg-accent-blue', width: '85%' },
    { name: 'Remote', flag: '🌐', count: 31, color: 'bg-white/10', width: '65%' },
    { name: 'UK', flag: '🇬🇧', count: 22, color: 'bg-white/10', width: '45%' },
    { name: 'Germany', flag: '🇩🇪', count: 17, color: 'bg-white/10', width: '35%' },
    { name: 'Other', flag: '🇳🇱', count: 12, color: 'bg-white/10', width: '25%' },
];

const events = [
    { type: 'discovery', title: 'New job discovered', details: 'Senior React Dev at Doctolib 🇫🇷', time: '2h ago', color: 'bg-accent-blue' },
    { type: 'high-match', title: 'High match (94/100)', details: 'Staff Engineer at Stripe 🇫🇷', time: '3h ago', color: 'bg-accent-green' },
    { type: 'document', title: 'Cover letter generated', details: 'Backend Dev at OVHcloud 🇫🇷', time: '5h ago', color: 'bg-accent-amber' },
    { type: 'discovery', title: 'New job discovered', details: 'DevOps Engineer at Remote 🌐', time: '6h ago', color: 'bg-accent-blue' },
    { type: 'submission', title: 'Application submitted', details: 'Frontend Dev at BlaBlaCar 🇫🇷', time: '1d ago', color: 'bg-orange-500' },
];

export default function Dashboard() {
    const { data: health } = useBackendHealth();
    const isOnline = !!health;

    const { data: jobs } = useQuery({
        queryKey: ['jobs'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/jobs`);
            return res.data;
        }
    });

    const getTagline = () => {
        if (!isOnline) return "Orbital link unstable. Attempting to re-establish connection...";
        if (jobs && jobs.length > 0) {
            const frJobs = jobs.filter((j: any) => j.country === 'FR').length;
            return `Agent is live — ${jobs.length} high matches found today — ${frJobs} French roles ready for review`;
        }
        return "Agent is live — scanning 5 job boards across 🇫🇷 France & 9 countries";
    };

    return (
        <div className="p-10 space-y-10 max-w-[1600px] mx-auto">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-2"
            >
                <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-black font-display tracking-tight italic uppercase text-white">Command Center</h1>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                        <div className={`w-2 h-2 rounded-full animate-pulse shadow-sm ${isOnline ? 'bg-accent-green shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'}`}></div>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest font-mono">
                            API {isOnline ? 'CONNECTED' : 'OFFLINE'}
                        </span>
                    </div>
                </div>
                <p className="text-gray-400 font-medium flex items-center gap-2 italic">
                    <Sparkles size={14} className={isOnline ? "text-accent-blue" : "text-gray-600"} />
                    {getTagline()}
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Jobs Found"
                    value="124"
                    icon={Briefcase}
                    color="#3B82F6"
                    trend={18}
                    subtext="+18 since yesterday"
                    delay={0.1}
                />
                <StatCard
                    title="High Matches"
                    value="12"
                    icon={Target}
                    color="#10B981"
                    trend={4}
                    subtext="70+ score · 4 French 🇫🇷"
                    delay={0.2}
                />
                <StatCard
                    title="Applications"
                    value="8"
                    icon={CheckCircle}
                    color="#F59E0B"
                    trend={3}
                    subtext="3 pending review"
                    delay={0.3}
                />
                <StatCard
                    title="Alerts"
                    value="3"
                    icon={Activity}
                    color="#EF4444"
                    trend={1}
                    subtext="1 interview · 2 follow-ups"
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-3 glass-card p-8 flex flex-col"
                >
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">Discovery Activity — Last 7 Days</h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-accent-blue"></div>
                                <span className="text-[10px] font-bold text-gray-400">HIGH MATCH</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-accent-green"></div>
                                <span className="text-[10px] font-bold text-gray-400">APPLIED</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-72 w-full font-mono">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis dataKey="day" stroke="#4B5563" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                                <YAxis stroke="#4B5563" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    contentStyle={{ backgroundColor: '#0F0F11', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                                />
                                <Bar dataKey="high" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="applied" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-2 glass-card p-8"
                >
                    <h3 className="font-black text-xs uppercase tracking-widest text-gray-500 mb-8">Jobs by Country</h3>
                    <div className="space-y-6">
                        {countries.map((c, i) => (
                            <div key={i} className="space-y-2 group cursor-pointer">
                                <div className="flex justify-between text-xs font-bold">
                                    <div className="flex items-center gap-2 group-hover:text-accent-blue transition-colors">
                                        <span>{c.flag}</span>
                                        <span>{c.name}</span>
                                    </div>
                                    <span className="text-gray-500">{c.count} jobs</span>
                                </div>
                                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: c.width }}
                                        transition={{ delay: 0.7 + i * 0.1, duration: 1 }}
                                        className={`h-full ${c.color} rounded-full ${c.name === 'France' ? 'shadow-[0_0_12px_rgba(59,130,246,0.4)]' : ''}`}
                                    ></motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="lg:col-span-1 glass-card p-8 flex flex-col items-center justify-center text-center space-y-4"
                >
                    <div className="w-16 h-16 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue mb-2 shadow-inner">
                        <Zap size={32} />
                    </div>
                    <h4 className="font-black text-sm uppercase tracking-tighter">AI Pulse</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                        System is analyzing 42 unique signals. Discovery efficiency is at <span className="text-accent-green font-bold">98.2%</span>.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="lg:col-span-4 glass-card p-8"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">Live Mission Logs</h3>
                        <button className="text-[10px] font-black text-accent-blue hover:text-white transition-colors flex items-center gap-2 uppercase">
                            VIEW FULL AUDIT <ArrowUpRight size={12} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {events.map((ev, i) => (
                            <div key={i} className="flex items-center gap-4 group cursor-pointer hover:bg-white/[0.02] p-2 rounded-xl transition-all">
                                <div className={`w-2 h-2 rounded-full ${ev.color} shadow-[0_0_8px_currentColor]`}></div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-gray-200 uppercase tracking-tight">{ev.title}</span>
                                        <span className="h-1 w-1 bg-white/10 rounded-full"></span>
                                        <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                                            <Clock size={10} /> {ev.time}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium group-hover:text-gray-300 transition-colors uppercase tracking-widest mt-0.5">{ev.details}</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowUpRight size={14} className="text-gray-600" />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
