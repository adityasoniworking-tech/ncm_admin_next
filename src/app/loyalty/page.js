'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/services/firebase';
import { collection, doc, onSnapshot, query, updateDoc, setDoc, getDoc } from 'firebase/firestore';

export default function LoyaltyPage() {
    const [activeTab, setActiveTab] = useState('settings');
    const [settings, setSettings] = useState({
        discountAmount: 0,
        discountType: 'percentage',
        ordersRequired: 10
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [customers, setCustomers] = useState([]);
    const [rewards, setRewards] = useState([]);

    useEffect(() => {
        // Fetch Settings
        const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'loyalty'), (docSnap) => {
            if (docSnap.exists()) {
                setSettings(docSnap.data());
            }
            setLoading(false);
        });

        // Fetch Customers
        const unsubscribeCustomers = onSnapshot(collection(db, 'users'), (snapshot) => {
            const fetched = [];
            snapshot.forEach(doc => fetched.push({ id: doc.id, ...doc.data() }));
            setCustomers(fetched);
        });

        // Fetch Rewards/History
        const unsubscribeRewards = onSnapshot(collection(db, 'rewards'), (snapshot) => {
            const fetched = [];
            snapshot.forEach(doc => fetched.push({ id: doc.id, ...doc.data() }));
            // sort by createdAt desc
            fetched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setRewards(fetched);
        });

        return () => {
            unsubscribeSettings();
            unsubscribeCustomers();
            unsubscribeRewards();
        };
    }, []);

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'loyalty'), settings);
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Error saving settings.");
        }
        setSaving(false);
    };

    const getCustomerName = (customer) => {
        if (!customer) return 'Unknown User';
        
        const names = [customer.displayName, customer.profileName, customer.name];
        for (let name of names) {
            if (name && typeof name === 'string' && name.replace(/,/g, '').trim() !== '') {
                return name.trim();
            }
        }
        
        if (customer.email) return customer.email.split('@')[0];
        if (customer.phone) return `User ${customer.phone}`;
        return `Guest (${customer.id ? customer.id.substring(0, 6) : 'Unknown'})`;
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading Loyalty Data...</div>;
    }

    return (
        <div className="space-y-6 pb-12 text-slate-800">
            <div className="bg-white p-5 lg:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex flex-col items-center justify-center shrink-0">
                        <i className="fa-solid fa-gift text-xl"></i>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-800">Loyalty Program</h2>
                        <p className="text-sm text-gray-500 font-medium">Manage rewards and customer loyalty</p>
                    </div>
                </div>
                
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Settings
                    </button>
                    <button 
                        onClick={() => setActiveTab('customers')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'customers' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Customers
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        History
                    </button>
                </div>
            </div>

            {activeTab === 'settings' && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 max-w-2xl">
                    <h3 className="text-lg font-bold mb-4">Reward Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Orders Required for Reward</label>
                            <input 
                                type="number" 
                                value={settings.ordersRequired}
                                onChange={(e) => setSettings({...settings, ordersRequired: Number(e.target.value)})}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-100 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Discount Type</label>
                            <select 
                                value={settings.discountType}
                                onChange={(e) => setSettings({...settings, discountType: e.target.value})}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-100 outline-none"
                            >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Discount Amount</label>
                            <input 
                                type="number" 
                                value={settings.discountAmount}
                                onChange={(e) => setSettings({...settings, discountAmount: Number(e.target.value)})}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-100 outline-none"
                            />
                        </div>
                        <button 
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 w-full mt-4"
                        >
                            {saving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-save"></i>}
                            Save Settings
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'customers' && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Completed Orders</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Current Cycle</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reward Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {customers.filter(c => c.totalOrders > 0 || c.completedOrders > 0).map(customer => (
                                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800">{getCustomerName(customer)}</div>
                                            {customer.email && <div className="text-xs text-gray-600">{customer.email}</div>}
                                            {customer.phone && <div className="text-xs text-gray-400">{customer.phone}</div>}
                                        </td>
                                        <td className="p-4 font-medium text-gray-600">{customer.totalOrders || 0}</td>
                                        <td className="p-4 font-bold text-emerald-600">{customer.completedOrders || 0}</td>
                                        <td className="p-4 font-medium text-purple-600">{customer.currentCycleOrders || 0} / {settings.ordersRequired}</td>
                                        <td className="p-4">
                                            {customer.rewardEligibility ? (
                                                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">Reward Pending</span>
                                            ) : (
                                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">In Progress</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Discount</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rewards.map(reward => {
                                    const customer = customers.find(c => c.id === reward.userId);
                                    const customerName = getCustomerName(customer);
                                    const customerEmail = customer?.email || '';
                                    return (
                                    <tr key={reward.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-sm font-medium text-gray-600">
                                            {reward.createdAt?.seconds ? new Date(reward.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-800">{customerName}</div>
                                            {customerEmail && <div className="text-xs text-gray-500">{customerEmail}</div>}
                                            {reward.orderId && <div className="text-xs text-purple-600 mt-1 font-mono">Order: {reward.orderId}</div>}
                                        </td>
                                        <td className="p-4 font-bold text-emerald-600">
                                            {reward.discountType === 'fixed' ? '₹' : ''}{reward.discountAmount}{reward.discountType === 'percentage' ? '%' : ''}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                reward.status === 'used' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {reward.status}
                                            </span>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                        {rewards.length === 0 && (
                            <div className="p-8 text-center text-gray-500">No rewards history found.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
