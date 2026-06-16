'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '@/services/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { createAdminUser } from '@/services/firebase';
import { useAdmin } from '@/context/AdminContext';
import { motion, AnimatePresence } from 'framer-motion';
import AdminCard from '@/components/users/AdminCard';

export default function UsersPage() {
    const { userProfile } = useAdmin();
    const [users, setUsers] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'limited',
        permissions: ['dashboard', 'orders']
    });

    useEffect(() => {
        const usersRef = collection(db, 'authorized_admins');
        const q = query(usersRef, orderBy('email', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersData);
        }, (err) => {
            console.log("Admin list fetch handled:", err.code);
        });
        return () => unsubscribe();
    }, []);

    const handleAddUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let uid = null;
            try {
                const newUser = await createAdminUser(formData.email, formData.password);
                uid = newUser.uid;
            } catch (authErr) {
                if (authErr.code !== 'auth/email-already-in-use') throw authErr;
            }
            
            const profileData = {
                email: formData.email,
                role: formData.role,
                permissions: formData.role === 'full' ? ['dashboard', 'orders', 'menu', 'settings', 'users'] : formData.permissions,
                updatedAt: new Date().toISOString()
            };

            await setDoc(doc(db, 'authorized_admins', formData.email.toLowerCase()), profileData);
            if (uid) await setDoc(doc(db, 'admin_users', uid), profileData);

            setIsAddModalOpen(false);
            setFormData({ email: '', password: '', role: 'limited', permissions: ['dashboard', 'orders'] });
            alert(uid ? 'New admin created!' : 'Access granted!');
        } catch (err) {
            setError(err.message || 'Failed to process user');
        } finally {
            setLoading(false);
        }
    };

    const handleSendResetEmail = useCallback(async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            alert('Reset link sent!');
        } catch (err) {
            alert('Failed: ' + err.message);
        }
    }, []);

    const handleDeleteUser = useCallback(async (userEmail) => {
        if (!confirm('Remove this admin?')) return;
        try {
            await deleteDoc(doc(db, 'authorized_admins', userEmail.toLowerCase()));
        } catch (err) {
            alert('Failed to delete');
        }
    }, []);

    const togglePermission = (perm) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm]
        }));
    };

    if (userProfile?.role !== 'full') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-500">
                    <i className="fa-solid fa-lock text-3xl"></i>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Access Restricted</h2>
                <p className="text-slate-500">You do not have permission to manage administrative users.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-24 lg:pb-0">
            <div className="lg:hidden flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-white">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 text-amber-500">
                    <i className="fa-solid fa-desktop text-2xl"></i>
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-2">Desktop Only Feature</h2>
                <p className="text-slate-500 text-sm font-medium">User Access settings are only available on Desktop devices.</p>
                <button onClick={() => window.location.href = '/'} className="mt-8 bg-slate-800 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest">
                    Back to Dashboard
                </button>
            </div>

            <div className="hidden lg:block space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter text-slate-800">User Management</h2>
                        <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Admin Access Control</p>
                    </div>
                    <button onClick={() => setIsAddModalOpen(true)} className="bg-amber-500 hover:bg-amber-600 px-6 py-3 rounded-2xl text-sm font-black tracking-widest uppercase transition-all shadow-lg shadow-amber-200 text-white flex items-center gap-2">
                        <i className="fa-solid fa-user-plus"></i> Add Admin
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {users.map((user) => (
                        <AdminCard 
                            key={user.id} 
                            user={user} 
                            userProfile={userProfile}
                            onSendReset={handleSendResetEmail}
                            onDelete={handleDeleteUser}
                        />
                    ))}
                </div>

                <AnimatePresence>
                    {isAddModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !loading && setIsAddModalOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></motion.div>
                            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden">
                                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Add New Admin</h3>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Create Access Credentials</p>
                                    </div>
                                    <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                                        <i className="fa-solid fa-xmark text-xl"></i>
                                    </button>
                                </div>
                                <form onSubmit={handleAddUser} className="p-8 space-y-6">
                                    {error && <div className="bg-red-50 border border-red-100 text-red-500 p-4 rounded-2xl text-xs font-bold">{error}</div>}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                        <input type="email" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-slate-800 font-bold focus:ring-2 ring-amber-500/20 transition-all outline-none" placeholder="admin@bakery.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Password</label>
                                        <input type="text" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-slate-800 font-bold focus:ring-2 ring-amber-500/20 transition-all outline-none" placeholder="Min 6 characters" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Level</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button type="button" onClick={() => setFormData({...formData, role: 'full'})} className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${formData.role === 'full' ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Full Access</button>
                                            <button type="button" onClick={() => setFormData({...formData, role: 'limited'})} className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${formData.role === 'limited' ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>Limited</button>
                                        </div>
                                    </div>
                                    {formData.role === 'limited' && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Allow Access To:</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['dashboard', 'orders', 'menu', 'settings'].map(perm => (
                                                    <button key={perm} type="button" onClick={() => togglePermission(perm)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.permissions.includes(perm) ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400'}`}>{perm}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <button disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 py-5 rounded-[1.5rem] text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-200 transition-all mt-4">
                                        {loading ? 'Creating...' : 'Confirm & Create'}
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
