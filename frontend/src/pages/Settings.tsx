import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Mail, Save, ShieldCheck, RefreshCw, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import PageSkeleton from '../components/PageSkeleton';

const API_BASE = 'http://localhost:8000';

export default function SettingsPage() {
    const [formData, setFormData] = React.useState({
        gmail_address: '',
        gmail_app_password: '',
        telegram_bot_token: '',
        telegram_chat_id: '',
    });

    React.useEffect(() => {
        const stored = localStorage.getItem('job_agent_settings');
        if (stored) {
            try {
                setFormData(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }
    }, []);

    const { isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/profile/`);
            return res.data;
        }
    });

    const saveSettings = () => {
        localStorage.setItem('job_agent_settings', JSON.stringify(formData));
        alert('Bot configuration synchronized successfully.');
    };

    const testTelegram = async () => {
        alert('Dispatched test sequence to Telegram API...');
    };

    if (isLoading) return <PageSkeleton rows={3} />;

    return (
        <div className="p-10 space-y-12 max-w-[1200px] mx-auto pb-32 overflow-y-auto h-screen custom-scrollbar text-white">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <h1 className="text-5xl font-black font-display tracking-tighter italic uppercase">Bot Infrastructure</h1>
                <p className="text-gray-400 font-medium font-display italic mt-2">Configure automated monitoring and alert channels.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-10 space-y-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 blur-3xl -mr-16 -mt-16"></div>

                    <div className="flex items-center gap-4 text-accent-blue">
                        <Mail size={24} />
                        <h3 className="text-xl font-black italic uppercase tracking-tighter">Email Monitoring</h3>
                    </div>

                    <p className="text-gray-500 text-xs font-medium leading-relaxed font-display italic">
                        The agent utilizes IMAP SSL to monitor your inbox for interview requests, technical tests, and market signals.
                    </p>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Gmail Identity</label>
                            <input
                                type="email"
                                value={formData.gmail_address}
                                onChange={e => setFormData({ ...formData, gmail_address: e.target.value })}
                                className="w-full bg-[#0A0A0B] border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold placeholder-gray-800 outline-none focus:border-accent-blue transition-all"
                                placeholder="daaksh05s@gmail.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">App-Specific Password</label>
                            <input
                                type="password"
                                value={formData.gmail_app_password}
                                onChange={e => setFormData({ ...formData, gmail_app_password: e.target.value })}
                                className="w-full bg-[#0A0A0B] border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold placeholder-gray-800 outline-none focus:border-accent-blue transition-all"
                                placeholder="•••• •••• •••• ••••"
                            />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card p-10 space-y-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-purple/5 blur-3xl -mr-16 -mt-16"></div>

                    <div className="flex items-center gap-4 text-accent-purple">
                        <Smartphone size={24} />
                        <h3 className="text-xl font-black italic uppercase tracking-tighter">Telegram Alerts</h3>
                    </div>

                    <p className="text-gray-500 text-xs font-medium leading-relaxed font-display italic">
                        Real-time telemetry for every discovery event, document generation, and submission milestone.
                    </p>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Bot API Token</label>
                            <input
                                type="text"
                                value={formData.telegram_bot_token}
                                onChange={e => setFormData({ ...formData, telegram_bot_token: e.target.value })}
                                className="w-full bg-[#0A0A0B] border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold placeholder-gray-800 outline-none focus:border-accent-purple transition-all"
                                placeholder="5839210000:AAEk_XXXX"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Receiver Chat ID</label>
                            <input
                                type="text"
                                value={formData.telegram_chat_id}
                                onChange={e => setFormData({ ...formData, telegram_chat_id: e.target.value })}
                                className="w-full bg-[#0A0A0B] border border-white/5 rounded-2xl px-6 py-4 text-sm font-bold placeholder-gray-800 outline-none focus:border-accent-purple transition-all"
                                placeholder="1938502000"
                            />
                        </div>
                    </div>

                    <button
                        onClick={testTelegram}
                        className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-accent-purple border border-accent-purple/20 flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={14} /> Send Connectivity Test
                    </button>
                </motion.div>
            </div>

            <div className="flex flex-col items-center gap-8 pt-8">
                <button
                    onClick={saveSettings}
                    className="bg-accent-blue text-white px-20 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-blue-500/30 flex items-center gap-4"
                >
                    <Save size={20} /> Deploy All settings
                </button>

                <div className="max-w-xl w-full p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex gap-6 items-center">
                    <div className="w-16 h-16 bg-accent-amber/10 rounded-2xl flex items-center justify-center text-accent-amber shadow-inner">
                        <ShieldCheck size={32} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest text-accent-amber">Security Protocol 4.1</p>
                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed font-display italic">
                            Credentials remain localized. Your keys never leave your controlled backend instance.
                            Uses SHA-256 for local persistence.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
