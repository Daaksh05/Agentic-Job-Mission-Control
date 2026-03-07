import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { FileText, Check, Wand2, Loader2, Camera, ShieldAlert, ChevronDown, ChevronUp, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageSkeleton from '../components/PageSkeleton';

const API_BASE = 'http://localhost:8000';

export default function QueuePage() {
    const queryClient = useQueryClient();
    const [submittingId, setSubmittingId] = React.useState<number | null>(null);
    const [submissionStep, setSubmissionStep] = React.useState('');
    const [captchaEvent, setCaptchaEvent] = React.useState<any>(null);
    const [showScreenshots, setShowScreenshots] = React.useState<number | null>(null);
    const [timeLeft, setTimeLeft] = React.useState(300);

    // Countdown for CAPTCHA
    React.useEffect(() => {
        let timer: any;
        if (captchaEvent && timeLeft > 0) {
            timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [captchaEvent, timeLeft]);

    const { data: apps, isLoading, error } = useQuery({
        queryKey: ['applications'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/applications/`);
            return res.data;
        }
    });

    const { data: logs } = useQuery({
        queryKey: ['logs', showScreenshots],
        queryFn: async () => {
            if (!showScreenshots) return null;
            const res = await axios.get(`${API_BASE}/applications/${showScreenshots}/logs`);
            return res.data;
        },
        enabled: !!showScreenshots
    });

    const submitNow = async (id: number) => {
        setSubmittingId(id);
        setSubmissionStep('Initializing Autopilot...');
        setCaptchaEvent(null);
        setTimeLeft(300);

        await axios.post(`${API_BASE}/applications/${id}/submit`);

        const ws = new WebSocket(`ws://localhost:8000/applications/ws/${id}`);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'CAPTCHA_REQUIRED') {
                setCaptchaEvent(data);
            } else if (data.step === 'Finished') {
                setSubmissionStep(`Submission ${data.result === 'submitted' ? 'Successful' : 'Failed'}`);
                setTimeout(() => {
                    if (data.result === 'submitted') setSubmittingId(null);
                }, 3000);
                queryClient.invalidateQueries({ queryKey: ['applications'] });
            } else {
                setSubmissionStep(data.message || data.step);
            }
        };
    };

    const approveMutation = useMutation({
        mutationFn: (id: number) => axios.patch(`${API_BASE}/applications/${id}/status`, { status: "APPLIED" }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
    });

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (isLoading) return <PageSkeleton rows={3} />;
    if (error) throw error;

    const queueApps = apps?.filter((a: any) => a.status === 'QUEUE') || [];

    return (
        <div className="p-10 space-y-10 max-w-[1600px] mx-auto pb-32 overflow-y-auto h-screen custom-scrollbar text-white">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <h1 className="text-5xl font-black font-display tracking-tighter italic uppercase">Review Queue</h1>
                <p className="text-gray-400 font-medium font-display italic mt-2">Human-in-the-loop validation for AI-tailored applications.</p>
            </motion.div>

            <div className="space-y-10">
                {queueApps.length === 0 ? (
                    <div className="text-center py-32 flex flex-col items-center gap-6 bg-white/[0.02] border border-white/5 border-dashed rounded-[3rem]">
                        <div className="text-7xl opacity-50">📑</div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter">Queue is empty</h3>
                            <p className="text-gray-500 max-w-sm mx-auto font-medium leading-relaxed font-display italic">
                                Your mission queue is currently clear. Head to the discovery feed to draft your next application.
                            </p>
                        </div>
                        <a
                            href="/jobs"
                            className="px-12 py-5 bg-accent-blue text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center gap-3"
                        >
                            GO TO DISCOVERY <ArrowRight size={16} />
                        </a>
                    </div>
                ) : (
                    queueApps.map((app: any, idx: number) => (
                        <motion.div
                            key={app.id}
                            layout
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass-card overflow-hidden border-l-4 border-l-accent-blue relative group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 blur-3xl -mr-16 -mt-16 group-hover:bg-accent-blue/15 transition-all duration-700"></div>

                            <div className="bg-white/[0.02] p-8 flex justify-between items-center border-b border-white/5 relative z-10">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-black text-2xl tracking-tight uppercase italic">{app.job.title}</h3>
                                        {app.job.country === 'FR' && (
                                            <span className="flex items-center gap-1.5 text-[8px] font-black text-accent-blue border border-accent-blue/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                <Sparkles size={8} /> Primary Target
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        <span className="text-accent-blue">{app.job.company}</span>
                                        <span className="h-1 w-1 bg-white/10 rounded-full"></span>
                                        <span>{app.job.location}</span>
                                        <span className="h-1 w-1 bg-white/10 rounded-full"></span>
                                        <span className="text-accent-green">Match {app.job.match_score || '0'}%</span>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => approveMutation.mutate(app.id)}
                                        className="px-6 py-4 border border-white/10 hover:bg-white/5 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all text-gray-400 hover:text-white"
                                    >
                                        <Check size={16} className="text-accent-green" /> Skip Local and Mark Applied
                                    </button>
                                    <button
                                        onClick={() => submitNow(app.id)}
                                        className="bg-accent-blue text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                    >
                                        <Loader2 size={16} className="animate-spin-slow" /> Deploy Autopilot
                                    </button>
                                </div>
                            </div>

                            <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 bg-black/40">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2 text-accent-blue">
                                            <FileText size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Targeted Resume</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest italic font-display">Optimization 98%</span>
                                    </div>
                                    <div className="bg-[#0A0A0B] p-8 rounded-3xl border border-white/5 text-xs font-mono leading-relaxed h-[500px] overflow-auto whitespace-pre-wrap text-gray-400 shadow-inner custom-scrollbar selection:bg-accent-blue selection:text-white">
                                        {app.tailored_resume}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2 text-accent-amber">
                                            <Wand2 size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest italic font-display">Lettre de Motivation</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest italic font-display">Français (France)</span>
                                    </div>
                                    <div className="bg-[#0A0A0B] p-8 rounded-3xl border border-white/5 text-xs font-mono leading-relaxed h-[500px] overflow-auto whitespace-pre-wrap text-gray-500 italic shadow-inner custom-scrollbar selection:bg-accent-amber selection:text-white">
                                        {app.cover_letter}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/5">
                                <button
                                    onClick={() => setShowScreenshots(showScreenshots === app.id ? null : app.id)}
                                    className="w-full p-6 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white hover:bg-white/[0.02] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Camera size={16} className="text-accent-blue" /> SUBMISSION AUDIT TRAIL {logs?.screenshot_paths?.length > 0 && <span className="text-accent-blue ml-2 italic">({logs.screenshot_paths.length} CAPTURES)</span>}
                                    </div>
                                    {showScreenshots === app.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                <AnimatePresence>
                                    {showScreenshots === app.id && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: 'auto' }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden bg-[#0A0A0B]"
                                        >
                                            <div className="p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                                {logs?.screenshot_paths?.length > 0 ? (
                                                    logs.screenshot_paths.map((path: string, idx: number) => (
                                                        <motion.div
                                                            key={idx}
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                            className="group relative aspect-video rounded-2xl overflow-hidden border border-white/5 hover:border-accent-blue transition-all cursor-zoom-in"
                                                        >
                                                            <img
                                                                src={`${API_BASE}/${path}`}
                                                                className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity"
                                                                alt={`Audit Frame ${idx}`}
                                                                onError={(e: any) => e.target.style.display = 'none'}
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                                                <span className="text-[8px] font-black text-white uppercase tracking-widest">Audit Frame {idx + 1}</span>
                                                            </div>
                                                        </motion.div>
                                                    ))
                                                ) : (
                                                    <div className="col-span-full py-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-600 italic">
                                                        The submission sequence has not been initialized for this application.
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {submittingId && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[100] flex items-center justify-center p-12"
                    >
                        <div className="glass-card max-w-2xl w-full p-16 text-center space-y-10 relative overflow-hidden border border-white/10">
                            {!captchaEvent ? (
                                <>
                                    <div className="relative">
                                        <div className="w-24 h-24 border-t-2 border-b-2 border-accent-blue rounded-full animate-spin mx-auto" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-12 h-12 bg-accent-blue/10 rounded-full animate-pulse blur-xl" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h2 className="text-4xl font-black font-display tracking-tight uppercase italic">Autopilot Live</h2>
                                        <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 mx-auto w-fit">
                                            <p className="text-accent-blue font-mono text-xs font-black tracking-widest uppercase">{submissionStep}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 justify-center">
                                        <div className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse"></div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 italic font-display">Cryptographic Handshake Verified</span>
                                    </div>
                                </>
                            ) : (
                                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="space-y-10">
                                    <div className="flex flex-col items-center gap-4">
                                        <ShieldAlert size={48} className="text-red-500 animate-pulse" />
                                        <h2 className="text-4xl font-black uppercase italic tracking-tighter text-red-500">Manual Override Required</h2>
                                    </div>

                                    <p className="text-gray-400 font-medium font-display italic leading-relaxed">
                                        A secure browser instance has opened on your host system. <br />
                                        Solve the CAPTCHA to allow the agent to finalize the mission.
                                    </p>

                                    <div className="space-y-6 bg-white/[0.02] p-8 rounded-[2rem] border border-white/5">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Time to Timeout</span>
                                            <span className="text-2xl font-black font-mono text-accent-amber">{formatTime(timeLeft)}</span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-accent-amber"
                                                initial={{ width: '100%' }}
                                                animate={{ width: `${(timeLeft / 300) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSubmittingId(null)}
                                        className="w-full py-5 text-[10px] font-black uppercase tracking-widest border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all rounded-2xl"
                                    >
                                        ABORT MISSION
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
