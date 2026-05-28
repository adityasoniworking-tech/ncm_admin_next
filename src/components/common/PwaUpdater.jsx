'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import packageInfo from '../../../package.json';

export default function PWAUpdater() {
    const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            'serviceWorker' in navigator &&
            window.workbox !== undefined
        ) {
            const wb = window.workbox;

            const promptNewVersionAvailable = () => {
                setShowUpdatePrompt(true);
            };

            wb.addEventListener('waiting', promptNewVersionAvailable);
            
            // Check for updates every 10 minutes (600,000 ms) automatically 
            // so the user gets the popup even if they don't refresh the page
            const updateInterval = setInterval(() => {
                wb.update();
            }, 10 * 60 * 1000);

            return () => {
                clearInterval(updateInterval);
                wb.removeEventListener('waiting', promptNewVersionAvailable);
            };
        }
    }, []);

    const handleUpdate = () => {
        if (window.workbox) {
            window.workbox.addEventListener('controlling', () => {
                window.location.reload();
            });
            window.workbox.messageSkipWaiting();
        }
        setShowUpdatePrompt(false);
    };

    return (
        <AnimatePresence>
            {showUpdatePrompt && (
                <motion.div
                    initial={{ y: 100, x: '-50%', opacity: 0 }}
                    animate={{ y: 0, x: '-50%', opacity: 1 }}
                    exit={{ y: 100, x: '-50%', opacity: 0 }}
                    style={styles.toast}
                >
                    <div style={styles.content}>
                        <div style={styles.iconContainer}>
                            <i className="fa-solid fa-download"></i>
                        </div>
                        <div style={styles.textContainer}>
                            <h4 style={styles.title}>Update Available!</h4>
                            <p style={styles.desc}>A new version of the app is available. (Current: v{packageInfo.version})</p>
                        </div>
                        <button
                            onClick={handleUpdate}
                            style={styles.updateBtn}
                        >
                            Update App
                        </button>
                        <button
                            onClick={() => setShowUpdatePrompt(false)}
                            style={styles.closeBtn}
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

const styles = {
    toast: {
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        zIndex: 10000,
        width: 'calc(100% - 40px)',
        maxWidth: '400px'
    },
    content: {
        background: '#1a1a1a',
        padding: '16px 20px',
        borderRadius: '20px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    iconContainer: {
        width: '40px',
        height: '40px',
        background: 'var(--primary-color, #c8a165)',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontSize: '1.2rem'
    },
    textContainer: {
        flex: 1
    },
    title: {
        margin: 0,
        fontSize: '0.95rem',
        fontWeight: '800',
        color: 'white'
    },
    desc: {
        margin: '2px 0 0',
        fontSize: '0.75rem',
        color: '#999',
        fontWeight: '500'
    },
    updateBtn: {
        background: 'var(--primary-color, #c8a165)',
        color: 'white',
        border: 'none',
        padding: '8px 12px',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '0.85rem'
    },
    closeBtn: {
        background: 'transparent',
        border: 'none',
        color: '#555',
        cursor: 'pointer',
        fontSize: '1.2rem',
        padding: '5px'
    }
};
