'use client';

import React from 'react';
import { motion } from 'framer-motion';

const AdminCard = React.memo(({ user, userProfile, onSendReset, onDelete }) => {
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 rounded-[2rem] border border-white relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                    <i className="fa-solid fa-user text-xl"></i>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'full' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    {user.role} Access
                </div>
            </div>
            
            <div className="mb-6">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Email Address</p>
                <h4 className="text-lg font-bold text-slate-800 break-all">{user.email}</h4>
            </div>

            <div className="mb-8">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">Permissions</p>
                <div className="flex flex-wrap gap-2">
                    {user.role === 'full' ? (
                        <span className="bg-slate-800 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter">Everything</span>
                    ) : (
                        user.permissions?.map(p => (
                            <span key={p} className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter">{p}</span>
                        ))
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <button 
                    onClick={() => onSendReset(user.email)}
                    className="w-full py-3 rounded-xl bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 text-center transition-colors flex items-center justify-center gap-2"
                >
                    <i className="fa-solid fa-key"></i>
                    Send Password Link
                </button>

                {user.email !== userProfile.email && (
                    <button 
                        onClick={() => onDelete(user.email)}
                        className="w-full py-3 rounded-xl border border-red-50 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 text-center transition-colors"
                    >
                        Remove Access
                    </button>
                )}
            </div>
        </motion.div>
    );
});

AdminCard.displayName = 'AdminCard';

export default AdminCard;
