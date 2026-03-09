import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
    Download, Share2, CheckCircle2, AlertTriangle,
    ArrowLeft, Brain, Code, UserCheck, MessageSquare,
    Globe, Euro, Terminal, ShieldCheck, Mail, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageSkeleton from '../components/PageSkeleton';

const API_BASE = 'http://localhost:8000';

export default function InterviewPrep() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('company');
    const [practiced, setPracticed] = useState<Set<string>>(new Set());

    const { data: prep, isLoading, error, refetch } = useQuery({
        queryKey: ['interview-prep', id],
        queryFn: async () => {
            if (!id) return null;
            const res = await axios.get(`${API_BASE}/applications/${id}/prep`);
            return res.data;
        },
        enabled: !!id
    });

    const triggerManualPrep = useMutation({
        mutationFn: async () => {
            // Get first application in INTERVIEW status to test
            const appsRes = await axios.get(`${API_BASE}/applications/`);
            const interviewApps = appsRes.data.filter((a: any) => a.status === 'INTERVIEW');
            if (interviewApps.length === 0) {
                alert("No applications in INTERVIEW status found. Move one in Kanban first!");
                return;
            }
            const appId = interviewApps[0].id;
            await axios.post(`${API_BASE}/applications/${appId}/prep`);
            navigate(`/interview-prep/${appId}`);
        }
    });

    if (isLoading) return <PageSkeleton rows={3} />;

    // Empty State for /interview-prep (no ID) or if prep is null
    if (!id || (!prep && !isLoading)) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-16 max-w-4xl mx-auto">
                <div className="text-7xl mb-8 animate-bounce">🎯</div>
                <h2 className="text-4xl font-black text-white mb-4 uppercase italic tracking-tighter">
                    Mission Intelligence: Interview Prep
                </h2>
                <p className="text-gray-400 max-w-lg mb-10 leading-relaxed font-medium">
                    When the email monitor detects an interview request, your AI-generated prep sheet will appear here automatically — complete with company research, technical questions, and French culture tips.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">
                    {[
                        { icon: <Mail className="text-accent-blue" />, step: "1", text: "Interview email detected" },
                        { icon: <Brain className="text-accent-purple" />, step: "2", text: "AI generates prep sheet" },
                        { icon: <Zap className="text-accent-amber" />, step: "3", text: "Ready for your mission" }
                    ].map(item => (
                        <div key={item.step} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 text-center space-y-4">
                            <div className="flex justify-center">{item.icon}</div>
                            <div className="text-[10px] text-accent-blue font-black tracking-widest uppercase">STEP {item.step}</div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-tight">{item.text}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-16 p-8 bg-white/[0.02] border border-white/5 border-dashed rounded-[2.5rem] w-full">
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-6">
                        Debug Mode: Test the Intelligence Engine
                    </p>
                    <button
                        onClick={() => triggerManualPrep.mutate()}
                        disabled={triggerManualPrep.isPending}
                        className="px-10 py-4 bg-[#2D1B69] text-accent-blue border border-accent-blue/30 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-[#3D2B79] transition-all flex items-center gap-3 mx-auto shadow-lg shadow-purple-500/10 disabled:opacity-50"
                    >
                        {triggerManualPrep.isPending ? 'DEPLOYING AI...' : '🧪 Generate Test Prep Sheet'}
                    </button>
                </div>
            </div>
        );
    }

    if (error || prep?.error) {
        return (
            <div className="p-20 text-center space-y-6">
                <AlertTriangle size={64} className="mx-auto text-red-500/50" />
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">System Error</h1>
                <p className="text-gray-500 max-w-sm mx-auto">The prep sheet for this mission could not be retrieved.</p>
                <button onClick={() => navigate(-1)} className="px-8 py-3 bg-white/5 rounded-xl text-accent-blue font-black uppercase text-xs tracking-widest">← Return to Base</button>
            </div>
        );
    }

    const togglePracticed = (q: string) => {
        const next = new Set(practiced);
        if (next.has(q)) next.delete(q);
        else next.add(q);
        setPracticed(next);
    };

    const tabs = [
        { id: 'company', label: 'Company', icon: <Globe size={18} /> },
        { id: 'technical', label: 'Technical', icon: <Terminal size={18} /> },
        { id: 'behavioral', label: 'Behavioral', icon: <UserCheck size={18} /> },
        { id: 'projects', label: 'Projects', icon: <Code size={18} /> },
        { id: 'questions', label: 'Ask Them', icon: <MessageSquare size={18} /> },
        { id: 'french', label: 'French Tips', icon: <span>🇫🇷</span> },
        { id: 'deep', label: 'Deep Strategy', icon: <ShieldCheck size={18} /> },
        { id: 'salary', label: 'Salary', icon: <Euro size={18} /> },
    ];

    return (
        <div className="p-10 max-w-[1200px] mx-auto space-y-10 pb-32 text-white">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="p-3 hover:bg-white/5 rounded-2xl transition-all">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-4">
                    <button className="glass-card px-6 py-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                        <Download size={14} /> PDF
                    </button>
                    <button className="bg-accent-blue text-white px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
                        <Share2 size={14} /> Telegram
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <span className="bg-accent-blue/10 text-accent-blue px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-accent-blue/20">
                        Interview Mode Active
                    </span>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        AI Generated Prep
                    </span>
                </div>
                <h1 className="text-6xl font-black font-display italic uppercase tracking-tighter leading-none">
                    {prep.company_overview?.why_they_hired ? 'Mission strategy' : 'Interview Prep'}
                </h1>
                <p className="text-2xl text-gray-400 font-medium font-display italic">Target: Daakshayani Senthilkumar</p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar border-b border-white/5">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-black italic uppercase tracking-tight transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-white text-black scale-105 shadow-xl'
                            : 'text-gray-500 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                >
                    {activeTab === 'company' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="glass-card p-8 space-y-6">
                                <h3 className="text-xl font-black italic uppercase tracking-tighter text-accent-blue">What they do</h3>
                                <p className="text-gray-400 leading-relaxed font-medium">{prep.company_overview.what_they_do}</p>
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Tech Stack</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {prep.company_overview.tech_stack?.map((t: string) => (
                                            <span key={t} className="bg-white/5 px-3 py-1.5 rounded-lg text-xs font-bold">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="glass-card p-8 space-y-6">
                                <h3 className="text-xl font-black italic uppercase tracking-tighter text-accent-green">Strategy</h3>
                                <p className="text-gray-400 leading-relaxed font-medium">{prep.company_overview.why_they_hired}</p>
                                <div className="p-4 bg-accent-green/5 border border-accent-green/10 rounded-2xl">
                                    <div className="flex items-center gap-2 text-accent-green font-black uppercase text-[10px] mb-2 tracking-widest">
                                        <ShieldCheck size={14} /> Context
                                    </div>
                                    <p className="text-xs text-accent-green/80 font-bold italic">{prep.company_overview.recent_news}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'technical' && (
                        <div className="space-y-4">
                            {prep.likely_technical_questions.map((q: any, i: number) => (
                                <div key={i} className="glass-card overflow-hidden group">
                                    <div className="p-6 flex items-start gap-6">
                                        <button
                                            onClick={() => togglePracticed(q.question)}
                                            className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all flex-shrink-0 ${practiced.has(q.question)
                                                ? 'bg-accent-green border-accent-green text-white scale-90'
                                                : 'border-white/10 text-gray-600 hover:border-accent-blue hover:text-accent-blue'
                                                }`}
                                        >
                                            <CheckCircle2 size={24} />
                                        </button>
                                        <div className="flex-1 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-lg font-black italic uppercase tracking-tight">{q.question}</h4>
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${q.difficulty === 'hard' ? 'bg-red-500/20 text-red-500' :
                                                    q.difficulty === 'medium' ? 'bg-accent-amber/20 text-accent-amber' : 'bg-accent-green/20 text-accent-green'
                                                    }`}>
                                                    {q.difficulty}
                                                </span>
                                            </div>
                                            <div className="space-y-4 pt-4 border-t border-white/5 group-hover:block transition-all duration-500">
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black text-accent-blue uppercase tracking-widest">Why they ask</span>
                                                    <p className="text-sm text-gray-500 italic font-medium">{q.why_theyll_ask}</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-[10px] font-black text-accent-green uppercase tracking-widest">Suggested Answer</span>
                                                    <p className="text-sm text-white font-medium bg-white/5 p-4 rounded-xl leading-relaxed">{q.suggested_answer}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'behavioral' && (
                        <div className="space-y-6">
                            {prep.likely_behavioral_questions.map((q: any, i: number) => (
                                <div key={i} className="glass-card p-8 space-y-6">
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter">{q.question}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        {['situation', 'task', 'action', 'result'].map(step => (
                                            <div key={step} className="space-y-2">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">{step}</span>
                                                <p className="text-sm text-white font-medium leading-relaxed">{q.star_answer[step]}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'projects' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {prep.projects_to_highlight.map((p: any, i: number) => (
                                <div key={i} className="glass-card p-8 space-y-4">
                                    <div className="w-12 h-12 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue">
                                        <Code size={24} />
                                    </div>
                                    <h3 className="text-lg font-black italic uppercase tracking-tight">{p.project}</h3>
                                    <p className="text-xs text-accent-blue font-black uppercase tracking-widest">{p.why_relevant}</p>
                                    <ul className="space-y-2 pt-4 border-t border-white/5">
                                        {p.talking_points.map((pt: string, j: number) => (
                                            <li key={j} className="text-sm text-gray-400 font-medium flex gap-2">
                                                <span className="text-accent-green">→</span> {pt}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'questions' && (
                        <div className="glass-card p-8 space-y-6">
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-accent-amber">Questions to Ask Them</h3>
                            <div className="space-y-4">
                                {prep.questions_to_ask_them.map((q: string, i: number) => (
                                    <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 flex gap-4 items-center font-medium">
                                        <div className="w-8 h-8 rounded-lg bg-accent-amber/10 text-accent-amber flex items-center justify-center text-xs font-black italic flex-shrink-0">{i + 1}</div>
                                        <p>{q}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'french' && prep.french_specific_tips && (
                        <div className="glass-card p-8 space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                                    <span>🇫🇷</span> French Cultural Tips
                                </h3>
                                <p className="text-gray-400 font-medium italic leading-relaxed">{prep.french_specific_tips.language_note}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <ul className="space-y-4">
                                    {prep.french_specific_tips.cultural_tips.map((t: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-sm font-bold items-start leading-relaxed">
                                            <div className="p-1.5 bg-accent-blue/10 text-accent-blue rounded-lg mt-0.5 flex-shrink-0"><CheckCircle2 size={12} /></div>
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                                <div className="bg-[#2D1B69]/20 border border-accent-blue/30 rounded-3xl p-6 space-y-4">
                                    <div className="flex items-center gap-2 text-accent-blue font-black uppercase text-[10px] tracking-widest">
                                        <Brain size={16} /> Key Talking Point
                                    </div>
                                    <p className="text-sm font-bold italic leading-relaxed">{prep.french_specific_tips.eu_ai_act_relevance}</p>
                                    {prep.french_specific_tips.mention_choose_france && (
                                        <div className="p-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-2">
                                            🇫🇷 Mention "Choose France Tour"
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'deep' && prep.deep_tier_intelligence && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="glass-card p-8 space-y-6">
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-accent-purple">Competitor Analysis</h3>
                                    <p className="text-gray-400 font-medium leading-relaxed">{prep.deep_tier_intelligence.competitor_analysis.market_position}</p>
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Main Rivals</span>
                                        <div className="flex flex-wrap gap-2">
                                            {prep.deep_tier_intelligence.competitor_analysis.main_rivals?.map((r: string) => (
                                                <span key={r} className="bg-white/5 px-3 py-1.5 rounded-lg text-[10px] font-bold">{r}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card p-8 space-y-6">
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-accent-amber">Negotiation Script</h3>
                                    <div className="space-y-4">
                                        {prep.deep_tier_intelligence.negotiation_strategy.script_lines?.map((s: string, i: number) => (
                                            <div key={i} className="p-4 bg-accent-amber/5 border border-accent-amber/10 rounded-2xl text-sm italic font-medium leading-relaxed">
                                                "{s}"
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-8 space-y-8">
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-accent-blue flex items-center gap-3">
                                    <Terminal size={24} /> Mock Interview Simulator
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {prep.deep_tier_intelligence.mock_interview_simulator?.map((s: any, i: number) => (
                                        <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 space-y-4 hover:border-accent-blue/50 transition-all cursor-pointer group">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase text-accent-blue tracking-widest">Scenario {i + 1}</span>
                                                <Zap size={14} className="text-accent-blue group-hover:animate-pulse" />
                                            </div>
                                            <p className="text-sm font-bold leading-relaxed italic text-white/90">"{s.scenario}"</p>
                                            <div className="pt-6 mt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-gray-500">LVL: {s.difficulty_level}</span>
                                                <button className="text-accent-blue hover:text-white transition-colors">Start Simulator →</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'salary' && (
                        <div className="glass-card p-12 flex flex-col items-center gap-8 justify-center min-h-[400px]">
                            <div className="w-20 h-20 bg-accent-green/10 text-accent-green rounded-full flex items-center justify-center">
                                <Euro size={40} />
                            </div>
                            <div className="text-center space-y-2">
                                <div className="text-5xl font-black font-display italic uppercase tracking-tighter">{prep.salary_guidance.expected_range}</div>
                                <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Expected Annual Package</p>
                            </div>
                            <div className="flex gap-8 items-center text-sm font-black uppercase tracking-widest italic text-gray-500">
                                <span>{prep.salary_guidance.vie_rate}</span>
                                <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                                <span>{prep.salary_guidance.when_to_discuss}</span>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
