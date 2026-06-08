'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/services/firebase';
import {
    collection,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    query,
    orderBy
} from 'firebase/firestore';

export default function WebsiteConfigPage() {
    const [categories, setCategories] = useState([]);
    const [homeCategoriesList, setHomeCategoriesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddVisible, setIsAddVisible] = useState(true);

    const [newCat, setNewCat] = useState({
        name: '',
        slug: '',
        image: '',
        pos: ''
    });

    useEffect(() => {
        const catQuery = query(collection(db, 'homeCategories'), orderBy('pos'));
        const unsubscribeHome = onSnapshot(catQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
            setHomeCategoriesList(items);
            setLoading(false);
        });

        const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
            const cats = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
            setCategories(cats);
        });

        return () => {
            unsubscribeHome();
            unsubscribeCategories();
        };
    }, []);

    const handleAddCategory = async () => {
        if (!newCat.name || !newCat.slug || !newCat.image || !newCat.pos) {
            return alert('Please fill all fields!');
        }
        
        try {
            await setDoc(doc(db, 'homeCategories', newCat.slug), {
                name: newCat.name,
                slug: newCat.slug,
                image: newCat.image,
                pos: Number(newCat.pos)
            });
            setNewCat({ name: '', slug: '', image: '', pos: '' });
            alert('Category added successfully!');
        } catch (error) {
            console.error('Error adding category:', error);
            alert('Failed to add category: ' + error.message);
        }
    };

    const handleDeleteCategory = async (slug, name) => {
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
            try {
                await deleteDoc(doc(db, 'homeCategories', slug));
            } catch (error) {
                console.error('Error deleting category:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-4"></i>
                <p className="font-medium">Loading configuration...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn pb-12 text-slate-800">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                        <i className="fa-solid fa-laptop-code"></i>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Website Configuration</h3>
                </div>

                <div className="p-6 space-y-8">
                    {/* Add Category Section */}
                    <div>
                        <button 
                            onClick={() => setIsAddVisible(!isAddVisible)} 
                            className="flex items-center justify-between w-full mb-4 group"
                        >
                            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest group-hover:text-indigo-500 transition-colors">
                                Add Home Page Category
                            </h4>
                            <i className={`fa-solid fa-chevron-down text-gray-400 transition-transform ${isAddVisible ? 'rotate-180' : ''}`}></i>
                        </button>
                        
                        {isAddVisible && (
                            <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                                <div className="flex flex-col gap-1.5 lg:col-span-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Brownies" 
                                        className="border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800"
                                        value={newCat.name}
                                        onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5 lg:col-span-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Slug (Menu Filter)</label>
                                    <select 
                                        className="border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800"
                                        value={newCat.slug}
                                        onChange={e => setNewCat({ ...newCat, slug: e.target.value })}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.docId} value={cat.slug}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5 lg:col-span-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Position</label>
                                    <input 
                                        type="number" 
                                        placeholder="e.g. 1" 
                                        className="border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800"
                                        value={newCat.pos}
                                        onChange={e => setNewCat({ ...newCat, pos: e.target.value })}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5 lg:col-span-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Image URL</label>
                                    <input 
                                        type="text" 
                                        placeholder="https://..." 
                                        className="border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800"
                                        value={newCat.image}
                                        onChange={e => setNewCat({ ...newCat, image: e.target.value })}
                                    />
                                </div>
                                <div className="lg:col-span-1">
                                    <button 
                                        onClick={handleAddCategory}
                                        className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20"
                                    >
                                        Add Category
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-gray-50">
                        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Active Home Categories</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {homeCategoriesList.length === 0 ? (
                                <p className="text-gray-400 text-sm col-span-full">No categories found. Add some above to display on the home page.</p>
                            ) : (
                                homeCategoriesList.map((cat) => (
                                    <div key={cat.docId} className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group relative">
                                        <div className="h-32 w-full bg-gray-100 relative">
                                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                                            <div className="absolute top-2 right-2 flex gap-2">
                                                <div className="bg-white/90 text-slate-800 text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm shadow-sm">
                                                    Pos: {cat.pos}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h5 className="font-bold text-gray-800 mb-1">{cat.name}</h5>
                                            <p className="text-xs text-gray-500 mb-4 font-mono">Slug: {cat.slug}</p>
                                            <button 
                                                onClick={() => handleDeleteCategory(cat.docId, cat.name)}
                                                className="w-full flex justify-center items-center gap-2 py-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition-colors"
                                            >
                                                <i className="fa-solid fa-trash-can"></i> Delete
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl">
                <div className="flex gap-4">
                    <div className="text-blue-500">
                        <i className="fa-solid fa-circle-info text-2xl"></i>
                    </div>
                    <div>
                        <h4 className="font-bold text-blue-900">Dynamic Home Page</h4>
                        <p className="text-blue-700/80 text-sm mt-1 leading-relaxed">
                            Changes made to the categories here are updated instantly on the main website's "Explore Our Menu" section. Make sure the <strong>Slug</strong> perfectly matches the category filters defined in the Menu.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
