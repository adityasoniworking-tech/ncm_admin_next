'use client';

import React from 'react';
import { useAdmin } from '@/context/AdminContext';
import { useRouter } from 'next/navigation';
import { db } from '@/services/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';

// Lazy load heavy chart components for better initial performance
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });

// Chart Skeleton for smoother loading
const ChartPlaceholder = () => (
    <div className="w-full h-full bg-slate-50 animate-pulse rounded-3xl flex items-center justify-center border border-slate-100 border-dashed">
        <div className="flex gap-2">
            {[1, 2, 3].map(i => <div key={i} className="w-1 bg-blue-100 h-16 rounded-full"></div>)}
        </div>
    </div>
);

export default function DashboardContent() {
    const { stats, inventory } = useAdmin();
    const router = useRouter();
    const [isMounted, setIsMounted] = React.useState(false);
    const [isOutOfStockModalOpen, setIsOutOfStockModalOpen] = React.useState(false);
    const [outOfStockSearch, setOutOfStockSearch] = React.useState('');
    const [selectedCat, setSelectedCat] = React.useState('all');

    const categories = React.useMemo(() => {
        if (!inventory.outOfStockItems) return [];
        const cats = inventory.outOfStockItems.map(item => item.cat).filter(Boolean);
        return ['all', ...Array.from(new Set(cats))];
    }, [inventory.outOfStockItems]);

    const filteredOutOfStockItems = React.useMemo(() => {
        if (!inventory.outOfStockItems) return [];
        return inventory.outOfStockItems.filter(item => {
            const matchesSearch = (item.name?.toLowerCase().includes(outOfStockSearch.toLowerCase())) || 
                                 String(item.id).includes(outOfStockSearch);
            const matchesCategory = selectedCat === 'all' || item.cat === selectedCat;
            return matchesSearch && matchesCategory;
        });
    }, [inventory.outOfStockItems, outOfStockSearch, selectedCat]);

    React.useEffect(() => {
        if (!isOutOfStockModalOpen) {
            setOutOfStockSearch('');
            setSelectedCat('all');
        }
    }, [isOutOfStockModalOpen]);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const refreshStats = () => {
        alert('Dashboard statistics are up-to-date (Live Sync Enabled)');
    };

    const exportData = async () => {
        try {
            const ordersRef = collection(db, 'orders');
            const snapshot = await getDocs(ordersRef);
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            let csv = '--- DASHBOARD SUMMARY ---\n';
            csv += `Total Orders,${orders.length}\n`;
            csv += `Pending Orders,${stats.pendingOrders}\n`;
            csv += `Total Revenue,₹${stats.revenue.toFixed(2)}\n`;
            csv += `Export Date,${new Date().toLocaleString('en-IN')}\n\n`;

            csv += 'Order ID,Customer Name,Phone,Email,Address,Items Ordered,Payment Method,Total Amount,Status,Timestamp\n';

            orders.forEach(order => {
                const customerName = order.userName || order.customerName || 'Guest';
                const phone = order.phone || 'N/A';
                const email = order.userEmail || 'N/A';
                const address = (order.address || 'N/A').replace(/["\r\n]/g, ' ');
                const items = order.items ? order.items.map(i => `${i.qty}x ${i.name}`).join('; ') : 'N/A';
                const payment = order.paymentMethod || 'N/A';
                const total = order.totalAmount || 0;
                const status = order.status || 'Pending';
                const date = order.timestamp?.toDate ? order.timestamp.toDate().toLocaleString('en-IN') : 'N/A';

                csv += `"${order.id}","${customerName}","${phone}","${email}","${address}","${items}","${payment}","${total}","${status}","${date}"\n`;
            });

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            alert('Orders data exported successfully!');
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Error exporting data. Please try again.');
        }
    };

    return (
        <div className="space-y-10">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                <div className="glass-card p-5 md:p-8 rounded-[2rem] hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 group animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total Orders</p>
                            <h2 className="text-4xl font-black text-slate-800 tracking-tighter group-hover:text-blue-600 transition-colors">{stats.totalOrders}</h2>
                        </div>
                        <div className="p-4 bg-blue-500/10 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                            <i className="fa-solid fa-shopping-bag text-2xl"></i>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-5 md:p-8 rounded-[2rem] hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 group animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Pending Delivery</p>
                            <h2 className="text-4xl font-black text-slate-800 tracking-tighter group-hover:text-amber-600 transition-colors">{stats.pendingOrders}</h2>
                        </div>
                        <div className="p-4 bg-amber-500/10 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all duration-500">
                            <i className="fa-solid fa-clock-rotate-left text-2xl"></i>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-5 md:p-8 rounded-[2rem] hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-500 group animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Live Revenue</p>
                            <h2 className="text-4xl font-black text-slate-800 tracking-tighter group-hover:text-green-600 transition-colors">₹{stats.revenue.toLocaleString('en-IN')}</h2>
                        </div>
                        <div className="p-4 bg-green-500/10 text-green-600 rounded-2xl group-hover:bg-green-600 group-hover:text-white transition-all duration-500">
                            <i className="fa-solid fa-indian-rupee-sign text-2xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Chart */}
            <div className="glass-card p-10 rounded-[3rem] animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h3 className="text-2xl font-black tracking-tighter text-slate-800">Performance Trend</h3>
                        <p className="text-slate-500 font-bold text-[10px] tracking-widest uppercase">7-Day Sales Analysis</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-100">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span className="text-[10px] font-bold text-blue-600 uppercase">Revenue</span>
                        </div>
                    </div>
                </div>

                <div className="h-[300px] w-full min-h-[300px] relative">
                    {isMounted ? (
                        <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                                        borderRadius: '1rem', 
                                        border: 'none', 
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                        padding: '1rem'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    labelStyle={{ fontSize: '10px', fontWeight: '900', color: '#64748b', marginBottom: '4px' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#3b82f6" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorRev)" 
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : <ChartPlaceholder />}
                </div>
            </div>

            {/* Inventory Health */}
            <div className="glass-card p-10 rounded-[3rem] relative overflow-hidden group animate-fadeIn" style={{ animationDelay: '0.5s' }}>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none transition-transform duration-1000 group-hover:scale-110"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-amber-500/10 rounded-[1.25rem] flex items-center justify-center border border-amber-500/10 shadow-sm">
                                <i className="fa-solid fa-warehouse text-amber-500 text-2xl"></i>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black tracking-tighter text-slate-800">Inventory Health</h3>
                                <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Live Stock Monitor</p>
                            </div>
                        </div>
                        <button onClick={refreshStats} className="bg-slate-800 hover:bg-slate-900 px-6 py-3 rounded-2xl text-sm font-black tracking-widest uppercase transition-all shadow-lg shadow-slate-200 text-white">
                            Check Stock Level
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                        <div
                            onClick={() => setIsOutOfStockModalOpen(true)}
                            className="bg-white/50 backdrop-blur-md p-5 md:p-8 rounded-[2rem] border border-white relative overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-white/80 active:scale-[0.98] group/card"
                        >
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-red-500 font-black text-[10px] tracking-[0.2em] uppercase group-hover/card:text-red-600 transition-colors">Critical</span>
                                <span className="text-4xl font-black text-red-500 drop-shadow-sm group-hover/card:scale-110 transition-transform duration-300 origin-bottom-right">{inventory.outOfStock}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden ring-1 ring-slate-200">
                                <div
                                    className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${(inventory.outOfStock / (inventory.total || 1)) * 100}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between items-center mt-5">
                                <p className="text-slate-500 text-xs font-bold tracking-wide uppercase">Out of Stock</p>
                                <span className="text-[10px] text-blue-500 font-black tracking-widest uppercase opacity-0 group-hover/card:opacity-100 transition-opacity">View List &rarr;</span>
                            </div>
                        </div>

                        <div className="bg-white/50 backdrop-blur-md p-5 md:p-8 rounded-[2rem] border border-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-green-600 font-black text-[10px] tracking-[0.2em] uppercase">Healthy</span>
                                <span className="text-4xl font-black text-green-500 drop-shadow-sm">{inventory.inStock}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden ring-1 ring-slate-200">
                                <div
                                    className="bg-gradient-to-r from-green-600 to-green-400 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${(inventory.inStock / (inventory.total || 1)) * 100}%` }}
                                ></div>
                            </div>
                            <p className="mt-5 text-slate-500 text-xs font-bold tracking-wide uppercase">Available Units</p>
                        </div>

                        <div className="bg-white/50 backdrop-blur-md p-5 md:p-8 rounded-[2rem] border border-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-end mb-4">
                                <span className="text-blue-600 font-black text-[10px] tracking-[0.2em] uppercase">Total Catalog</span>
                                <span className="text-4xl font-black text-blue-500 drop-shadow-sm">{inventory.total}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden ring-1 ring-slate-200">
                                <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full w-full"></div>
                            </div>
                            <p className="mt-5 text-slate-500 text-xs font-bold tracking-wide uppercase">Listed Products</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
                <button
                    onClick={() => router.push('/menu')}
                    className="glass-card flex flex-col sm:flex-row items-center gap-3 sm:gap-5 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] hover:bg-amber-500 hover:text-white transition-all duration-500 group text-center sm:text-left last:col-span-2 lg:last:col-span-1"
                >
                    <div className="w-14 h-14 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-white/20 group-hover:text-white transition-all duration-500 shadow-inner">
                        <i className="fa-solid fa-cookie-bite text-2xl"></i>
                    </div>
                    <div className="text-left">
                        <span className="block font-black text-slate-800 group-hover:text-white leading-tight">Master Menu</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-white/70">Update Stock</span>
                    </div>
                </button>

                <button
                    onClick={exportData}
                    className="glass-card flex flex-col sm:flex-row items-center gap-3 sm:gap-5 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] hover:bg-green-600 hover:text-white transition-all duration-500 group text-center sm:text-left last:col-span-2 lg:last:col-span-1"
                >
                    <div className="w-14 h-14 bg-green-500/10 text-green-600 rounded-2xl flex items-center justify-center group-hover:bg-white/20 group-hover:text-white transition-all duration-500 shadow-inner">
                        <i className="fa-solid fa-file-csv text-2xl"></i>
                    </div>
                    <div className="text-left">
                        <span className="block font-black text-slate-800 group-hover:text-white leading-tight">Export Data</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-white/70">Sales Report</span>
                    </div>
                </button>

                <button
                    onClick={refreshStats}
                    className="glass-card flex flex-col sm:flex-row items-center gap-3 sm:gap-5 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] hover:bg-blue-600 hover:text-white transition-all duration-500 group text-center sm:text-left last:col-span-2 lg:last:col-span-1"
                >
                    <div className="w-14 h-14 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-white/20 group-hover:text-white transition-all duration-500 shadow-inner">
                        <i className="fa-solid fa-sync text-2xl group-hover:rotate-180 transition-transform duration-700"></i>
                    </div>
                    <div className="text-left">
                        <span className="block font-black text-slate-800 group-hover:text-white leading-tight">Sync Portal</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-white/70">Refresh Stats</span>
                    </div>
                </button>
            </div>

            {/* Out of Stock Modal */}
            {isOutOfStockModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300 animate-fadeIn" 
                        onClick={() => setIsOutOfStockModalOpen(false)}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-slate-100 p-6 md:p-8 overflow-hidden z-10 max-h-[85vh] flex flex-col animate-scaleIn">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black tracking-tighter text-slate-800 flex items-center gap-2">
                                    Out of Stock Items
                                    <span className="bg-red-500/10 text-red-500 text-xs font-extrabold px-2.5 py-1 rounded-full">
                                        {inventory.outOfStockItems?.length || 0}
                                    </span>
                                </h3>
                                <p className="text-slate-500 font-bold text-xs tracking-widest uppercase mt-0.5">Quick Stock Control</p>
                            </div>
                            <button 
                                onClick={() => setIsOutOfStockModalOpen(false)}
                                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-all"
                            >
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        {/* Search & Filters */}
                        {inventory.outOfStockItems && inventory.outOfStockItems.length > 0 && (
                            <div className="mb-6 space-y-4">
                                {/* Search Bar */}
                                <div className="relative">
                                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                    <input 
                                        type="text" 
                                        placeholder="Search out-of-stock items..." 
                                        value={outOfStockSearch}
                                        onChange={(e) => setOutOfStockSearch(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-400/50 text-slate-800 text-sm font-medium transition-all"
                                    />
                                    {outOfStockSearch && (
                                        <button 
                                            onClick={() => setOutOfStockSearch('')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            <i className="fa-solid fa-circle-xmark"></i>
                                        </button>
                                    )}
                                </div>

                                {/* Category Pills */}
                                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCat(cat)}
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                                                selectedCat === cat
                                                    ? 'bg-slate-800 text-white shadow-md shadow-slate-800/10'
                                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-100'
                                            }`}
                                        >
                                            {cat === 'all' ? 'Show All' : cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* List container */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0 hide-scrollbar">
                            {!inventory.outOfStockItems || inventory.outOfStockItems.length === 0 ? (
                                <div className="text-center py-12 flex flex-col items-center justify-center">
                                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 text-green-500">
                                        <i className="fa-solid fa-circle-check text-4xl"></i>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-800">All Items In Stock!</h4>
                                    <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mt-1">Excellent Inventory Health</p>
                                </div>
                            ) : filteredOutOfStockItems.length === 0 ? (
                                <div className="text-center py-12 flex flex-col items-center justify-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                        <i className="fa-solid fa-magnifying-glass text-3xl"></i>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-800">No Match Found</h4>
                                    <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Try searching for something else</p>
                                </div>
                            ) : (
                                filteredOutOfStockItems.map((item) => (
                                    <div 
                                        key={item.docId} 
                                        className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:shadow-md"
                                    >
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            {item.image ? (
                                                <img 
                                                    src={item.image} 
                                                    alt={item.name} 
                                                    className="w-14 h-14 rounded-xl object-cover border border-slate-100"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://images.unsplash.com/photo-1515037893149-de7f840978e2";
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <i className="fa-solid fa-cookie text-xl"></i>
                                                </div>
                                            )}
                                            <div className="text-left">
                                                <h4 className="font-black text-slate-800 text-sm leading-snug">{item.name}</h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">ID: {item.id}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span className="bg-slate-200/60 text-slate-600 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                                                        {item.cat}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100/60">
                                            <div className="text-left sm:text-right">
                                                <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Price</span>
                                                <span className="text-sm font-black text-slate-800">₹{item.price}</span>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const itemRef = doc(db, 'menu', item.docId);
                                                        await updateDoc(itemRef, { inStock: true });
                                                    } catch (error) {
                                                        console.error('Error updating stock status:', error);
                                                        alert('Failed to update stock status.');
                                                    }
                                                }}
                                                className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-[10px] font-black tracking-widest uppercase px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                                            >
                                                <i className="fa-solid fa-circle-check"></i>
                                                Mark In Stock
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
