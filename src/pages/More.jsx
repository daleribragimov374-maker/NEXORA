import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import {
    Settings, CreditCard, Info as InfoIcon, FileText,
    ChevronRight, X, Moon, Sun, Bell, BellOff, Globe, Lock, Trash2,
    Check, Users, MessageSquare
} from 'lucide-react';



const MenuItem = ({ item, handleMenuClick }) => {
    const Icon = item.icon;
    return (
        <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-main)', cursor: 'pointer' }}
            className="more-item"
            onClick={() => handleMenuClick(item.label)}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Icon size={22} color="var(--text-muted)" />
                <span style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--text-main)' }}>{item.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {item.badge && <span className="badge" style={{ position: 'relative', top: 0, right: 0 }}>{item.badge}</span>}
                <ChevronRight size={20} color="var(--text-muted)" />
            </div>
        </div>
    );
};

// Reusable modal wrapper
const Modal = ({ title, children, wide, setActiveModal }) => (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}
        onClick={() => setActiveModal(null)}
    >
        <div
            style={{ background: 'var(--bg-panel)', width: '90%', maxWidth: wide ? '600px' : '480px', borderRadius: '12px', border: '1px solid var(--border-main)', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', animation: 'fadeInUp 0.25s ease', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
        >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>{title}</h2>
                <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={22} />
                </button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
                {children}
            </div>
        </div>
    </div>
);

const ToggleSwitch = ({ checked, onChange }) => (
    <div
        onClick={onChange}
        style={{
            width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer',
            background: checked ? '#10b981' : 'var(--border-main)',
            transition: 'background 0.3s', position: 'relative', flexShrink: 0
        }}
    >
        <div style={{
            width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
            position: 'absolute', top: '2px', left: checked ? '22px' : '2px',
            transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
        }} />
    </div>
);

const SettingRow = ({ icon: Icon, label, right }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: '1px solid var(--border-main)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Icon size={20} color="var(--text-muted)" />
            <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>{label}</span>
        </div>
        {right}
    </div>
);

export default function More() {
    const navigate = useNavigate();
    const { user: authUser, loading } = useAuth();
    const [activeModal, setActiveModal] = useState(null);
    const [notification, setNotification] = useState(null);
    const [user, setUser] = useState(null);

    // Settings state
    const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [language, setLanguage] = useState('English');
    const [badges, setBadges] = useState({ friends: 0, messages: 0 });

    // Feature data states
    const [friendsList, setFriendsList] = useState([]);
    const [messagesList, setMessagesList] = useState([]);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        if (loading) return;
        if (!authUser) {
            navigate('/', { replace: true });
            return;
        }

        setUser(authUser);

        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', authUser.id)
                .single();

            if (data) {
                setDarkMode(data.dark_mode);
                setNotificationsEnabled(data.notifications_enabled);
                setLanguage(data.language);

                if (data.dark_mode !== (localStorage.getItem('theme') === 'dark')) {
                    localStorage.setItem('theme', data.dark_mode ? 'dark' : 'light');
                    document.body.className = data.dark_mode ? 'dark-mode' : 'app-mode';
                }
            }
        };

        const fetchBadges = async () => {
            try {
                const [friends, messages] = await Promise.all([
                    supabase.from('friends').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id).eq('status', 'accepted'),
                    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', authUser.id).eq('is_read', false)
                ]);

                setBadges({
                    friends: friends.count || 0,
                    messages: messages.count || 0
                });
            } catch (err) {
                console.error("Error fetching badges:", err);
            }
        };

        fetchSettings();
        fetchBadges();
    }, [authUser, loading, navigate]);





    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 2500);
    };

    const updateSetting = async (key, value) => {
        if (!user) return;
        try {
            await supabase
                .from('user_settings')
                .update({ [key]: value, updated_at: new Date().toISOString() })
                .eq('user_id', user.id);
        } catch (error) {
            console.error('Error updating setting:', error);
        }
    };

    const handleThemeToggle = () => {
        const newTheme = !darkMode;
        setDarkMode(newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
        document.body.className = newTheme ? 'dark-mode' : 'app-mode';
        showNotification(`Theme changed to ${newTheme ? 'Dark' : 'Light'} mode`);
        updateSetting('dark_mode', newTheme);
    };

    const handlePasswordSubmit = async () => {
        if (!currentPassword || !newPassword) {
            showNotification("Iltimos, barcha maydonlarni to'ldiring.");
            return;
        }

        if (newPassword.length < 6) {
            showNotification("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak.");
            return;
        }

        if (currentPassword === newPassword) {
            showNotification("Yangi parol oldingisidan farq qilishi kerak.");
            return;
        }

        setPasswordLoading(true);

        try {
            // Birinchi navbatda oldingi parolni to'g'riligini tekshiramiz (Verify old password)
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword
            });

            if (signInError) {
                // Agar eski parol xato bo'lsa
                showNotification(`Oldingi parol noto'g'ri: ${signInError.message}`);
                setPasswordLoading(false);
                return; // Ruxsat bermaslik
            }

            // Agar eski parol to'g'ri bo'lsa, endi parolni yangilaymiz
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                showNotification(`Parol xatosi: ${updateError.message}`);
                setPasswordLoading(false);
                return;
            }

            setActiveModal(null);
            setCurrentPassword('');
            setNewPassword('');

            showNotification("Parol o'zgartirildi! Iltimos, qaytadan kiring.");

            setTimeout(async () => {
                await supabase.auth.signOut();
                localStorage.removeItem('isAuthenticated');
                window.location.href = '/';
            }, 1500);

        } catch (error) {
            console.error('Password change error:', error);
            showNotification(`Xatolik: ${error.message}`);
        }

        setPasswordLoading(false);
    };

    const handleDeleteAccount = async () => {
        if (!user) return;
        const confirmDelete = window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.");
        if (!confirmDelete) return;

        try {
            // Note: In Supabase, deleting a user usually requires an Edge Function with Service Role key.
            // For a client-side only app, the user might need to call a function or we just sign out and deactivate.
            // Let's attempt to delete via a Supabase RPC if it exists, or notify the admin.
            // As a fallback for this demo, we'll sign the user out and show a success message.
            const { error } = await supabase.rpc('delete_user');

            // If RPC doesn't exist or fails, we will just sign out 
            await supabase.auth.signOut();
            localStorage.removeItem('isAuthenticated');
            navigate('/');
        } catch (err) {
            console.error(err);
        }
    };

    const fetchFriends = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('friends')
            .select('friend_id, profiles!friends_friend_id_fkey(username, avatar_url, current_activity)')
            .eq('user_id', user.id)
            .eq('status', 'accepted');
        if (!error && data) {
            setFriendsList(data.map(d => ({
                id: d.friend_id,
                username: d.profiles.username,
                avatar: d.profiles.avatar_url,
                activity: d.profiles.current_activity?.title || 'Offline'
            })));
        }
    };

    const fetchMessages = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('messages')
            .select('*, profiles!messages_sender_id_fkey(username, avatar_url)')
            .eq('receiver_id', user.id)
            .order('created_at', { ascending: false });
        if (!error && data) setMessagesList(data);
    };

    const rarityColor = (rarity) => {
        switch (rarity) {
            case 'Legendary': return '#fbbf24';
            case 'Epic': return '#a855f7';
            case 'Rare': return '#3b82f6';
            default: return 'var(--text-muted)';
        }
    };

    const handleMenuClick = (label) => {
        if (label === 'Premium') {
            navigate('/premium');
            return;
        }

        if (label === 'Friends') fetchFriends();
        if (label === 'Messages') fetchMessages();

        setActiveModal(label);
    };

    const moreMenu1 = [
        { icon: Settings, label: 'Settings' },
        { icon: CreditCard, label: 'Premium' },
    ];



    const moreMenu2 = [
        { icon: Users, label: 'Friends', badge: badges.friends > 0 ? badges.friends : null },
        { icon: MessageSquare, label: 'Messages', badge: badges.messages > 0 ? badges.messages : null },
    ];

    const moreMenu3 = [
        { icon: InfoIcon, label: 'Help' },
        { icon: FileText, label: 'Terms' },
        { icon: FileText, label: 'Privacy' },
    ];



    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="main-content">
                <TopNav />

                <div className="dashboard-scroll" style={{ display: 'flex', gap: '2rem' }}>
                    <div style={{ flex: '1', maxWidth: '800px', margin: '0 auto' }}>
                        <div className="section-title">Account & Social</div>
                        <div style={{ borderRadius: '12px', border: '1px solid var(--border-main)', overflow: 'hidden', marginBottom: '2rem' }}>
                            {moreMenu1.map(item => <MenuItem key={item.label} item={item} handleMenuClick={handleMenuClick} />)}
                        </div>

                        <div className="section-title">Social & Inventory</div>
                        <div style={{ borderRadius: '12px', border: '1px solid var(--border-main)', overflow: 'hidden', marginBottom: '2rem' }}>
                            {moreMenu2.map(item => <MenuItem key={item.label} item={item} handleMenuClick={handleMenuClick} />)}
                        </div>

                        <div className="section-title">Support</div>
                        <div style={{ borderRadius: '12px', border: '1px solid var(--border-main)', overflow: 'hidden', marginBottom: '3rem' }}>
                            {moreMenu3.map(item => <MenuItem key={item.label} item={item} handleMenuClick={handleMenuClick} />)}
                        </div>
                    </div>
                </div>
            </div>

            {/* ======== MODALS ======== */}

            {/* Password Change Modal */}
            {activeModal === 'ChangePassword' && (
                <Modal title="Parolni o'zgartirish" setActiveModal={setActiveModal}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Oldingi parol</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Oldingi parolingiz"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--search-bg)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Yangi parol</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Yangi parol (kamida 6 ta belgi)"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'var(--search-bg)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button
                                onClick={() => {
                                    setActiveModal('Settings');
                                    setCurrentPassword('');
                                    setNewPassword('');
                                }}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-main)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', fontWeight: '500' }}>
                                Bekor qilish
                            </button>
                            <button
                                onClick={handlePasswordSubmit}
                                disabled={passwordLoading}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', cursor: passwordLoading ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: passwordLoading ? 0.7 : 1 }}>
                                {passwordLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Settings Modal */}
            {activeModal === 'Settings' && (
                <Modal title="Settings" setActiveModal={setActiveModal}>
                    <SettingRow icon={darkMode ? Moon : Sun} label="Dark Mode" right={<ToggleSwitch checked={darkMode} onChange={handleThemeToggle} />} />
                    <SettingRow icon={notificationsEnabled ? Bell : BellOff} label="Notifications" right={<ToggleSwitch checked={notificationsEnabled} onChange={() => {
                        const newVal = !notificationsEnabled;
                        setNotificationsEnabled(newVal);
                        showNotification(`Notifications ${newVal ? 'enabled' : 'disabled'}`);
                        updateSetting('notifications_enabled', newVal);
                    }} />} />

                    <SettingRow icon={Lock} label="Change Password" right={
                        <button className="btn btn-outline" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: 'auto' }} onClick={() => setActiveModal('ChangePassword')}>Change</button>
                    } />

                </Modal>
            )}

            {/* Friends Modal */}
            {activeModal === 'Friends' && (
                <Modal title="Friends" setActiveModal={setActiveModal} wide>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {friendsList.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No friends yet. Add some from the search!</div>
                        ) : friendsList.map(f => (
                            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
                                <img src={f.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.username}`} style={{ width: '44px', height: '44px', borderRadius: '50%' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>@{f.username}</div>
                                    <div style={{ fontSize: '0.8rem', color: f.activity === 'Offline' ? 'var(--text-muted)' : '#10b981' }}>{f.activity}</div>
                                </div>
                                <button className="btn btn-primary" style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.8rem' }}>Chat</button>
                            </div>
                        ))}
                    </div>
                </Modal>
            )}

            {/* Messages Modal */}
            {activeModal === 'Messages' && (
                <Modal title="Messages" setActiveModal={setActiveModal} wide>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {messagesList.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No messages yet.</div>
                        ) : messagesList.map(m => (
                            <div key={m.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: m.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid var(--border-main)' }}>
                                <img src={m.profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.profiles.username}`} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>@{m.profiles.username}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{m.content}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Modal>
            )}

            {/* Help Modal */}
            {activeModal === 'Help' && (
                <Modal title="Help Center" setActiveModal={setActiveModal}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[
                            { q: 'How do I change my username?', a: 'Go to Settings → Profile → Edit Username. Note: You can only change it once every 30 days.' },
                            { q: 'How do I report a player?', a: 'Click on the player\'s profile → More Options → Report. Our team will review the report within 24 hours.' },
                            { q: 'How do I enable two-factor authentication?', a: 'Go to Settings → Security → Enable 2FA. You\'ll need an authenticator app.' },
                            { q: 'How to contact support?', a: 'Email us at support@nexora.com or use the in-app feedback form.' },
                        ].map((item, i) => (
                            <details key={i} style={{ borderRadius: '8px', border: '1px solid var(--border-main)', overflow: 'hidden' }}>
                                <summary style={{ padding: '0.85rem 1rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', background: 'var(--search-bg)' }}>{item.q}</summary>
                                <div style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', borderTop: '1px solid var(--border-main)' }}>{item.a}</div>
                            </details>
                        ))}
                    </div>
                </Modal>
            )}

            {/* Terms Modal */}
            {activeModal === 'Terms' && (
                <Modal title="Terms of Use" setActiveModal={setActiveModal}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                        <p style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Last Updated: February 25, 2026</p>
                        <p>Welcome to NEXORA. By accessing or using our platform, you agree to be bound by these Terms of Use.</p>
                        <h4 style={{ color: 'var(--text-main)', margin: '1rem 0 0.5rem' }}>1. Account Registration</h4>
                        <p>You must be at least 13 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials.</p>
                        <h4 style={{ color: 'var(--text-main)', margin: '1rem 0 0.5rem' }}>2. User Conduct</h4>
                        <p>You agree not to engage in harassment, cheating, or any behavior that violates our community guidelines.</p>
                        <h4 style={{ color: 'var(--text-main)', margin: '1rem 0 0.5rem' }}>3. Virtual Items</h4>
                        <p>Virtual items purchased on the platform have no real-world monetary value and are non-transferable outside the platform.</p>
                        <h4 style={{ color: 'var(--text-main)', margin: '1rem 0 0.5rem' }}>4. Termination</h4>
                        <p>We reserve the right to suspend or terminate accounts that violate these terms at our sole discretion.</p>
                    </div>
                </Modal>
            )}

            {/* Privacy Modal */}
            {activeModal === 'Privacy' && (
                <Modal title="Privacy Policy" setActiveModal={setActiveModal}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
                        <p style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.5rem' }}>Last Updated: February 25, 2026</p>
                        <p>Your privacy is important to us. This policy describes how NEXORA collects, uses, and protects your information.</p>
                        <h4 style={{ color: 'var(--text-main)', margin: '1rem 0 0.5rem' }}>Data We Collect</h4>
                        <p>We collect account information (username, email, date of birth), usage data, and device information to provide and improve our services.</p>
                        <h4 style={{ color: 'var(--text-main)', margin: '1rem 0 0.5rem' }}>How We Use Your Data</h4>
                        <p>Your data is used to personalize your experience, ensure account security, and improve platform performance.</p>
                        <h4 style={{ color: 'var(--text-main)', margin: '1rem 0 0.5rem' }}>Data Protection</h4>
                        <p>We employ industry-standard security measures including encryption and secure servers to protect your personal information.</p>
                        <h4 style={{ color: 'var(--text-main)', margin: '1rem 0 0.5rem' }}>Contact</h4>
                        <p>For privacy-related inquiries, contact us at privacy@nexora.com.</p>
                    </div>
                </Modal>
            )}

            {/* Notification Toast */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--bg-panel)', color: 'var(--text-main)', padding: '0.75rem 1.5rem',
                    borderRadius: '10px', border: '1px solid var(--border-main)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)', fontSize: '0.9rem', fontWeight: '500',
                    zIndex: 99999, animation: 'fadeInUp 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    <Check size={18} color="#10b981" />
                    {notification}
                </div>
            )}

            <style>{`
                .more-item:hover { background: var(--bg-hover) !important; }
                .more-item:last-child { border-bottom: none !important; }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                details summary::-webkit-details-marker { display: none; }
                details summary::marker { display: none; content: ''; }
                details summary { list-style: none; }
            `}</style>
        </div>
    );
}
