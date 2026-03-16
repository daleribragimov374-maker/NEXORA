import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error && data) {
                const formatted = data.map(p => ({
                    id: p.id,
                    text: p.status === 'completed'
                        ? `To'lov tasdiqlandi! ${p.amount} Token hisobingizga tushdi.`
                        : p.status === 'rejected'
                            ? `To'lov rad etildi. Iltimos, qayta urinib ko'ring.`
                            : `To'lov yuborildi va tasdiqlash kutilmoqda ($${p.price.toFixed(2)})`,
                    time: new Date(p.created_at).toLocaleString(),
                    unread: p.status !== 'pending', // Just a representative logic
                    status: p.status
                }));
                setNotifications(formatted);
            }
            setIsLoading(false);
        };
        fetchNotifications();
    }, []);

    const markAllAsRead = () => {
        setNotifications(notifications.map(notif => ({ ...notif, unread: false })));
    };

    const markAsRead = (id) => {
        setNotifications(notifications.map(notif =>
            notif.id === id ? { ...notif, unread: false } : notif
        ));
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="main-content">
                <TopNav />
                <div className="dashboard-scroll" style={{ display: 'flex', justifyContent: 'center' }}>

                    <div style={{ width: '100%', maxWidth: '700px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: 'var(--text-main)' }}>Notifications</h2>
                            <button
                                onClick={markAllAsRead}
                                style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontWeight: '500' }}
                            >
                                Mark all as read
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {notifications.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                                    Hech qanday bildirishnoma yo'q
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        onClick={() => markAsRead(notif.id)}
                                        style={{
                                            display: 'flex',
                                            gap: '1rem',
                                            background: notif.unread ? 'var(--bg-hover)' : 'var(--bg-panel)',
                                            padding: '1.25rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border-main)',
                                            alignItems: 'flex-start',
                                            cursor: notif.unread ? 'pointer' : 'default',
                                            transition: 'background 0.2s ease'
                                        }}
                                    >
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: notif.unread ? '#3b82f6' : 'transparent', marginTop: '0.4rem', transition: 'background 0.2s ease' }}></div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '1rem', color: 'var(--text-main)', fontWeight: notif.unread ? '600' : 'normal', transition: 'font-weight 0.2s ease' }}>{notif.text}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{notif.time}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
