'use client';

import React from 'react';

export default function OrderDetailsModal({ order, onClose }) {
    if (!order) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slideUp text-slate-800">
                <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <i className="fa-solid fa-list-check text-blue-500"></i> Order Details
                    </h3>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition">
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Order ID</span>
                            <span className="font-mono text-gray-700 font-medium">{order.id}</span>
                        </div>
                        <div>
                            <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Customer</span>
                            <span className="text-gray-700 font-medium">{order.userName || 'Guest'}</span>
                        </div>
                        <div className="col-span-2">
                            <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Address</span>
                            <span className="text-gray-700">{order.address || 'N/A'}</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Items Purchased</h4>
                        <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="p-3 flex justify-between items-center bg-white">
                                    <div className="flex items-center gap-3">
                                        <span className="bg-slate-100 text-slate-600 font-bold text-xs px-2 py-1 rounded-md">{item.qty}x</span>
                                        <span className="text-sm font-medium text-gray-800">{item.name}</span>
                                    </div>
                                    <span className="font-bold text-emerald-600 text-sm">₹{(item.price * item.qty).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-5 bg-slate-50 border-t border-gray-100 rounded-b-3xl flex justify-between items-center">
                    <span className="font-bold text-slate-600">Total Amount</span>
                    <span className="text-2xl font-black text-emerald-600">₹{order.totalAmount?.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
}
