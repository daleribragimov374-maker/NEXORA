import { useLocation, useNavigate } from 'react-router-dom';
import { Gamepad2, X } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function GamePlayer() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { id, title, imageUrl, fileUrl } = location.state || {};
    const [srcDoc, setSrcDoc] = useState('');
    const [loading, setLoading] = useState(true);
    const [insufficientTokens, setInsufficientTokens] = useState(false);
    const [userBalance, setUserBalance] = useState(null);
    const hasProcessed = useRef(false);

    const [currentUserId, setCurrentUserId] = useState(null);

    // Listen for requests from the game iframe
    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data && event.data.type === 'RETURN_HOME') {
                navigate('/');
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [navigate]);

    useEffect(() => {
        const checkAndDeductTokens = async () => {
            if (hasProcessed.current || !id) return;
            hasProcessed.current = true;

            if (user) {
                setCurrentUserId(user.id);
                
                // Fetch profile to check tokens
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('tokens')
                    .eq('id', user.id)
                    .single();
                
                const currentTokens = profile?.tokens || 0;
                setUserBalance(currentTokens);

                if (currentTokens < 200) {
                    setInsufficientTokens(true);
                    setLoading(false);
                    return;
                }

                // Deduct tokens
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ tokens: Math.max(0, currentTokens - 200) })
                    .eq('id', user.id);

                if (updateError) {
                    console.error('Error deducting tokens:', updateError);
                    setLoading(false);
                    return;
                }

                // Update current activity
                await supabase.from('profiles').update({
                    current_activity: { id, title, imageUrl, fileUrl }
                }).eq('id', user.id);

                // Increment plays safely using RPC (bypasses RLS to allow non-owners to increment)
                try {
                    await supabase.rpc('increment_plays', { exp_id: id });
                } catch (rpcErr) {
                    console.error("RPC increment_plays failed:", rpcErr);
                }
            }
        };
        checkAndDeductTokens();

        return () => {
            // Reset activity when leaving
            const resetActivity = async () => {
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                if (currentUser) {
                    await supabase.from('profiles').update({
                        current_activity: null
                    }).eq('id', currentUser.id);
                }
            };
            resetActivity();
        };
    }, [id, title, imageUrl, fileUrl, user]);

    useEffect(() => {
        if (!fileUrl || insufficientTokens) { setLoading(false); return; }
        fetch(fileUrl)
            .then(res => res.text())
            .then(html => {
                // Inject message to parent to override window.close() inside already uploaded games
                let modifiedHtml = html;
                if (html.includes('window.close();') || html.includes('window.close()')) {
                    modifiedHtml = html.replace(/window\.close\(\);?/g, "window.parent.postMessage({ type: 'RETURN_HOME' }, '*');");
                }
                setSrcDoc(modifiedHtml);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [fileUrl]);

    if (insufficientTokens) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#0a0a0f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Decoration */}
                <div style={{
                    position: 'absolute',
                    top: '-10%',
                    left: '-10%',
                    width: '40%',
                    height: '40%',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    zIndex: 0
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '-10%',
                    right: '-10%',
                    width: '40%',
                    height: '40%',
                    background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    zIndex: 0
                }} />

                {/* Modal Container */}
                <div style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    maxWidth: '440px',
                    background: 'rgba(23, 23, 33, 0.7)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '28px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '2.5rem',
                    textAlign: 'center',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    animation: 'modalSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <style>{`
                        @keyframes modalSlideUp {
                            from { opacity: 0; transform: translateY(30px) scale(0.95); }
                            to { opacity: 1; transform: translateY(0) scale(1); }
                        }
                        .premium-icon-container {
                            width: 88px;
                            height: 88px;
                            margin: 0 auto 1.5rem;
                            position: relative;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .premium-icon-bg {
                            position: absolute;
                            inset: 0;
                            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                            border-radius: 24px;
                            opacity: 0.15;
                            transform: rotate(-5deg);
                        }
                        .premium-icon-inner {
                            position: relative;
                            width: 64px;
                            height: 64px;
                            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                            border-radius: 18px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4);
                        }
                    `}</style>

                    <div className="premium-icon-container">
                        <div className="premium-icon-bg" />
                        <div className="premium-icon-inner">
                            <Gamepad2 size={32} color="white" />
                        </div>
                    </div>

                    <h2 style={{ 
                        color: 'white', 
                        margin: '0 0 0.75rem', 
                        fontSize: '1.75rem', 
                        fontWeight: '800',
                        letterSpacing: '-0.02em'
                    }}>
                        Tokenlar Yetarli Emas
                    </h2>
                    
                    <p style={{ 
                        color: 'rgba(255, 255, 255, 0.6)', 
                        margin: '0 0 2rem', 
                        fontSize: '1rem', 
                        lineHeight: '1.6',
                        padding: '0 1rem'
                    }}>
                        Ushbu o'yinni o'ynash uchun sizda <b>200</b> token bo'lishi kerak. <br />
                        Hozirgi balansingiz: <span style={{ color: '#60a5fa', fontWeight: '700' }}>{userBalance || 0}</span> token.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <button
                            onClick={() => navigate('/premium')}
                            style={{ 
                                padding: '1rem 2rem', 
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: 'white',
                                border: 'none',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 15px rgba(37, 99, 235, 0.3)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.2)';
                            }}
                        >
                            Token Satib Olish
                        </button>
                        
                        <button
                            onClick={() => navigate(-1)}
                            style={{ 
                                padding: '0.875rem 2rem', 
                                borderRadius: '16px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'rgba(255, 255, 255, 0.8)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '0.95rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                        >
                            Orqaga Qaytish
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!fileUrl) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'var(--bg-main)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1.5rem',
                padding: '2rem'
            }}>
                <div style={{
                    width: '80px', height: '80px',
                    borderRadius: '20px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Gamepad2 size={36} color="#ef4444" />
                </div>
                <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.5rem' }}>No Game File Found</h2>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>This experience has no playable file uploaded.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 2rem', borderRadius: '12px' }}
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0a0a0f',
            display: 'flex',
            flexDirection: 'column',
            color: 'white'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
                gap: '1rem',
                zIndex: 100,
                position: 'sticky',
                top: 0
            }}>

                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={title}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            border: '1px solid rgba(255,255,255,0.15)'
                        }}
                    />
                )}

                <div style={{ flex: 1 }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        color: 'white',
                        letterSpacing: '-0.01em'
                    }}>
                        {title || 'Untitled Experience'}
                    </h1>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                        Now Playing
                    </p>
                </div>

                <button
                    onClick={() => navigate('/')}
                    style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#10b981',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        marginLeft: 'auto'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Exit Game"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Game iframe */}
            <div style={{
                flex: 1,
                position: 'relative',
                background: '#000',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Banner image strip at top */}
                {imageUrl && (
                    <div style={{
                        width: '100%',
                        height: '4px',
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(0px)',
                        opacity: 0.6
                    }} />
                )}

                {loading ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 65px)' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                ) : (
                    <iframe
                        id="game-iframe"
                        srcDoc={srcDoc}
                        title={title || 'Game'}
                        style={{
                            width: '100%',
                            flex: 1,
                            border: 'none',
                            background: '#fff',
                            minHeight: 'calc(100vh - 65px)'
                        }}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                        allowFullScreen
                    />
                )}
            </div>
        </div>
    );
}
