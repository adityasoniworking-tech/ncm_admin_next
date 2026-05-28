'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/services/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, writeBatch, getDocs, limit, getDoc, setDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';

const OrderDetailsModal = dynamic(() => import('@/components/orders/OrderDetailsModal'), {
    ssr: false,
    loading: () => null
});

// Memoize OrderCard to prevent unnecessary re-renders
const OrderCard = React.memo(({ order, onUpdateStatus, onDelete, onViewItems, onOpenMap, getStatusColor }) => {
    const timeAgo = order.timestamp ? new Date(order.timestamp.seconds * 1000).toLocaleString('en-IN') : "Just now";
    const needsAction = order.status === 'Pending' || order.status === 'Payment Awaited';
    const isAccepted = order.status === 'Accepted';
    const isReady = order.status === 'Ready';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow animate-fadeIn">
            <div className="p-4 border-b border-gray-50 flex justify-between items-start bg-gray-50/50">
                <div>
                    <div className="text-[10px] font-mono text-gray-500 font-medium break-all">#{order.id}</div>
                    <div className="text-[11px] text-gray-400 mt-1">{timeAgo}</div>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ml-2 ${getStatusColor(order.status)}`}>
                    {order.status}
                </span>
            </div>

            <div className="p-4 flex-grow flex flex-col gap-3">
                <div>
                    <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <i className="fa-solid fa-user text-gray-400 text-xs"></i> {order.userName || 'Guest'}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <i className="fa-solid fa-phone text-gray-400 text-xs"></i> {order.phone || 'N/A'}
                    </div>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-slate-800">
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex justify-between">
                        <span>Delivery Details</span>
                        <span className={order.deliveryType === 'Self Pickup' ? 'text-purple-600' : 'text-blue-600'}>
                            {order.deliveryType === 'Self Pickup' ? 'Pickup' : 'Delivery'}
                        </span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium line-clamp-2 leading-snug">
                        {order.deliveryType === 'Self Pickup' ? 'Store Pickup' : (order.address || 'No address provided')}
                    </p>
                </div>

                <div className="mt-auto">
                    {order.discountAmount > 0 && (
                        <div className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded-md w-fit mb-2 flex items-center gap-1">
                            <i className="fa-solid fa-gift"></i> Discount Applied (₹{order.discountAmount})
                        </div>
                    )}
                    <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-2">
                        <span className="text-xs font-bold text-gray-400">
                            {order.paymentMethod === 'UPI' ? 'UPI' : 'COD'}
                        </span>
                        <span className="text-lg font-black text-emerald-600">
                            ₹{order.totalAmount?.toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                    {order.deliveryType !== 'Self Pickup' && (
                        <button
                            onClick={() => onOpenMap(order.address, order.coordinates)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                            <i className="fa-solid fa-map-location-dot"></i> Map
                        </button>
                    )}
                    <button
                        onClick={() => onViewItems(order)}
                        className={`${order.deliveryType === 'Self Pickup' ? 'col-span-2' : ''} bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5`}
                    >
                        <i className="fa-solid fa-box-open"></i> View Items
                    </button>
                </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100">
                {needsAction ? (
                    <div className="flex gap-2">
                        <button type="button" onClick={() => onUpdateStatus(order.id, 'Accepted')} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl text-xs font-bold transition flex justify-center items-center gap-1">
                            <i className="fa-solid fa-check"></i> Accept
                        </button>
                        <button type="button" onClick={() => onUpdateStatus(order.id, 'Rejected')} className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 py-2 rounded-xl text-xs font-bold transition flex justify-center items-center gap-1">
                            <i className="fa-solid fa-xmark"></i> Reject
                        </button>
                    </div>
                ) : isAccepted ? (
                    <button type="button" onClick={() => onUpdateStatus(order.id, 'Ready')} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl text-xs font-bold transition flex justify-center items-center gap-1">
                        <i className="fa-solid fa-cookie-bite"></i> Mark Ready
                    </button>
                ) : isReady ? (
                    <button type="button" onClick={() => onUpdateStatus(order.id, 'Delivered')} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-xs font-bold transition flex justify-center items-center gap-1">
                        <i className="fa-solid fa-truck"></i> Delivered
                    </button>
                ) : (
                    <button type="button" onClick={() => onDelete(order.id)} className="w-full bg-gray-200 hover:bg-red-100 hover:text-red-600 text-gray-600 py-2 rounded-xl text-xs font-bold transition flex justify-center items-center gap-1">
                        <i className="fa-solid fa-trash"></i> Archive Order
                    </button>
                )}
            </div>
        </div>
    );
});
OrderCard.displayName = 'OrderCard';

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedOrders = [];
            snapshot.forEach((doc) => {
                fetchedOrders.push({ id: doc.id, ...doc.data() });
            });
            setOrders(fetchedOrders);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching orders:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleUpdateStatus = useCallback(async (orderId, newStatus) => {
        const confirmMsg = newStatus === 'Rejected'
            ? 'Are you sure you want to reject this order?'
            : `Update status to ${newStatus}?`;

        if (['Accepted', 'Ready', 'Delivered'].includes(newStatus) || window.confirm(confirmMsg)) {
            try {
                const orderRef = doc(db, 'orders', orderId);
                const orderDoc = await getDoc(orderRef);
                const orderData = orderDoc.data();
                
                await updateDoc(orderRef, { status: newStatus });
                
                // Loyalty Points Logic (Strictly restricted to PWA app orders and Delivered status)
                if (newStatus === 'Delivered' && orderData?.userId && orderData?.source === 'app') {
                    if (!orderData.rewardPointsAdded) {
                        const userRef = doc(db, 'users', orderData.userId);
                        const userDoc = await getDoc(userRef);
                        const settingsDoc = await getDoc(doc(db, 'settings', 'loyalty'));
                        const requiredOrders = settingsDoc.exists() ? (settingsDoc.data().ordersRequired || 10) : 10;
                        
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            
                            if (userData.rewardEligibility) {
                                // If they haven't used their reward yet, do not increment cycle
                                let completedCount = userData.completedOrders || 0;
                                await updateDoc(userRef, { completedOrders: completedCount + 1 });
                                await updateDoc(orderRef, { rewardPointsAdded: true });
                            } else {
                                let completedCount = userData.completedOrders || 0;
                                let currentCycle = userData.currentCycleOrders || 0;
                                
                                completedCount += 1;
                                
                                // Do not increment cycle if they used a reward on THIS order
                                const usedRewardOnThisOrder = orderData.discountAmount > 0;
                                if (!usedRewardOnThisOrder) {
                                    currentCycle += 1;
                                }
                                
                                let updatePayload = {
                                    completedOrders: completedCount,
                                    currentCycleOrders: currentCycle
                                };
                                
                                if (currentCycle >= requiredOrders) {
                                    updatePayload.currentCycleOrders = requiredOrders; // Keep it at max until used
                                    updatePayload.rewardEligibility = true;
                                    updatePayload.loyaltyStatus = "Reward Pending";
                                    
                                    // Create reward voucher
                                    const newRewardRef = doc(collection(db, 'rewards'));
                                    await setDoc(newRewardRef, {
                                        userId: orderData.userId,
                                        discountAmount: settingsDoc.exists() ? (settingsDoc.data().discountAmount || 0) : 0,
                                        discountType: settingsDoc.exists() ? (settingsDoc.data().discountType || 'percentage') : 'percentage',
                                        status: 'pending',
                                        createdAt: new Date()
                                    });
                                }
                                
                                await updateDoc(userRef, updatePayload);
                                await updateDoc(orderRef, { rewardPointsAdded: true });
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error updating status:", error);
            }
        }
    }, []);

    const handleDeleteOrder = useCallback(async (orderId) => {
        if (window.confirm("Are you sure you want to Archive/Delete this order?")) {
            try {
                await deleteDoc(doc(db, 'orders', orderId));
            } catch (error) {
                console.error("Error deleting order:", error);
            }
        }
    }, []);

    const handleDeleteAllOrders = async () => {
        if (!window.confirm("⚠️ ARE YOU SURE? All orders will be permanently deleted!")) return;
        const confirm2 = window.prompt("Type 'DELETE' to confirm:");
        if (confirm2 !== "DELETE") return;

        try {
            const ordersRef = collection(db, 'orders');
            let isDeleting = true;
            while (isDeleting) {
                const snapshot = await getDocs(query(ordersRef, limit(500)));
                if (snapshot.empty) { isDeleting = false; break; }
                const batch = writeBatch(db);
                snapshot.forEach((doc) => batch.delete(doc.ref));
                await batch.commit();
            }
            alert("All orders deleted.");
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleOpenMap = useCallback((address, coordinates) => {
        if (coordinates?.lat && coordinates?.lng) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`, '_blank');
        } else if (address) {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
        }
    }, []);

    const getStatusColor = useCallback((status) => {
        switch (status) {
            case 'Pending':
            case 'Payment Awaited': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Accepted': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Ready': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
            case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    }, []);

    const filteredOrders = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return orders.filter(order => 
            order.id.toLowerCase().includes(term) ||
            (order.userName || '').toLowerCase().includes(term) ||
            (order.phone || '').toLowerCase().includes(term)
        );
    }, [orders, searchTerm]);

    return (
        <div className="space-y-6 pb-12 text-slate-800">
            <div className="bg-white p-5 lg:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex flex-col items-center justify-center shrink-0">
                        <i className="fa-solid fa-receipt text-xl"></i>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-800">Live Orders</h2>
                        <p className="text-sm text-gray-500 font-medium">{filteredOrders.length} orders found</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-grow sm:w-72">
                        <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none text-sm font-medium transition-all"
                        />
                    </div>
                    <button onClick={handleDeleteAllOrders} className="bg-red-50 hover:bg-red-100 text-red-600 px-5 py-3 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2">
                        <i className="fa-solid fa-trash-can"></i> Clear All
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center text-gray-400">
                    <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3"></i>
                    <p className="font-bold">Loading live orders...</p>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center">
                    <i className="fa-solid fa-box-open text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">No Orders Found</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredOrders.map(order => (
                        <OrderCard 
                            key={order.id} 
                            order={order} 
                            onUpdateStatus={handleUpdateStatus}
                            onDelete={handleDeleteOrder}
                            onViewItems={setSelectedOrder}
                            onOpenMap={handleOpenMap}
                            getStatusColor={getStatusColor}
                        />
                    ))}
                </div>
            )}

            {selectedOrder && (
                <OrderDetailsModal 
                    order={selectedOrder} 
                    onClose={() => setSelectedOrder(null)} 
                />
            )}
        </div>
    );
}
