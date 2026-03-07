import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { User, Save, Upload, Sparkles, Wand2, ShieldCheck, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import PageSkeleton from '../components/PageSkeleton';

const API_BASE = 'http://localhost:8000';

export default function ProfilePage() {
    const queryClient = useQueryClient();
    const [formData, setFormData] = React.useState({
        full_name: '',
        email: '',
        preferences: { min_match_score: 70, target_countries: ['FR', 'UK', 'DE', 'NL'] }
    });

    const { data: profile, isLoading, error } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/profile/`);
            return res.data;
        }
    });

    React.useEffect(() => {
        if (profile && profile.full_name) {
            setFormData({
                full_name: profile.full_name,
                email: profile.email,
                preferences: {
                    target_countries: profile.preferences?.target_countries || ['FR', 'UK', 'DE', 'NL'],
                    min_match_score: profile.preferences?.min_match_score || 70
                }
            });
        }
    }, [profile]);

    const setupMutation = useMutation({
        mutationFn: (data: any) => axios.post(`${API_BASE}/profile/setup`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            alert("Mission identity updated!");
        }
    });

    const uploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const form = new FormData();
        form.append('file', file);
        await axios.post(`${API_BASE}/profile/upload-resume`, form);
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        alert("Master Intelligence Source Uploaded");
    };

    if (isLoading) return <PageSkeleton rows={3} />;
    if (error) throw error;

    return (
        <div className="p-10 space-y-12 max-w-[1200px] mx-auto pb-32 overflow-y-auto h-screen custom-scrollbar text-white">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <h1 className="text-5xl font-black font-display tracking-tighter italic uppercase">Agent Identity</h1>
                <p className="text-gray-400 font-medium font-display italic mt-2">Configure target parameters and intelligence sources.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
                <div className="md:col-span-3 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card p-10 space-y-8 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 blur-3xl -mr-16 -mt-16"></div>

                        <div className="flex items-center gap-4 text-accent-blue mb-2">
                            <User size={24} />
                            <h3 className="text-xl font-black italic uppercase tracking-tighter">Candidate Credentials</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Full Identity</label>
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold placeholder-gray-700 outline-none focus:border-accent-blue transition-all shadow-inner"
                                    placeholder="Daakshayani Senthilkumar"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Communication Channel</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold placeholder-gray-700 outline-none focus:border-accent-blue transition-all shadow-inner"
                                    placeholder="daakshayanidaakshayani@gmail.com"
                                />
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 space-y-6">
                            <div className="flex items-center gap-3 text-accent-amber">
                                <Target size={20} />
                                <h3 className="text-xl font-black italic uppercase tracking-tighter">Mission Parameters</h3>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">Active Territories</label>
                                <div className="flex flex-wrap gap-3">
                                    {['FR', 'US', 'UK', 'DE', 'NL', 'CA', 'AU'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => {
                                                const countries = formData.preferences?.target_countries || [];
                                                const next = countries.includes(c)
                                                    ? countries.filter(x => x !== c)
                                                    : [...countries, c];
                                                setFormData({ ...formData, preferences: { ...formData.preferences, target_countries: next } });
                                            }}
                                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic ${(formData.preferences?.target_countries || []).includes(c)
                                                ? 'bg-accent-blue text-white shadow-lg shadow-blue-500/20'
                                                : 'bg-white/5 text-gray-500 hover:bg-white/10'
                                                }`}
                                        >
                                            {c === 'FR' ? '🇫🇷 primary' : c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setupMutation.mutate(formData)}
                            className="w-full bg-accent-blue text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                        >
                            <Save size={18} /> Update Manifest
                        </button>
                    </motion.div>
                </div>

                <div className="md:col-span-2 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-10 space-y-10 border-l-4 border-l-accent-amber relative overflow-hidden"
                    >
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent-amber/5 blur-3xl -mr-16 -mb-16"></div>

                        <div className="flex items-center gap-4 text-accent-amber">
                            <Upload size={24} />
                            <h3 className="text-xl font-black italic uppercase tracking-tighter">Master Intelligence</h3>
                        </div>

                        <p className="text-gray-500 text-xs font-medium leading-relaxed font-display italic">
                            Your master resume is the core training source for document tailoring. Keep it updated with latest metrics and publications.
                        </p>

                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[2.5rem] p-12 hover:bg-white/[0.02] transition-all cursor-pointer relative group">
                            <input
                                type="file"
                                onChange={uploadResume}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-20 h-20 bg-accent-amber/10 rounded-3xl flex items-center justify-center text-accent-amber mb-6 group-hover:scale-110 transition-transform shadow-inner">
                                <Wand2 size={40} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest text-center">UPLOAD MASTER PDF</p>
                            <p className="text-[10px] text-gray-600 mt-2 font-bold uppercase tracking-tight">Vite-ready analysis v2.4</p>
                        </div>

                        {profile?.master_resume && (
                            <div className="p-6 bg-[#0A0A0B] border border-white/5 rounded-2xl space-y-4">
                                <div className="flex items-center gap-2 text-accent-green text-[10px] font-black uppercase tracking-widest">
                                    <ShieldCheck size={14} /> ACTIVE SOURCE SYNCED
                                </div>
                                <div className="text-[9px] font-mono text-gray-600 line-clamp-3 leading-loose italic">
                                    {profile.master_resume}
                                </div>
                            </div>
                        )}
                    </motion.div>

                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-accent-blue">
                            <Sparkles size={24} />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest">AI Customization v4</h4>
                        <p className="text-[10px] text-gray-600 font-medium font-display italic leading-relaxed">
                            Agent automatically applies 15% score boost to FR targets and translates documents to formal FR (Vous).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
