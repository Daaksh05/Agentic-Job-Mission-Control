import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { Mail, Copy, ExternalLink, Calendar, CheckCircle2, AlertCircle, X, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageSkeleton from '../components/PageSkeleton';
import BackendErrorState from '../components/BackendErrorState';

const API_BASE = 'http://localhost:8000';
const COLUMNS = ['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];

export default function KanbanPage() {
    const queryClient = useQueryClient();
    const [selectedApp, setSelectedApp] = React.useState<any>(null);
    const [copied, setCopied] = React.useState(false);

    const { data: apps, isLoading, error, isError, refetch } = useQuery({
        queryKey: ['applications'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/applications/`, { timeout: 10000 });
            return res.data || [];
        },
        retry: 1,
        staleTime: 30 * 1000
    });

    const updateStatus = useMutation({
        mutationFn: ({ id, status, follow_up_sent }: any) =>
            axios.patch(`${API_BASE}/applications/${id}/status`, null, {
                params: {
                    status,
                    follow_up_sent: follow_up_sent !== undefined ? follow_up_sent : undefined
                }
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applications'] });
            setCopied(false);
        },
    });

    const getFollowUpDraft = (app: any) => {
        const isFR = app.job.country === 'FR';
        const date = new Date(app.applied_at || app.updated_at).toLocaleDateString();

        if (isFR) {
            return {
                subject: `Suivi de ma candidature — ${app.job.title}`,
                body: `Objet : Suivi de ma candidature — ${app.job.title}\n\nMadame, Monsieur,\n\nJe me permets de revenir vers vous concernant ma candidature au poste de ${app.job.title}, déposée le ${date}.\n\nToujours très motivé(e) par cette opportunité et par les projets de ${app.job.company}, je souhaitais m'assurer que mon dossier avait bien été reçu.\n\nJe reste disponible pour tout entretien.\n\nVeuillez agréer, Madame/Monsieur, l'expression de mes salutations distinguées.\n\nCordialement.`
            };
        } else {
            return {
                subject: `Following up — ${app.job.title} Application`,
                body: `Subject: Following up — ${app.job.title} Application\n\nHi Hiring Team,\n\nI wanted to follow up on my application for the ${app.job.title} role submitted on ${date}.\n\nI remain very interested in the position and would welcome the chance to discuss further.\n\nHappy to provide any additional information.\n\nBest regards.`
            };
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGmail = (app: any) => {
        const draft = getFollowUpDraft(app);
        const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
        window.open(url, '_blank');
        updateStatus.mutate({ id: app.id, status: app.status, follow_up_sent: 1 });
        setSelectedApp(null);
    };

    const isOld = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        return diff > 7 * 24 * 60 * 60 * 1000;
    };

    if (isLoading) return <PageSkeleton rows={4} />;
    if (isError) return <BackendErrorState error={error} refetch={() => refetch()} />;

    if (!apps || apps.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-16">
                <div className="text-6xl mb-6">📋</div>
                <h2 className="text-2xl font-black text-white mb-3 uppercase italic tracking-tighter">
                    Mission Pipeline Empty
                </h2>
                <p className="text-gray-400 max-w-md mb-8 leading-relaxed font-medium">
                    Your application pipeline will appear here once you approve and submit your first application from the Review Queue.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl mt-4">
                    {COLUMNS.map(col => (
                        <div key={col} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 min-h-48 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-black uppercase tracking-widest text-gray-500">
                                    {col}
                                </span>
                                <span className="bg-white/5 text-gray-500 text-[10px] font-black px-2.5 py-1 rounded-full">0</span>
                            </div>
                            <div className="flex-1 border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center">
                                <span className="text-gray-700 text-[10px] font-black uppercase tracking-widest">Empty</span>
                            </div>
                        </div>
                    ))}
                </div>

                <NavLink
                    to="/queue"
                    className="mt-12 px-8 py-4 bg-accent-blue text-white rounded-2xl text-sm font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                >
                    → Go to Review Queue
                </NavLink>
            </div>
        );
    }

    return (
        <div className="p-10 h-screen flex flex-col gap-8 max-w-[1800px] mx-auto overflow-hidden">
            <div className="flex justify-between items-center text-white">
                <div>
                    <h1 className="text-4xl font-black font-display italic uppercase tracking-tighter">Mission Pipeline</h1>
                    <p className="text-gray-500 font-medium">Manage your active applications and track mission progress.</p>
                </div>
            </div>

            <div className="flex-1 flex gap-8 overflow-x-auto pb-10 custom-scrollbar">
                {COLUMNS.map(column => (
                    <div key={column} className="w-80 flex-shrink-0 flex flex-col gap-4">
                        <div className="flex justify-between items-center px-4 text-white">
                            <h3 className="font-black text-xs uppercase tracking-[0.3em] text-gray-500">
                                {column}
                            </h3>
                            <span className="bg-white/5 border border-white/5 text-[10px] font-black px-2.5 py-1 rounded-full text-gray-400">
                                {apps?.filter((a: any) => a.status === column).length || 0}
                            </span>
                        </div>

                        <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[2rem] p-4 space-y-4 overflow-y-auto shadow-inner">
                            {apps?.filter((a: any) => a.status === column).map((app: any) => {
                                const needsFollowUp = column === 'APPLIED' && isOld(app.applied_at || app.updated_at) && !app.follow_up_sent;

                                return (
                                    <motion.div
                                        key={app.id}
                                        layoutId={String(app.id)}
                                        className={`glass-card p-5 space-y-4 group relative overflow-hidden border-l-2 text-white ${column === 'OFFER' ? 'border-l-accent-green bg-accent-green/5' :
                                            column === 'INTERVIEW' ? 'border-l-accent-amber animate-glow-amber' :
                                                'border-l-accent-blue'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <h4 className="font-black text-sm tracking-tight leading-none uppercase group-hover:text-accent-blue transition-colors">
                                                    {app.job.title}
                                                </h4>
                                                <p className="text-accent-blue/80 text-[10px] font-black tracking-widest uppercase">{app.job.company}</p>
                                            </div>
                                            {app.sub_status && (
                                                <div className="bg-accent-amber/10 text-accent-amber px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border border-accent-amber/20 flex items-center gap-1">
                                                    <AlertCircle size={10} /> {app.sub_status}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} /> {new Date(app.updated_at).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {app.job.country === 'FR' ? '🇫🇷 PARIS' : '🌐 REMOTE'}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                                            {column === 'INTERVIEW' && (
                                                <NavLink
                                                    to={`/interview-prep/${app.id}`}
                                                    className="w-full bg-[#2D1B69] text-accent-blue border border-accent-blue/30 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#3D2B79] transition-all"
                                                >
                                                    <Brain size={14} /> Prepare Sheet
                                                </NavLink>
                                            )}

                                            <div className="flex justify-between items-center">
                                                <select
                                                    value={app.status}
                                                    onChange={(e) => updateStatus.mutate({ id: app.id, status: e.target.value })}
                                                    className="bg-background text-[10px] font-black uppercase tracking-widest p-1.5 rounded-lg border border-white/5 text-gray-400 outline-none focus:border-accent-blue"
                                                >
                                                    {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>

                                                {needsFollowUp ? (
                                                    <button
                                                        onClick={() => setSelectedApp(app)}
                                                        className="flex items-center gap-1.5 text-accent-amber font-black text-[10px] uppercase tracking-widest hover:brightness-125 transition-all animate-pulse"
                                                    >
                                                        <Mail size={12} /> Follow Up
                                                    </button>
                                                ) : app.follow_up_sent ? (
                                                    <div className="text-accent-green font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
                                                        <CheckCircle2 size={12} /> SENT
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Follow Up Modal */}
            <AnimatePresence>
                {selectedApp && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="glass-card max-w-2xl w-full p-10 space-y-8 relative overflow-hidden text-white"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-amber/10 blur-3xl -mr-16 -mt-16"></div>

                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-accent-amber font-black text-xs uppercase tracking-[0.3em]">
                                        <AlertCircle size={14} /> Mission Delayed
                                    </div>
                                    <h2 className="text-3xl font-black font-display uppercase italic tracking-tight">Generate Follow-up</h2>
                                </div>
                                <button onClick={() => setSelectedApp(null)} className="text-gray-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">
                                    <span>Subject: {getFollowUpDraft(selectedApp).subject}</span>
                                    <span className="text-accent-blue italic">{selectedApp.job.country === 'FR' ? 'FRENCH FORMAL' : 'ENGLISH PROFESSIONAL'}</span>
                                </div>
                                <div className="bg-background/50 p-6 rounded-2xl border border-white/5 font-mono text-xs leading-relaxed text-gray-300 shadow-inner max-h-80 overflow-auto whitespace-pre-wrap">
                                    {getFollowUpDraft(selectedApp).body}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleCopy(getFollowUpDraft(selectedApp).body)}
                                    className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/5 border border-white/10 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all group"
                                >
                                    {copied ? <CheckCircle2 className="text-accent-green" size={18} /> : <Copy size={18} className="group-hover:text-accent-blue" />}
                                    {copied ? 'COPIED TO CLIPBOARD' : 'COPY CONTENT'}
                                </button>
                                <button
                                    onClick={() => handleGmail(selectedApp)}
                                    className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-accent-blue text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                                >
                                    <Mail size={18} /> OPEN IN GMAIL <ExternalLink size={14} />
                                </button>
                            </div>

                            <p className="text-center text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                                Status will be marked as "Follow-up Sent" after opening Gmail or copying.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
