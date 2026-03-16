import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, Users, Layout, Shield, Search, CreditCard as Store } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';

export default function Admin() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('users');

    const [usersList, setUsersList] = useState([]);
    const [gamesList, setGamesList] = useState([]);
    const [paymentsList, setPaymentsList] = useState([]);

    const [processingId, setProcessingId] = useState(null);

    // Hardcoded admin UUIDs for safety
    const ADMIN_UUIDS = [
        '99160839-ad7a-42ce-8ce1-706e0cff1886',
        '21d6a968-5ecf-48db-ab7e-ca8d4575ff8b'
    ];

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            navigate('/');
            return;
        }

        if (ADMIN_UUIDS.includes(user.id)) {
            setIsAdmin(true);
            fetchData();
        } else {
            // Check if database also marks as admin
            const checkAdmin = async () => {
                const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
                if (data?.is_admin) {
                    setIsAdmin(true);
                    fetchData();
                } else {
                    navigate('/home');
                }
            };
            checkAdmin();
        }
    }, [user, authLoading, navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch users
            const { data: profiles, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .order('updated_at', { ascending: false });

            if (!pError && profiles) {
                setUsersList(profiles);
            }

            // Fetch games/experiences
            const { data: exps, error: eError } = await supabase
                .from('experiences')
                .select('*, profiles(username)')
                .order('created_at', { ascending: false });

            if (!eError && exps) {
                setGamesList(exps);
            }

            // Fetch payments
            const { data: payments, error: ptError } = await supabase
                .from('payments')
                .select('*, profiles(username, tokens)')
                .order('created_at', { ascending: false });

            if (!ptError && payments) {
                console.log("Fetched payments count:", payments.length);
                setPaymentsList(payments);
            } else if (ptError) {
                console.error("Payments fetch error:", ptError);
            }

        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteGame = async (id) => {
        if (!window.confirm("Haqiqatan ham bu oyinni o'chirmoqchimisiz?")) return;
        const { error } = await supabase.from('experiences').delete().eq('id', id);
        if (!error) {
            setGamesList(gamesList.filter(g => g.id !== id));
        } else {
            alert("O'chirishda xatolik yuz berdi: " + error.message);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Haqiqatan ham bu foydalanuvchini (profili) o'chirmoqchimisiz?")) return;
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (!error) {
            setUsersList(usersList.filter(u => u.id !== id));
        } else {
            alert("O'chirishda xatolik yuz berdi: " + error.message);
        }
    };

    const handleApprovePayment = async (payment) => {
        setProcessingId(payment.id);
        try {
            const { data: profile } = await supabase.from('profiles').select('tokens').eq('id', payment.user_id).single();
            const newTotal = (profile?.tokens || 0) + payment.amount;

            // 1. Update tokens
            const { error: pError } = await supabase.from('profiles').update({ tokens: newTotal }).eq('id', payment.user_id);
            if (pError) throw pError;

            // 2. Update payment status
            const { error: payError } = await supabase.from('payments').update({ status: 'completed' }).eq('id', payment.id);
            if (payError) throw payError;

            setPaymentsList(paymentsList.map(p => p.id === payment.id ? { ...p, status: 'completed' } : p));
            alert("To'lov tasdiqlandi!");
        } catch (error) {
            console.error("Admin action error:", error);
            // showNotification or similar would be better, but we don't have it here yet
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectPayment = async (id) => {
        if (!window.confirm("Rad etmoqchimisiz?")) return;
        setProcessingId(id);
        const { error } = await supabase.from('payments').update({ status: 'rejected' }).eq('id', id);
        if (!error) {
            setPaymentsList(paymentsList.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
        }
        setProcessingId(null);
    };



    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-main)' }}>Loading Admin Panel...</div>;
    }

    if (!isAdmin) return null;

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <div className="main-content">
                <TopNav />

                <div className="dashboard-scroll" style={{ paddingBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', background: 'var(--bg-panel)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '1rem', borderRadius: '50%', color: '#3b82f6' }}>
                            <Shield size={40} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>Admin Panel</h1>
                            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)' }}>Tizimni to'liq boshqarish paneli (Faqat siz uchun!)</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        <div style={{ background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-main)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '1rem', borderRadius: '12px', color: '#10b981' }}>
                                <Users size={32} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Umumiy foydalanuvchilar</h3>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{usersList.length}</p>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-main)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '1rem', borderRadius: '12px', color: '#8b5cf6' }}>
                                <Layout size={32} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Umumiy o'yinlar</h3>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{gamesList.length}</p>
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-main)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ background: 'rgba(251, 191, 36, 0.15)', padding: '1rem', borderRadius: '12px', color: '#fbbf24' }}>
                                <Store size={32} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem' }}>Pending To'lovlar</h3>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{paymentsList.filter(p => p.status === 'pending').length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-main)', paddingBottom: '0.5rem' }}>
                        <button
                            onClick={() => setActiveTab('users')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: activeTab === 'users' ? '#3b82f6' : 'var(--text-muted)',
                                fontWeight: activeTab === 'users' ? 'bold' : 'normal',
                                fontSize: '1.1rem',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                borderBottom: activeTab === 'users' ? '2px solid #3b82f6' : '2px solid transparent',
                                marginBottom: '-9px'
                            }}
                        >
                            Foydalanuvchilar
                        </button>
                        <button
                            onClick={() => setActiveTab('games')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: activeTab === 'games' ? '#3b82f6' : 'var(--text-muted)',
                                fontWeight: activeTab === 'games' ? 'bold' : 'normal',
                                fontSize: '1.1rem',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                borderBottom: activeTab === 'games' ? '2px solid #3b82f6' : '2px solid transparent',
                                marginBottom: '-9px'
                            }}
                        >
                            O'yinlar (Experiences)
                        </button>
                        <button
                            onClick={() => setActiveTab('payments')}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: activeTab === 'payments' ? '#fbbf24' : 'var(--text-muted)',
                                fontWeight: activeTab === 'payments' ? 'bold' : 'normal',
                                fontSize: '1.1rem',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                borderBottom: activeTab === 'payments' ? '2px solid #fbbf24' : '2px solid transparent',
                                marginBottom: '-9px'
                            }}
                        >
                            To'lovlar
                        </button>

                    </div>

                    {/* Tab Content */}
                    <div style={{ background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-main)', overflow: 'hidden' }}>
                        {activeTab === 'users' && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-main)', background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Avatar</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Username</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>ID</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Amallar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersList.length === 0 ? (
                                        <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Foydalanuvchilar mavjud emas</td></tr>
                                    ) : usersList.map(user => (
                                        <tr key={user.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.username} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{user.username || "Noma'lum"}</td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>{user.id}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <button onClick={() => handleDeleteUser(user.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }} title="O'chirish">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'games' && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-main)', background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Rasm</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Sarlavha</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Yaratuvchi</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Amallar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gamesList.length === 0 ? (
                                        <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>O'yinlar mavjud emas</td></tr>
                                    ) : gamesList.map(game => (
                                        <tr key={game.id} style={{ borderBottom: '1px solid var(--border-main)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <img src={game.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300'} alt={game.title} style={{ width: '60px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                                            </td>
                                            <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{game.title}</td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{game.profiles?.username || game.user_id}</td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <button onClick={() => handleDeleteGame(game.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer' }} title="O'chirish">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'payments' && (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-main)', background: 'rgba(255,255,255,0.02)' }}>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Foydalanuvchi</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Token / Narx</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Usul / Sana</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Status</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Amallar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentsList.length === 0 ? (
                                        <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>To'lovlar mavjud emas</td></tr>
                                    ) : paymentsList.map(payment => (
                                        <tr key={payment.id} style={{ borderBottom: '1px solid var(--border-main)', opacity: payment.status !== 'pending' ? 0.7 : 1 }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--text-main)' }}>@{payment.profiles?.username || 'user'}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>{payment.amount} Token</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{payment.price.toLocaleString()} so'm</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{payment.payment_method === 'manual' ? 'P2P' : 'Karta'}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(payment.created_at).toLocaleDateString()}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.3rem 0.6rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 'bold',
                                                    background: payment.status === 'pending' ? 'rgba(251, 191, 36, 0.1)' : payment.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: payment.status === 'pending' ? '#fbbf24' : payment.status === 'completed' ? '#10b981' : '#ef4444'
                                                }}>{payment.status.toUpperCase()}</span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                {payment.status === 'pending' && (
                                                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => handleApprovePayment(payment)}
                                                            disabled={processingId === payment.id}
                                                            style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                                                        >tasdiqlash</button>
                                                        <button
                                                            onClick={() => handleRejectPayment(payment.id)}
                                                            disabled={processingId === payment.id}
                                                            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                                                        >rad etish</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
