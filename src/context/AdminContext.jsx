'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, messaging, auth } from '../services/firebase';
import { collection, onSnapshot, query, where, getDocs, doc, setDoc, getDoc, orderBy } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { subDays, startOfDay, isSameDay, format } from 'date-fns';

const AdminContext = createContext();

export function AdminProvider({ children }) {
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        revenue: 0,
        chartData: [],
    });

    const [inventory, setInventory] = useState({
        inStock: 0,
        outOfStock: 0,
        total: 0,
        outOfStockItems: [],
    });

    const [userProfile, setUserProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    const isInitialLoad = useRef(true);

    // User Profile Listener
    useEffect(() => {
        let unsubscribeProfile = null;

        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (unsubscribeProfile) unsubscribeProfile();

            if (user) {
                const userRef = doc(db, 'admin_users', user.uid);
                unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data());
                        setLoadingProfile(false);
                    } else {
                        // Check authorized_admins whitelist (Email-based)
                        const authRef = doc(db, 'authorized_admins', user.email.toLowerCase());
                        const authSnap = await getDoc(authRef);

                        if (authSnap.exists()) {
                            const profileData = authSnap.data();
                            setUserProfile(profileData);
                            // Auto-create the UID-based doc for faster future access
                            setDoc(userRef, profileData);
                            setLoadingProfile(false);
                        } else if (user.email.toLowerCase() === 'nuttychocomorselswebsite@gmail.com') {
                            // Explicit fallback for master admin
                            const masterProfile = { role: 'full', email: user.email, displayName: 'Master Admin' };
                            setUserProfile(masterProfile);
                            setDoc(userRef, masterProfile);
                            setDoc(authRef, masterProfile);
                            setLoadingProfile(false);
                        } else {
                            // Unauthorized user - they are not in whitelist and not master admin
                            setUserProfile({ role: 'none', email: user.email });
                            setLoadingProfile(false);
                            // Optionally sign them out: auth.signOut();
                        }
                    }
                }, (error) => {
                    console.log("Profile fetch handled:", error.code);
                    if (user.email.toLowerCase() === 'nuttychocomorselswebsite@gmail.com') {
                        setUserProfile({ role: 'full', email: user.email, displayName: 'Master Admin' });
                    } else {
                        setUserProfile({ role: 'none', email: user.email });
                    }
                    setLoadingProfile(false);
                });
            } else {
                setUserProfile(null);
                setLoadingProfile(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);

    // Real-time Orders Listener
    useEffect(() => {
        const ordersRef = collection(db, 'orders');
        const unsubscribe = onSnapshot(ordersRef, (snapshot) => {
            let total = snapshot.size;
            let pending = 0;
            let rev = 0;

            if (!isInitialLoad.current) {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const order = change.doc.data();
                        const audio = new Audio('/alert.mp3');
                        audio.play().catch(e => console.log('Audio play failed:', e));

                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('New Order Received!', {
                                body: `Order #${change.doc.id.slice(0, 8)} from ${order.userName || 'Guest'}. Amount: ₹${order.totalAmount || 0}`,
                                icon: '/logo192.png'
                            });
                        }
                    }
                });
            }

            if (isInitialLoad.current) isInitialLoad.current = false;

            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = subDays(new Date(), 6 - i);
                return {
                    name: format(d, 'eee'),
                    rawDate: startOfDay(d),
                    revenue: 0,
                    orders: 0
                };
            });

            snapshot.docs.forEach(doc => {
                const order = doc.data();
                const orderDate = order.timestamp?.toDate ? order.timestamp.toDate() : new Date();

                if (order.status === 'Pending' || order.status === 'Payment Awaited') {
                    pending++;
                }
                if (['Accepted', 'Ready', 'Delivered'].includes(order.status)) {
                    const amount = (order.totalAmount || 0);
                    rev += amount;

                    const dayMatch = last7Days.find(d => isSameDay(d.rawDate, startOfDay(orderDate)));
                    if (dayMatch) {
                        dayMatch.revenue += amount;
                        dayMatch.orders += 1;
                    }
                }
            });

            setStats({
                totalOrders: total,
                pendingOrders: pending,
                revenue: rev,
                chartData: last7Days.map(({ name, revenue, orders }) => ({ name, revenue, orders }))
            });
        });

        return () => unsubscribe();
    }, []);

    // Real-time Menu Listener
    useEffect(() => {
        const menuRef = collection(db, 'menu');
        const unsubscribe = onSnapshot(menuRef, (snapshot) => {
            let inStock = 0;
            let outOfStock = 0;
            let total = snapshot.size;
            let outOfStockItems = [];

            snapshot.docs.forEach(docSnap => {
                const item = { docId: docSnap.id, ...docSnap.data() };
                if (item.inStock === true) {
                    inStock++;
                } else {
                    outOfStock++;
                    outOfStockItems.push(item);
                }
            });

            setInventory({ inStock, outOfStock, total, outOfStockItems });
        });

        return () => unsubscribe();
    }, []);

    return (
        <AdminContext.Provider value={{ stats, inventory, userProfile, loadingProfile }}>
            {children}
        </AdminContext.Provider>
    );
}

export const useAdmin = () => useContext(AdminContext);
