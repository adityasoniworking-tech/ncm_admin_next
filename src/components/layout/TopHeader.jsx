'use client';

import React from 'react';
import { useAdmin } from '@/context/AdminContext';

const TopHeader = ({ title, subtitle, onLogout }) => {
    const { userProfile } = useAdmin();
    return (
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 sm:mb-12 glass-card p-6 rounded-3xl border-slate-100 relative z-10 animate-fadeIn bg-white/50 backdrop-blur-xl">
            <div className="page-title">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">{title}</h1>
                <div className="flex items-center gap-3">
                    <p className="text-slate-400 text-sm font-semibold tracking-wide flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        {subtitle}
                    </p>
                    {userProfile?.displayName && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                            <i className="fa-solid fa-user text-[10px] text-slate-300"></i>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{userProfile.displayName}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-slate-50">
                <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Store Operational</span>
                </div>

                <div className="flex items-center gap-4">
                    <div
                        onClick={onLogout}
                        className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-600 transition-all duration-300 cursor-pointer border border-slate-100 shadow-sm group"
                    >
                        <i className="fa-solid fa-power-off text-lg"></i>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopHeader;
