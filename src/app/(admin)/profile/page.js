'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/services/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useAdmin } from '@/context/AdminContext';
import { motion } from 'framer-motion';

export default function ProfilePage() {
    const { userProfile } = useAdmin();
    const [formData, setFormData] = useState({
        displayName: '',
        phoneNumber: '',
        bio: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setFormData({
                displayName: userProfile.displayName || '',
                phoneNumber: userProfile.phoneNumber || '',
                bio: userProfile.bio || ''
            });
            setLoading(false);
        }
    }, [userProfile]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        
        setSaving(true);
        try {
            const userRef = doc(db, 'admin_users', auth.currentUser.uid);
            const whitelistRef = doc(db, 'authorized_admins', auth.currentUser.email.toLowerCase());
            
            const updatedData = {
                ...userProfile,
                ...formData,
                updatedAt: new Date().toISOString()
            };

            // Update both locations to keep data in sync
            await Promise.all([
                setDoc(userRef, updatedData),
                setDoc(whitelistRef, updatedData)
            ]);

            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-4"></i>
                <p className="font-medium">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-12">
            {/* Profile Header Card */}
            <div className="glass-card p-8 rounded-[2.5rem] border-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full -ml-32 -mb-32 blur-3xl"></div>
                
                <div className="relative flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-[#6b0f1a] to-amber-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-red-900/30 border-4 border-white/50 backdrop-blur-sm">
                        {formData.displayName ? formData.displayName[0].toUpperCase() : userProfile?.email[0].toUpperCase()}
                    </div>
                    
                    <div className="text-center md:text-left space-y-2">
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                                {formData.displayName || 'Admin User'}
                            </h2>
                            <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-amber-500/20">
                                {userProfile?.role || 'Admin'}
                            </span>
                        </div>
                        <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2">
                            <i className="fa-solid fa-envelope text-slate-400"></i>
                            {userProfile?.email}
                        </p>
                    </div>
                </div>
            </div>

            {/* Edit Profile Form */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                            <i className="fa-solid fa-user-pen"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800">Edit Profile</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Personal Information</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Display Name */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <i className="fa-solid fa-signature absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors"></i>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="w-full bg-slate-50/50 border-2 border-transparent rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-800 focus:border-amber-200 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all placeholder:text-slate-300 outline-none"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                            <div className="relative group">
                                <i className="fa-solid fa-phone absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors"></i>
                                <input
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    className="w-full bg-slate-50/50 border-2 border-transparent rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-800 focus:border-amber-200 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all placeholder:text-slate-300 outline-none"
                                    placeholder="Enter contact number"
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="space-y-3 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">About / Bio</label>
                            <div className="relative group">
                                <i className="fa-solid fa-quote-left absolute left-5 top-5 text-slate-400 group-focus-within:text-amber-500 transition-colors"></i>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full bg-slate-50/50 border-2 border-transparent rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-800 focus:border-amber-200 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all placeholder:text-slate-300 min-h-[120px] resize-none outline-none"
                                    placeholder="Tell us a bit about yourself"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full md:w-auto bg-gradient-to-r from-[#6b0f1a] to-[#4a0a12] text-white font-black px-12 py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-red-900/20 disabled:opacity-50 flex items-center justify-center gap-3 tracking-widest text-xs uppercase"
                        >
                            {saving ? (
                                <i className="fa-solid fa-spinner fa-spin text-lg"></i>
                            ) : (
                                <i className="fa-solid fa-cloud-arrow-up text-lg"></i>
                            )}
                            {saving ? 'Updating...' : 'Update Profile'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Account Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex items-center gap-4 group cursor-default">
                    <div className="w-12 h-12 bg-blue-50 group-hover:bg-blue-500 group-hover:text-white transition-colors text-blue-500 rounded-2xl flex items-center justify-center text-xl">
                        <i className="fa-solid fa-shield-check"></i>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</p>
                        <p className="text-sm font-bold text-slate-800">Verified Admin</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-purple-100 hover:shadow-xl hover:shadow-purple-500/5 transition-all flex items-center gap-4 group cursor-default">
                    <div className="w-12 h-12 bg-purple-50 group-hover:bg-purple-500 group-hover:text-white transition-colors text-purple-500 rounded-2xl flex items-center justify-center text-xl">
                        <i className="fa-solid fa-key"></i>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security</p>
                        <p className="text-sm font-bold text-slate-800">Password Active</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 hover:border-green-100 hover:shadow-xl hover:shadow-green-500/5 transition-all flex items-center gap-4 group cursor-default">
                    <div className="w-12 h-12 bg-green-50 group-hover:bg-green-500 group-hover:text-white transition-colors text-green-500 rounded-2xl flex items-center justify-center text-xl">
                        <i className="fa-solid fa-calendar-day"></i>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Since</p>
                        <p className="text-sm font-bold text-slate-800">2026 Portal Access</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
