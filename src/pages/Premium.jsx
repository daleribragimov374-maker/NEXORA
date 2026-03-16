import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Shield, Zap, CreditCard, Send, X, Star, Copy } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function Premium() {
    const navigate = useNavigate();
    const { user: authUser, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [tokens, setTokens] = useState(0);
    const [activeModal, setActiveModal] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (authLoading) return;
        if (authUser) {
            setUser(authUser);
            fetchTokens(authUser.id);
        } else {
            navigate('/sign-in');
        }
    }, [authUser, authLoading, navigate]);

    const fetchTokens = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('tokens')
                .eq('id', userId)
                .single();

            if (data && !error) {
                setTokens(data.tokens || 0);
            }
        } catch (err) {
            console.error("Error fetching tokens:", err);
        }
    };

    const packages = [
        { id: '100', tokens: 100, price: 5000, popular: false, color: '#3b82f6' },
        { id: '500', tokens: 500, price: 20000, popular: true, color: '#8b5cf6' },
        { id: '1000', tokens: 1000, price: 35000, popular: false, color: '#f59e0b' },
    ];

    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
    };

    const handlePurchase = (pkg) => {
        setSelectedPackage(pkg);
        setActiveModal('payment-method');
    };

    const handleMethodSelect = (method) => {
        if (method === 'card') {
            setActiveModal('card-payment');
        } else {
            setActiveModal('p2p-payment');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showNotification("Nusxa olindi!");
    };

    const handlePaymentSubmit = async (method) => {
        setLoading(true);
        try {
            const { error } = await supabase.from('payments').insert({
                user_id: user.id,
                amount: selectedPackage.tokens,
                price: selectedPackage.price,
                payment_method: method,
                status: 'pending'
            });

            if (error) throw error;

            setActiveModal('success');
            showNotification("Sorov yuborildi! Tasdiqlash kutilyapti.");
        } catch (error) {
            console.error("Payment error:", error);
            showNotification("Xatolik yuz berdi. Iltimos qaytadan urunib ko'ring.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="main-content">
                <TopNav />
                <div className="dashboard-scroll" style={{ padding: '2rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '1rem', background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>GET NEXORA TOKENS</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto 2rem', lineHeight: '1.6' }}>Upgrade your journey with Nexora Tokens. Unlock premium features, exclusive games, and special abilities across the platform.</p>

                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '0.8rem 1.5rem',
                            borderRadius: '100px',
                            border: '1px solid var(--border-main)',
                            backdropFilter: 'blur(10px)'
                        }}>
                            <div style={{ background: '#f59e0b20', padding: '6px', borderRadius: '50%', display: 'flex' }}>
                                <Zap size={18} fill="#f59e0b" color="#f59e0b" />
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Sizning balansingiz:</span>
                            <span style={{ color: 'var(--text-main)', fontWeight: '900', fontSize: '1.2rem' }}>{tokens?.toLocaleString() || 0} Tokens</span>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
                        {packages.map((pkg) => (
                            <div
                                key={pkg.id}
                                style={{
                                    background: 'var(--bg-panel)',
                                    borderRadius: '32px',
                                    padding: '3rem 2.5rem',
                                    border: pkg.popular ? `2px solid ${pkg.color}` : '1px solid var(--border-main)',
                                    position: 'relative',
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    cursor: 'default',
                                    boxShadow: pkg.popular ? `0 20px 40px ${pkg.color}15` : 'none'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-12px)';
                                    e.currentTarget.style.boxShadow = `0 30px 60px rgba(0,0,0,0.4), 0 0 30px ${pkg.color}25`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = pkg.popular ? `0 20px 40px ${pkg.color}15` : 'none';
                                }}
                            >
                                {pkg.popular && (
                                    <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: pkg.color, color: '#fff', padding: '0.5rem 1.2rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: `0 4px 12px ${pkg.color}40` }}>
                                        MOST POPULAR
                                    </div>
                                )}

                                <div style={{ background: `${pkg.color}20`, width: '72px', height: '72px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem', color: pkg.color }}>
                                    <Zap size={36} fill={pkg.color} />
                                </div>

                                <h2 style={{ fontSize: '2.2rem', fontWeight: '900', margin: '0 0 0.5rem 0', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>{pkg.tokens} <span style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-muted)' }}>Tokens</span></h2>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '2.5rem' }}>
                                    <span style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--text-main)' }}>{pkg.price.toLocaleString()}</span>
                                    <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>so'm</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '3rem', flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-main)', fontSize: '1.05rem' }}>
                                        <div style={{ background: '#10b98120', padding: '4px', borderRadius: '50%' }}><Check size={16} color="#10b981" strokeWidth={3} /></div> <span>Premium Badge</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-main)', fontSize: '1.05rem' }}>
                                        <div style={{ background: '#10b98120', padding: '4px', borderRadius: '50%' }}><Check size={16} color="#10b981" strokeWidth={3} /></div> <span>Exclusive Content</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-main)', fontSize: '1.05rem' }}>
                                        <div style={{ background: '#10b98120', padding: '4px', borderRadius: '50%' }}><Check size={16} color="#10b981" strokeWidth={3} /></div> <span>No Advertisements</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handlePurchase(pkg)}
                                    style={{
                                        background: pkg.popular ? pkg.color : 'rgba(255,255,255,0.03)',
                                        color: '#fff',
                                        border: pkg.popular ? 'none' : '1px solid var(--border-main)',
                                        padding: '1.4rem',
                                        borderRadius: '20px',
                                        fontSize: '1.2rem',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        width: '100%',
                                        boxShadow: pkg.popular ? `0 12px 24px ${pkg.color}30` : 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (pkg.popular) {
                                            e.currentTarget.style.filter = 'brightness(1.1)';
                                            e.currentTarget.style.transform = 'scale(1.02)';
                                        } else {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (pkg.popular) {
                                            e.currentTarget.style.filter = 'none';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        } else {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                        }
                                    }}
                                >
                                    Get {pkg.tokens} Tokens
                                </button>
                            </div>
                        ))}
                    </div>


                </div>
            </div>

            {/* PAYMENT MODALS */}
            {activeModal === 'payment-method' && (
                <div style={modalOverlayStyle} onClick={() => setActiveModal(null)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <div style={modalHeaderStyle}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>Select Method</h2>
                            <button onClick={() => setActiveModal(null)} style={closeButtonStyle}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '2.5rem 2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div
                                onClick={() => handleMethodSelect('card')}
                                style={paymentOptionStyle}
                            >
                                <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', marginBottom: '0.5rem' }}>
                                    <CreditCard size={40} />
                                </div>
                                <span style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-main)' }}>Online Karta</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center' }}>Instant automated transfer</span>
                            </div>
                            <div
                                onClick={() => handleMethodSelect('manual')}
                                style={paymentOptionStyle}
                            >
                                <div style={{ background: 'rgba(139, 92, 246, 0.1)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', marginBottom: '0.5rem' }}>
                                    <Send size={40} />
                                </div>
                                <span style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-main)' }}>P2P Transfer</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'center' }}>Manual card-to-card</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'card-payment' && (
                <div style={modalOverlayStyle} onClick={() => setActiveModal(null)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <div style={modalHeaderStyle}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>Card Details</h2>
                            <button onClick={() => setActiveModal(null)} style={closeButtonStyle}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '2.5rem 2rem' }}>
                            <div style={{ background: 'linear-gradient(135deg, #2563eb, #1e40af)', padding: '2.5rem', borderRadius: '32px', color: '#fff', marginBottom: '2.5rem', boxShadow: '0 20px 40px rgba(37, 99, 235, 0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
                                    <div style={{ width: '60px', height: '45px', background: 'linear-gradient(135deg, #fcd34d, #f59e0b)', borderRadius: '10px', opacity: 0.9 }}></div>
                                    <div style={{ textAlign: 'right', fontWeight: '900', fontSize: '1.2rem', letterSpacing: '0.1em' }}>NEXORA</div>
                                </div>
                                <div style={{ marginBottom: '2rem' }}>
                                    <input placeholder="9860 1606 3286 6416" style={{ ...cardInputStyle, fontSize: '1.8rem', letterSpacing: '0.15em' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ margin: '0 0 5px 0', fontSize: '0.6rem', fontWeight: '800', opacity: 0.7, letterSpacing: '0.1em' }}>EXPIRES</p>
                                        <input placeholder="MM/YY" style={{ ...cardInputStyle, width: '100px', fontSize: '1.1rem' }} />
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: '0 0 5px 0', fontSize: '0.6rem', fontWeight: '800', opacity: 0.7, letterSpacing: '0.1em' }}>CVC</p>
                                        <input placeholder="***" type="password" style={{ ...cardInputStyle, width: '60px', fontSize: '1.1rem', textAlign: 'right' }} />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handlePaymentSubmit('card')}
                                disabled={loading}
                                style={primaryButtonStyle}
                            >
                                {loading ? 'Processing...' : `Pay ${selectedPackage?.price.toLocaleString()} so'm`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'p2p-payment' && (
                <div style={modalOverlayStyle} onClick={() => setActiveModal(null)}>
                    <div style={{ ...modalContentStyle, background: '#0f172a', maxWidth: '450px', borderRadius: '40px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button
                                onClick={() => setActiveModal('payment-method')}
                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700', padding: '0.6rem 1rem', borderRadius: '100px' }}
                            >
                                <Zap size={16} fill="white" /> Orqaga qaytish
                            </button>
                            <button onClick={() => setActiveModal(null)} style={{ ...closeButtonStyle, background: 'rgba(255,255,255,0.05)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                        </div>

                        <div style={{ padding: '0 2.5rem 3rem 2.5rem' }}>
                            <h2 style={{ fontSize: '2.2rem', fontWeight: '900', margin: '0 0 0.8rem 0', color: '#fff', letterSpacing: '-0.02em' }}>To'lovni amalga oshirish</h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', marginBottom: '2.5rem' }}>Karta raqamiga <span style={{ color: '#fff', fontWeight: '800' }}>{selectedPackage?.price.toLocaleString()}</span> so'm o'tkazing</p>

                            <div style={{
                                background: '#2563eb',
                                padding: '3rem 2.5rem',
                                borderRadius: '36px',
                                color: '#fff',
                                marginBottom: '2.5rem',
                                position: 'relative',
                                boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>

                                <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: '900', opacity: 0.6, letterSpacing: '0.15em' }}>KARTA RAQAMI</p>
                                    <button
                                        onClick={() => copyToClipboard('9860 1606 3286 6416')}
                                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '8px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <Copy size={18} />
                                    </button>
                                </div>

                                <p style={{ margin: '0 0 3rem 0', fontSize: '2.2rem', fontWeight: '800', letterSpacing: '0.05em', fontFamily: 'monospace', position: 'relative', zIndex: 2 }}>
                                    9860 1606 3286 6416
                                </p>

                                <div style={{ position: 'relative', zIndex: 2 }}>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', fontWeight: '900', opacity: 0.6, letterSpacing: '0.15em' }}>EGA</p>
                                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>DILOBAR XAITBAYEVA</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handlePaymentSubmit('manual')}
                                disabled={loading}
                                style={{
                                    background: '#10b981',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '1.4rem',
                                    borderRadius: '24px',
                                    fontSize: '1.2rem',
                                    fontWeight: '900',
                                    cursor: 'pointer',
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '1rem',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: '0 12px 24px rgba(16, 185, 129, 0.3)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 16px 32px rgba(16, 185, 129, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(16, 185, 129, 0.3)';
                                }}
                            >
                                <div style={{ background: 'rgba(255,255,255,0.25)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Check size={20} strokeWidth={3} />
                                </div>
                                {loading ? 'Yuborilmoqda...' : "To'lov qildim"}
                            </button>

                            <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: '1.5' }}>
                                To'lov qilingandan so'ng 5-15 daqiqa ichida tangalar hisobingizga tushadi.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'success' && (
                <div style={modalOverlayStyle} onClick={() => setActiveModal(null)}>
                    <div style={{ ...modalContentStyle, textAlign: 'center', borderRadius: '40px', maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '4rem 2rem' }}>
                            <div style={{ background: '#10b98120', color: '#10b981', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                                <Check size={50} strokeWidth={3} />
                            </div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1rem', letterSpacing: '-1px' }}>Request Sent!</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '3rem' }}>Your payment request for {selectedPackage?.tokens} tokens has been received. Please wait for administrator verification.</p>
                            <button onClick={() => setActiveModal(null)} style={primaryButtonStyle}>Got it!</button>
                        </div>
                    </div>
                </div>
            )}

            {notification && (
                <div style={{ position: 'fixed', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)', background: '#3b82f6', color: '#fff', padding: '1.2rem 2.5rem', borderRadius: '100px', fontWeight: '800', boxShadow: '0 15px 30px rgba(59, 130, 246, 0.4)', zIndex: 99999, fontSize: '1.1rem', letterSpacing: '0.02em', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    {notification}
                </div>
            )}
        </div>
    );
}

const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem' };
const modalContentStyle = { background: 'var(--bg-panel)', width: '100%', maxWidth: '550px', borderRadius: '40px', border: '1px solid var(--border-main)', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' };
const modalHeaderStyle = { padding: '2rem 2.5rem', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const closeButtonStyle = { background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s' };
const paymentOptionStyle = { background: 'var(--bg-hover)', padding: '2.5rem 2rem', borderRadius: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid var(--border-main)' };
const cardInputStyle = { background: 'transparent', border: 'none', fontSize: '1.4rem', color: '#fff', outline: 'none', width: '100%', fontWeight: '700', textTransform: 'uppercase' };
const primaryButtonStyle = { background: '#3b82f6', color: '#fff', border: 'none', padding: '1.5rem', borderRadius: '24px', fontSize: '1.3rem', fontWeight: '900', cursor: 'pointer', width: '100%', transition: 'all 0.3s', boxShadow: '0 15px 30px rgba(59, 130, 246, 0.3)' };
