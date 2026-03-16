import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Live search from database (no internal mock games)

export default function TopNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const searchRef = useRef(null);

    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [userProfile, setUserProfile] = useState({ name: '...', avatar: null });

    // Live Search State
    const [dropdownResults, setDropdownResults] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (location.pathname === '/search') {
            setSearchQuery(searchParams.get('q') || '');
            setIsDropdownOpen(false);
        } else {
            setSearchQuery('');
            setIsDropdownOpen(false);
        }
    }, [location.pathname, searchParams]);

    // Handle clicks outside dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Live search fetch
    useEffect(() => {
        const fetchLiveResults = async () => {
            if (!searchQuery.trim()) {
                setDropdownResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                // 1. Fetch ALL matching experiences from Supabase
                const { data: dbExperiences } = await supabase
                    .from('experiences')
                    .select('*, profiles(username, avatar_url)')
                    .ilike('title', `%${searchQuery}%`)
                    .limit(5);

                if (dbExperiences) {
                    const formattedDb = dbExperiences.map(exp => ({
                        id: exp.id,
                        title: exp.title,
                        img: exp.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300',
                        fileUrl: exp.file_url,
                        creator: {
                            name: exp.profiles?.username || 'Creator',
                            avatar: exp.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${exp.profiles?.username || 'Creator'}`
                        }
                    }));
                }

                setDropdownResults(formattedDb);
            } catch (err) {
                console.error("Live search error:", err);
            } finally {
                setIsSearching(false);
            }
        };

        const timerId = setTimeout(() => {
            fetchLiveResults();
        }, 300); // 300ms debounce

        return () => clearTimeout(timerId);
    }, [searchQuery]);

    useEffect(() => {
        if (!user) return;

        const fetchProfile = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('username, avatar_url, tokens')
                    .eq('id', user.id)
                    .single();
                
                if (data) {
                    const name = data.username || user.user_metadata?.display_name || user.email.split('@')[0];
                    const avatar = data.avatar_url || user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
                    setUserProfile({ 
                        name: name, 
                        avatar: avatar,
                        tokens: data.tokens || 0
                    });
                }
            } catch (err) {
                console.error("Profile fetch error in TopNav:", err);
            }
        };

        fetchProfile();

        // Optional: Real-time subscription for tokens
        const subscription = supabase
            .channel('profile_changes')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'profiles',
                filter: `id=eq.${user.id}`
            }, (payload) => {
                if (payload.new) {
                    setUserProfile(prev => ({
                        ...prev,
                        tokens: payload.new.tokens || 0,
                        name: payload.new.username || prev.name,
                        avatar: payload.new.avatar_url || prev.avatar
                    }));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user]);

    // Map path to title
    const getTitle = () => {
        switch (location.pathname) {
            case '/': return 'Welcome';
            case '/home': return 'Home';

            case '/charts': return 'Charts';


            case '/more': return 'More';
            case '/profile': return 'Profile';
            case '/premium': return 'Premium';

            case '/notifications': return 'Notifications';
            case '/search': return 'Search';
            default: return 'Dashboard';
        }
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            if (searchQuery.trim()) {
                setIsDropdownOpen(false);
                navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            }
        }
    };

    const handleInputFocus = () => {
        if (searchQuery.trim()) {
            setIsDropdownOpen(true);
        }
    };

    const handleInputChange = (e) => {
        setSearchQuery(e.target.value);
        if (e.target.value.trim().length > 0) {
            setIsDropdownOpen(true);
        } else {
            setIsDropdownOpen(false);
        }
    };

    const navToGame = (game) => {
        setIsDropdownOpen(false);
        navigate('/play', {
            state: { id: game.id, title: game.title, imageUrl: game.img, fileUrl: game.fileUrl || null }
        });
    };

    return (
        <div className="top-nav">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>{getTitle()}</h2>

            <div className="search-bar-container" ref={searchRef} style={{ position: 'relative' }}>
                <Search className="search-icon" size={18} />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleSearch}
                />

                {/* Search Dropdown */}
                {isDropdownOpen && searchQuery.trim().length > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '0.4rem',
                        background: 'var(--bg-panel)',
                        border: '1px solid var(--border-main)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        zIndex: 9999,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {isSearching ? (
                            <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} />
                                <span style={{ fontSize: '0.85rem', marginTop: '0.75rem', display: 'block' }}>Searching experiences...</span>
                            </div>
                        ) : dropdownResults.length > 0 ? (
                            <>
                                <div style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-main)', background: 'var(--bg-hover)', letterSpacing: '0.05em' }}>
                                    EXPERIENCES
                                </div>
                                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                    {dropdownResults.map(game => (
                                        <div
                                            key={game.id}
                                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-main)', transition: 'background 0.2s' }}
                                            onClick={() => navToGame(game)}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-main)' }}>
                                                <img src={game.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.1rem' }}>
                                                    {game.title}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    By <span style={{ fontWeight: '500' }}>{game.creator.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div
                                    style={{ padding: '0.8rem 1rem', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-panel)', color: '#3b82f6', fontSize: '0.9rem', fontWeight: '600', transition: 'background 0.2s', borderTop: '2px solid var(--border-main)' }}
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    See all results for "{searchQuery}"
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <Search size={24} style={{ opacity: 0.5 }} />
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>No experiences found match your search.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="user-nav">
                <Link to="/profile" className="user-profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                    {userProfile.avatar && <img src={userProfile.avatar} className="avatar" alt="Avatar" />}
                    <span>{userProfile.name}</span>
                </Link>
                <Link to="/premium" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: '0 0.5rem', textDecoration: 'none', gap: '0.5rem', background: 'rgba(251, 191, 36, 0.1)', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                    <div className="currency-icon"></div>
                    <span style={{ color: '#fbbf24', fontWeight: '800', fontSize: '0.95rem' }}>{userProfile.tokens || 0}</span>
                </Link>



                <Link to="/notifications" style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <img src="/bell-icon.png" alt="" style={{ width: '24px', opacity: 0 }} />
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute' }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                </Link>
            </div>
        </div>
    );
}
