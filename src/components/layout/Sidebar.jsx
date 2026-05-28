'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAdmin } from '@/context/AdminContext';

const Sidebar = ({ pendingCount = 0, onLogout }) => {
    const pathname = usePathname();
    const { userProfile } = useAdmin();
    
    const allItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line', path: '/' },
        { id: 'orders', label: 'Orders', icon: 'fa-shopping-basket', count: pendingCount, path: '/orders' },
        { id: 'menu', label: 'Manage Menu', icon: 'fa-cookie-bite', path: '/menu' },
        { id: 'loyalty', label: 'Loyalty Program', icon: 'fa-gift', path: '/loyalty' },
        { id: 'users', label: 'User Access', icon: 'fa-users-gear', path: '/users' },
        { id: 'profile', label: 'My Profile', icon: 'fa-user-circle', path: '/profile' },
        { id: 'settings', label: 'Settings', icon: 'fa-sliders', path: '/settings' },
    ];

    const navItems = allItems.filter(item => {
        if (item.id === 'dashboard' || item.id === 'profile') return true; // Always visible
        if (!userProfile) return false;
        if (userProfile.role === 'full') return true;
        return userProfile.permissions?.includes(item.id);
    });

    const isActive = (path) => pathname === path;

    return (
        <aside className="sidebar hidden lg:flex flex-col w-72 bg-slate-950 border-r border-slate-800/50 fixed h-full z-50">
            <div className="p-8 flex items-center gap-4 border-b border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 p-2 border border-slate-800 shadow-sm shrink-0">
                    <img
                        src="/logo192.png"
                        alt="Logo"
                        className="w-full h-full object-contain"
                    />
                </div>
                <div>
                    <span className="text-xl font-black text-white tracking-tight block">NCM Admin</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-900 px-1.5 py-0.5 rounded">Management</span>
                </div>
            </div>

            <nav className="flex-grow py-8 px-2 space-y-1 overflow-y-auto hide-scrollbar">
                {navItems.map((item) => (
                    <Link
                        key={item.id}
                        href={item.path}
                        className={`nav-link ${isActive(item.path) ? 'active-link' : ''}`}
                    >
                        <i className={`fa-solid ${item.icon}`}></i>
                        <span>{item.label}</span>
                        {item.count > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full ml-auto shadow-sm">
                                {item.count}
                            </span>
                        )}
                    </Link>
                ))}
            </nav>

            <div className="p-6 border-t border-slate-800">
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 px-6 py-4 w-full rounded-2xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 font-bold text-sm"
                >
                    <i className="fa-solid fa-power-off text-lg"></i>
                    <span>System Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
