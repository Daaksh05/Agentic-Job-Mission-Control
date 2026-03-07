import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    BarChart3,
    Settings,
    User,
    ChevronRight,
    Home,
    Search,
    Clock,
    Layout,
    Target
} from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const MENU_ITEMS = [
        { label: 'Dashboard', icon: <Home size={20} />, path: '/', type: 'main' },
        { label: 'Jobs', icon: <Search size={20} />, path: '/jobs', type: 'main' },
        { label: 'Review Queue', icon: <Clock size={20} />, path: '/queue', badge: 3, type: 'main' },
        { label: 'Kanban', icon: <Layout size={20} />, path: '/kanban', type: 'main' },
        { label: 'VIE Tracker', icon: <span className="text-lg">🇫🇷</span>, path: '/vie', type: 'secondary' },
        { label: 'Interview Prep', icon: <Target size={20} />, path: '/interview-prep', type: 'secondary' },
        { label: 'Profile', icon: <User size={20} />, path: '/profile', type: 'secondary' },
        { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/analytics', type: 'secondary' },
        { label: 'Settings', icon: <Settings size={20} />, path: '/settings', type: 'secondary' },
    ];

    return (
        <div className="flex h-screen bg-[#0A0A0B] text-white overflow-hidden relative">
            {/* Top Gradient Border */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-accent-blue via-purple-500 to-accent-green z-50"></div>

            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-surface/30 backdrop-blur-2xl flex flex-col z-10">
                <div className="p-8 pb-6">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-accent-blue rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                            TJ
                        </div>
                        <div className="flex flex-col">
                            <span className="font-display font-black text-lg leading-none tracking-tight">JobAgent</span>
                            <span className="text-[10px] text-accent-blue font-bold uppercase tracking-widest mt-1 opacity-70">Core Engine v2</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 px-4 py-4 overflow-y-auto space-y-6">
                    <nav className="space-y-1">
                        {MENU_ITEMS.filter(i => i.type === 'main').map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                        ? 'bg-accent-blue text-white shadow-xl shadow-blue-500/20'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white hover:pl-5'
                                    }`
                                }
                            >
                                <div className="flex items-center gap-3">
                                    <div className="transition-colors group-hover:text-accent-blue">
                                        {item.icon}
                                    </div>
                                    <span className="font-semibold text-sm">{item.label}</span>
                                </div>
                                {item.badge && (
                                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-red-500/20">
                                        {item.badge}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="h-px bg-white/5 mx-4"></div>

                    <nav className="space-y-1">
                        {MENU_ITEMS.filter(i => i.type === 'secondary').map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                        ? 'bg-accent-blue/10 text-accent-blue'
                                        : 'text-gray-500 hover:bg-white/5 hover:text-white hover:pl-5'
                                    }`
                                }
                            >
                                <div className="transition-colors">
                                    {item.icon}
                                </div>
                                <span className="font-medium text-sm">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    <NavLink to="/settings" className="block outline-none">
                        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 relative overflow-hidden group cursor-pointer hover:border-accent-blue/30 transition-colors">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-accent-blue/10 blur-3xl -mr-12 -mt-12"></div>

                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-black text-accent-green uppercase tracking-widest font-mono">Agent Active</span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-gray-400">Daily Quota</span>
                                    <span className="font-bold text-white">8/10</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent-blue rounded-full" style={{ width: '80%' }}></div>
                                </div>
                                <p className="text-[10px] text-gray-500 pt-1">
                                    2 submissions left today
                                </p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity">
                                QUOTA SETTINGS <ChevronRight size={12} />
                            </div>
                        </div>
                    </NavLink>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative z-10">
                {children}
            </main>
        </div>
    );
}
