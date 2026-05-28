'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import MobileNav from './MobileNav';
import LogoutModal from './LogoutModal';
import PWAUpdater from '../common/PwaUpdater';
import { useAdmin } from '@/context/AdminContext';
import { auth, messaging, db } from '@/services/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getToken } from 'firebase/messaging';
import { setDoc, doc } from 'firebase/firestore';

export default function AdminLayout({ children }) {
    const { stats, userProfile, loadingProfile } = useAdmin();
    const router = useRouter();
    const pathname = usePathname();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Optimized Auth Listener (Mount only)
    useEffect(() => {
        const isAuth = sessionStorage.getItem('ncm_admin_auth') === 'true';
        setIsAuthenticated(isAuth);
        if (isAuth) setCheckingAuth(false);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
                sessionStorage.setItem('ncm_admin_auth', 'true');
            } else {
                setIsAuthenticated(false);
                sessionStorage.removeItem('ncm_admin_auth');
                if (pathname !== '/login') router.push('/login');
            }
            setCheckingAuth(false);
        });

        return () => unsubscribe();
    }, []);

    // Efficient Route Guard
    useEffect(() => {
        if (pathname === '/login' || loadingProfile || !userProfile) return;

        const pathMap = {
            '/': 'dashboard',
            '/orders': 'orders',
            '/menu': 'menu',
            '/settings': 'settings',
            '/users': 'users',
            '/profile': 'profile'
        };

        const requiredPermission = pathMap[pathname];
        if (requiredPermission === 'dashboard' || requiredPermission === 'profile') return;

        if (requiredPermission && userProfile.role !== 'full') {
            if (!userProfile.permissions?.includes(requiredPermission)) {
                router.replace('/');
            }
        }
    }, [pathname, userProfile, loadingProfile, router]);

    const handleConfirmLogout = async () => {
        try {
            await signOut(auth);
            setIsAuthenticated(false);
            sessionStorage.removeItem('ncm_admin_auth');
            router.push('/login');
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    const getHeaderInfo = (path) => {
        switch (path) {
            case '/':
                return { title: 'Dashboard', subtitle: 'Live overview of your bakery' };
            case '/orders':
                return { title: 'Orders', subtitle: 'Manage your incoming bakery orders' };
            case '/menu':
                return { title: 'Manage Menu', subtitle: 'Update your bakery inventory and pricing' };
            case '/settings':
                return { title: 'Settings', subtitle: 'Configure notifications and app preferences' };
            case '/users':
                return { title: 'User Access', subtitle: 'Manage administrative roles and permissions' };
            default:
                return { title: 'Admin Portal', subtitle: 'Bakery Management' };
        }
    };

    const { title, subtitle } = getHeaderInfo(pathname);

    if (checkingAuth || loadingProfile) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <div className="relative">
                    <div className="w-16 h-16 border-2 border-slate-100 border-t-red-600 rounded-full animate-spin"></div>
                </div>
                <p className="mt-6 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] animate-pulse">Initializing Dashboard</p>
            </div>
        );
    }
    if (!isAuthenticated && pathname !== '/login') return null;
    if (pathname === '/login') return children;

    return (
        <>
            <div className="min-h-screen flex flex-col lg:flex-row bg-white">
                <Sidebar
                    pendingCount={stats.pendingOrders}
                    onLogout={() => setIsLogoutModalOpen(true)}
                />

                <main className="flex-grow w-full lg:ml-72 relative z-10 bg-[#fcfcfd]">
                    <div className="p-4 lg:p-10 max-w-[1440px] mx-auto pb-40 lg:pb-12">
                        <TopHeader
                            title={title}
                            subtitle={subtitle}
                            onLogout={() => setIsLogoutModalOpen(true)}
                        />

                        {children}
                    </div>
                </main>

                <LogoutModal
                    isOpen={isLogoutModalOpen}
                    onClose={() => setIsLogoutModalOpen(false)}
                    onConfirm={handleConfirmLogout}
                />
            </div>

            <MobileNav
                onLogout={() => setIsLogoutModalOpen(true)}
            />
            <PWAUpdater />
        </>
    );
}
