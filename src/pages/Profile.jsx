import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [profileData, setProfileData] = useState({
        name: '',
        handle: '',
        bio: '',
        avatar_url: ''
    });

    const [stats, setStats] = useState({ friends: 0, followers: 0, following: 0 });

    useEffect(() => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        setIsDarkMode(currentTheme === 'dark');

        if (authLoading) return;
        if (!user) {
            navigate('/sign-in');
            return;
        }

        const fetchProfileData = async () => {
            setLoading(true);
            try {
                // 1. Fetch profile metadata
                const { data: profile, error: pError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (pError && pError.code !== 'PGRST116') throw pError;

                if (profile) {
                    setProfileData({
                        name: profile.username || user.user_metadata?.display_name || user.email.split('@')[0],
                        handle: `@${profile.username || user.user_metadata?.username || user.email.split('@')[0]}`,
                        bio: profile.bio || '"Just here to play some games and have fun!"',
                        avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || ''
                    });
                } else {
                    const name = user.user_metadata?.display_name || user.email.split('@')[0];
                    setProfileData({
                        name: name,
                        handle: `@${name}`,
                        bio: '"Just here to play some games and have fun!"',
                        avatar_url: user.user_metadata?.avatar_url || ''
                    });
                }

                // 2. Fetch social counts
                const [friendsRes, followersRes, followingRes] = await Promise.all([
                    supabase.from('friends').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'accepted'),
                    supabase.from('friends').select('*', { count: 'exact', head: true }).eq('friend_id', user.id).eq('status', 'accepted'),
                    supabase.from('friends').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
                ]);

                setStats({
                    friends: friendsRes.count || 0,
                    followers: followersRes.count || 0,
                    following: followingRes.count || 0
                });

            } catch (err) {
                console.error("Error fetching profile data:", err);
                showNotification('Failed to load profile data', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [user, authLoading, navigate]);

    const showNotification = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };


    const handleFileUpload = async (event) => {
        try {
            setUploading(true);
            const file = event.target.files[0];
            if (!file) return;
            if (!user) throw new Error('User not found');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload to 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setProfileData({ ...profileData, avatar_url: publicUrl });
            showNotification('Image uploaded! Click Save to confirm. ✨');
        } catch (error) {
            console.error('Detailed Upload Error:', error);
            let errorMsg = 'Upload failed.';
            if (error.message?.includes('bucket')) {
                errorMsg = 'Storage bucket "avatars" not found. Please create it in Supabase.';
            } else if (error.status === 403 || error.status === 401) {
                errorMsg = 'Permission denied. Check Storage RLS policies.';
            } else {
                errorMsg = error.message || 'Check your internet connection or bucket settings.';
            }
            showNotification(errorMsg, 'error');
        } finally {
            setUploading(false);
            // Reset input so the same file can be selected again
            event.target.value = '';
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    username: profileData.name,
                    display_name: profileData.name,
                    full_name: profileData.name,
                    bio: profileData.bio,
                    avatar_url: profileData.avatar_url
                }
            });

            if (error) throw error;

            // Also update the public profiles table for visibility
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    username: profileData.name,
                    bio: profileData.bio,
                    avatar_url: profileData.avatar_url,
                    updated_at: new Date()
                })
                .eq('id', user.id);

            if (profileError) {
                console.warn('Profile sync error:', profileError);
            }

            setProfileData({
                ...profileData,
                handle: `@${profileData.name}`
            });
            setIsEditing(false);
            showNotification('Profile updated successfully! ✨');
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('isAuthenticated');
        navigate('/');
    };

    const toggleTheme = () => {
        const newTheme = isDarkMode ? 'light' : 'dark';
        setIsDarkMode(!isDarkMode);
        localStorage.setItem('theme', newTheme);
        document.body.className = newTheme === 'dark' ? 'dark-mode' : 'app-mode';
    };

    if (loading && !profileData.name) {
        return (
            <div className="dashboard-layout">
                <Sidebar />
                <div className="main-content">
                    <TopNav />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                        <div className="loader"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="main-content">
                <TopNav />
                <div className="dashboard-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>

                    <div style={{ width: '100%', maxWidth: '800px', background: 'var(--bg-panel)', borderRadius: '12px', border: '1px solid var(--border-main)', overflow: 'hidden', position: 'relative' }}>
                        {/* Profile Header Background */}
                        <div style={{ width: '100%', height: '200px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}></div>

                        {/* Profile Info */}
                        <div style={{ padding: '0 2rem 2rem 2rem', position: 'relative' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <img
                                    src={profileData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.name}`}
                                    alt="Profile Avatar"
                                    style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px solid var(--bg-panel)', marginTop: '-60px', objectFit: 'cover', background: 'var(--bg-panel)' }}
                                />
                                {uploading && (
                                    <div style={{ position: 'absolute', top: '-60px', left: 0, width: '120px', height: '120px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div className="loader" style={{ width: '24px', height: '24px' }}></div>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1, marginRight: '2rem' }}>
                                    {isEditing ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                                <button
                                                    onClick={() => document.getElementById('avatar-upload').click()}
                                                    className="btn btn-outline"
                                                    style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                                    Change Photo
                                                </button>
                                                <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                                                {uploading && <div style={{ fontSize: '0.85rem', color: '#3b82f6' }}>Uploading...</div>}
                                            </div>

                                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Username</label>
                                            <input
                                                type="text"
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                className="form-input"
                                                style={{ fontSize: '1.2rem', fontWeight: '700', width: '100%', padding: '0.5rem' }}
                                            />
                                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Bio</label>
                                            <textarea
                                                value={profileData.bio}
                                                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                                className="form-input"
                                                style={{ fontSize: '0.95rem', width: '100%', padding: '0.5rem', minHeight: '80px', resize: 'vertical' }}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-main)' }}>{profileData.name}</h1>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '0.25rem' }}>{profileData.handle}</div>
                                            <div style={{ color: 'var(--text-main)', marginTop: '1rem', fontSize: '0.95rem' }}>{profileData.bio}</div>
                                        </>
                                    )}
                                </div>
                                <div>
                                    {isEditing ? (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="btn btn-outline"
                                                onClick={() => setIsEditing(false)}
                                                style={{ width: 'auto' }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="btn btn-primary"
                                                onClick={handleSaveProfile}
                                                disabled={loading}
                                                style={{ width: 'auto', color: '#111' }}
                                            >
                                                {loading ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => setIsEditing(true)}
                                            style={{ border: '1px solid var(--border-main)', color: 'var(--text-main)', width: 'auto' }}
                                        >
                                            Edit Profile
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-main)', paddingTop: '1.5rem', color: 'var(--text-main)' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{stats.friends}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Friends</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{stats.followers}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Followers</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{stats.following}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Following</div>
                                </div>
                            </div>

                            {/* Theme Toggle Section */}
                            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Dark Mode</h3>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Toggle between light and dark themes</p>
                                </div>
                                <button className="btn btn-outline" onClick={toggleTheme} style={{ borderColor: 'var(--border-main)', color: 'var(--text-main)', width: 'auto' }}>
                                    {isDarkMode ? 'Disable Dark Mode' : 'Enable Dark Mode'}
                                </button>
                            </div>

                            {/* Logout Section */}
                            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Log Out</h3>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Sign out of your account</p>
                                </div>
                                <button
                                    className="btn"
                                    onClick={handleLogout}
                                    style={{
                                        background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                                        border: '1px solid rgba(239,68,68,0.3)', width: 'auto',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                                >
                                    <LogOut size={18} /> Log Out
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div style={{
                    position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--bg-panel)', color: 'var(--text-main)', padding: '0.75rem 1.5rem',
                    borderRadius: '10px', border: `1px solid ${notification.type === 'error' ? '#ef4444' : 'var(--border-main)'}`,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)', fontSize: '0.9rem', fontWeight: '500',
                    zIndex: 99999, animation: 'fadeInUp 0.3s ease', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    {notification.type === 'error' ? <AlertCircle size={18} color="#ef4444" /> : <Check size={18} color="#10b981" />}
                    {notification.msg}
                </div>
            )}

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .loader {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--border-main);
                    border-top: 3px solid #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
