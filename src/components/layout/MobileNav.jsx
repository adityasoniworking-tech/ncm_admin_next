'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAdmin } from '@/context/AdminContext';

const MobileNav = ({ onLogout }) => {
    const pathname = usePathname();
    const { userProfile } = useAdmin();

    const allItems = [
        { id: 'dashboard', icon: 'fa-house', label: 'Home', path: '/' },
        { id: 'orders', label: 'Orders', icon: 'fa-shopping-basket', path: '/orders' },
        { id: 'menu', label: 'Menu', icon: 'fa-utensils', path: '/menu' },
        { id: 'website-config', icon: 'fa-laptop-code', label: 'Web', path: '/website-config' },
        { id: 'settings', icon: 'fa-sliders', label: 'Config', path: '/settings' },
    ];

    const navItems = allItems.filter(item => {
        if (!userProfile) return item.id === 'dashboard';
        if (userProfile.role === 'full') return true;
        return userProfile.permissions?.includes(item.id);
    });

    // Add logout to the end
    const itemsWithLogout = [...navItems, { id: 'exit', icon: 'fa-power-off', label: 'Logout', path: '#' }];

    const isActive = (path) => pathname === path;

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-safe">
            <div className="flex justify-around items-center px-2 py-3">
                {itemsWithLogout.map((item) => {
                    const active = isActive(item.path);
                    const isExit = item.id === 'exit';

                    if (isExit) {
                        return (
                            <button
                                key={item.id}
                                onClick={onLogout}
                                className="flex flex-col items-center justify-center gap-1.5 min-w-[4rem] py-1 text-slate-500 hover:text-red-600 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full border border-slate-900 flex items-center justify-center bg-white shadow-sm">
                                    <i className={`fa-solid ${item.icon} text-lg`}></i>
                                </div>
                                <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={item.id}
                            href={item.path}
                            className={`flex flex-col items-center justify-center gap-1.5 min-w-[4rem] py-1 transition-all ${active ? 'text-red-600' : 'text-slate-500'}`}
                        >
                            <div className="relative">
                                <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${active ? 'border-red-600 bg-red-50' : 'border-slate-900 bg-white shadow-sm'}`}>
                                    <i className={`fa-solid ${item.icon} text-lg`}></i>
                                </div>
                                {active && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-sm"></div>
                                )}
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileNav;
