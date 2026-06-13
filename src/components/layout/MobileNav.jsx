'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAdmin } from '@/context/AdminContext';

const MobileNav = ({ pendingCount = 0, onLogout }) => {
    const pathname = usePathname();
    const { userProfile } = useAdmin();
    const [isOpen, setIsOpen] = useState(false);

    const allItems = [
        { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard', path: '/' },
        { id: 'orders', label: 'Orders', icon: 'fa-shopping-basket', count: pendingCount, path: '/orders' },
        { id: 'menu', label: 'Menu', icon: 'fa-cookie-bite', path: '/menu' },
        { id: 'loyalty', label: 'Loyalty', icon: 'fa-gift', path: '/loyalty' },
        { id: 'users', label: 'Users', icon: 'fa-users-gear', path: '/users' },
        { id: 'profile', label: 'Profile', icon: 'fa-user-circle', path: '/profile' },
        { id: 'settings', icon: 'fa-sliders', label: 'Settings', path: '/settings' },
        { id: 'website-config', icon: 'fa-laptop-code', label: 'Web Config', path: '/website-config' },
    ];

    const navItems = allItems.filter(item => {
        if (item.id === 'dashboard' || item.id === 'profile') return true; // Always visible
        if (!userProfile) return false;
        if (userProfile.role === 'full') return true;
        return userProfile.permissions?.includes(item.id);
    });

    // Add logout to the end
    const itemsWithLogout = [...navItems, { id: 'exit', icon: 'fa-power-off', label: 'Logout', path: '#' }];

    const isActive = (path) => pathname === path;

    return (
        <nav className="lg:hidden fixed bottom-6 left-4 right-4 z-50 flex flex-col items-end pointer-events-none">
            {/* The main navigation bar - hidden/shown based on isOpen */}
            <div 
                className={`
                    bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-3xl p-3 flex flex-col gap-1 ring-1 ring-slate-900/5
                    transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom-right pointer-events-auto mb-4 min-w-[180px]
                    ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-10 pointer-events-none'}
                `}
            >
                {itemsWithLogout.map((item) => {
                    const active = isActive(item.path);
                    const isExit = item.id === 'exit';

                    if (isExit) {
                        return (
                            <React.Fragment key={item.id}>
                                <div className="h-px w-full bg-slate-100 my-1"></div>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        onLogout();
                                    }}
                                    className="relative flex items-center gap-3 p-2 rounded-2xl group transition-all duration-300 hover:bg-red-50/50"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-slate-400 transition-all duration-300 group-hover:bg-red-100 group-hover:text-red-600">
                                        <i className={`fa-solid ${item.icon} text-[18px]`}></i>
                                    </div>
                                    <span className="text-[13px] font-bold tracking-wide text-slate-500 transition-colors duration-300 group-hover:text-red-600">
                                        {item.label}
                                    </span>
                                </button>
                            </React.Fragment>
                        );
                    }

                    return (
                        <Link
                            key={item.id}
                            href={item.path}
                            onClick={() => setIsOpen(false)}
                            className={`relative flex items-center gap-3 p-2 rounded-2xl group transition-all duration-300 ${active ? 'bg-red-50/50' : 'hover:bg-slate-50'}`}
                        >
                            <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${active ? 'bg-gradient-to-tr from-red-600 to-rose-400 text-white shadow-md shadow-red-500/20 scale-105' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'}`}>
                                <i className={`fa-solid ${item.icon} text-[18px]`}></i>
                            </div>
                            
                            <span className={`text-[13px] font-bold tracking-wide transition-colors duration-300 ${active ? 'text-red-600' : 'text-slate-500 group-hover:text-slate-700'}`}>
                                {item.label}
                            </span>
                            
                            {item.count > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full ml-auto shadow-sm mr-2">
                                    {item.count}
                                </span>
                            )}
                            
                            {active && !item.count && (
                                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    pointer-events-auto relative w-14 h-14 rounded-full flex items-center justify-center
                    shadow-xl z-10 transition-all duration-500 
                    ${isOpen ? 'bg-slate-800 text-white shadow-slate-900/20 rotate-180' : 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-red-500/30 hover:scale-105'}
                `}
            >
                <div className="relative w-6 h-6 flex items-center justify-center">
                    <i className={`fa-solid fa-bars text-xl absolute transition-all duration-300 ${isOpen ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'}`}></i>
                    <i className={`fa-solid fa-xmark text-xl absolute transition-all duration-300 ${isOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'}`}></i>
                </div>
            </button>
        </nav>
    );
};

export default MobileNav;
