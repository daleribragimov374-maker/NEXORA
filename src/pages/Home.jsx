import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Hexagon, Search, Bell, X, UserPlus, Check, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { useAuth } from '../contexts/AuthContext';
import GameDetailModal from '../components/GameDetailModal';

export default function Home() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const [username, setUsername] = useState('...');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [myUserId, setMyUserId] = useState(null);
    const [userExperiences, setUserExperiences] = useState([]);
    const [allExperiences, setAllExperiences] = useState([]);
    const [selectedGame, setSelectedGame] = useState(null);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            localStorage.removeItem('isAuthenticated');
            setIsAuthenticated(false);
            navigate('/', { replace: true });
            return;
        }

        const initializeHome = async () => {
            setIsAuthenticated(true);
            const name = user.user_metadata?.display_name || user.user_metadata?.username || user.user_metadata?.full_name || user.email.split('@')[0];
            setUsername(name);
            setAvatarUrl(user.user_metadata?.avatar_url || '');
            setMyUserId(user.id);

            // Fetch user's created experiences
            const { data: experiences, error } = await supabase
                .from('experiences')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (!error && experiences) {
                setUserExperiences(experiences.map(exp => ({
                    id: exp.id,
                    title: exp.title,
                    creator: {
                        name: name,
                        avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
                    },
                    img: exp.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300',
                    isReal: true,
                    fileUrl: exp.file_url
                })));
            }

            // Fetch ALL experiences
            const { data: allExpData, error: allError } = await supabase
                .from('experiences')
                .select(`*, profiles(username, avatar_url)`)
                .order('created_at', { ascending: false });

            if (!allError && allExpData) {
                    setAllExperiences(allExpData.map(exp => ({
                        id: exp.id,
                        title: exp.title,
                        plays: exp.plays || 0,
                        likes: exp.likes || 0,
                        dislikes: exp.dislikes || 0,
                        description: exp.description,
                        image_url: exp.image_url,
                        file_url: exp.file_url,
                        creator_name: exp.profiles?.username || 'Creator',
                        creator: {
                            name: exp.profiles?.username || 'Creator',
                            avatar: exp.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${exp.profiles?.username || 'Creator'}`
                        },
                        img: exp.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300',
                        isReal: true,
                        fileUrl: exp.file_url
                    })));
            } else {
                const { data: fallbackData } = await supabase
                    .from('experiences')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (fallbackData) {
                    setAllExperiences(fallbackData.map(exp => ({
                        id: exp.id,
                        title: exp.title,
                        creator: {
                            name: 'Creator',
                            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${exp.user_id}`
                        },
                        img: exp.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300',
                        isReal: true,
                        fileUrl: exp.file_url
                    })));
                }
            }
        };

        initializeHome();
    }, [user, loading, navigate]);

    // Load Connections (Friends) and their profiles
    const fetchConnections = async () => {
        if (!myUserId) return;
        try {
            const { data, error } = await supabase
                .from('connections')
                .select(`friend_id, profiles!connections_friend_id_fkey(username, avatar_url, current_activity)`)
                .eq('user_id', myUserId);

            if (!error && data) {
                const formatted = data.map(c => ({
                    id: c.friend_id,
                    name: c.profiles?.username || 'Unknown',
                    img: c.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=Friend${c.friend_id}`,
                    current_activity: c.profiles?.current_activity || null
                }));
                setConnections(formatted);
            }
        } catch (err) { console.error('Error fetching connections:', err); }
    };

    useEffect(() => {
        fetchConnections();
        // Optionally, set up interval to refresh friends' status
        const interval = setInterval(fetchConnections, 15000);
        return () => clearInterval(interval);
    }, [myUserId]);

    const handleStatsUpdate = async (gameId) => {
        const { data: updatedGame } = await supabase
            .from('experiences')
            .select('*')
            .eq('id', gameId)
            .single();
        
        if (updatedGame) {
            const updateList = (list) => list.map(g => g.id === gameId ? { 
                ...g, 
                plays: updatedGame.plays || 0,
                likes: updatedGame.likes || 0,
                dislikes: updatedGame.dislikes || 0
            } : g);

            setAllExperiences(updateList);
            setUserExperiences(updateList);
        }
    };

    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [connections, setConnections] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);

    // Live search for users
    useEffect(() => {
        const searchUsers = async () => {
            if (searchQuery.trim().length === 0) {
                setSearchResults([]);
                return;
            }
            setIsSearchingUsers(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .neq('id', myUserId)
                .ilike('username', `%${searchQuery}%`)
                .limit(10);

            if (!error && data) {
                setSearchResults(data.map(u => ({
                    id: u.id,
                    name: u.username || 'User',
                    img: u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
                    status: connections.some(c => c.id === u.id) ? 'Requested' : 'online'
                })));
            }
            setIsSearchingUsers(false);
        };

        const delaySearch = setTimeout(searchUsers, 500);
        return () => clearTimeout(delaySearch);
    }, [searchQuery, myUserId, connections]);

    const handleAddFriend = async (id) => {
        if (!myUserId) return;

        // Optimistic UI update
        const friendToAdd = searchResults.find(u => u.id === id);
        if (friendToAdd && !connections.find(c => c.id === id)) {
            setConnections(prev => [...prev, { ...friendToAdd, current_activity: null }]);
        }
        setSearchResults(searchResults.map(user =>
            user.id === id ? { ...user, status: 'Requested' } : user
        ));

        // DB Insert
        const { error } = await supabase.from('connections').insert({
            user_id: myUserId,
            friend_id: id
        });
        if (error) console.error("Error adding connection:", error);
    };

    const handleDeleteFriend = async (id) => {
        // Optimistic UI update
        setConnections(prev => prev.filter(friend => friend.id !== id));
        setSearchResults(searchResults.map(user =>
            user.id === id ? { ...user, status: 'online' } : user
        ));

        // DB Delete
        await supabase.from('connections')
            .delete()
            .eq('user_id', myUserId)
            .eq('friend_id', id);
    };



    const todaysPicks = [];
    const continueGames = [];
    const sponsoredGames = [];
    const recommendedGames = [];
    const friendActivity = [];

    if (!isAuthenticated) {
        return null; // Or a loading spinner while checking auth
    }

    return (
        <div className="dashboard-layout">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="main-content">

                {/* Top Navigation */}
                <TopNav />

                {/* Scrollable Dashboard Area */}
                <div className="dashboard-scroll">

                    {/* Roblox Style Greeting */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '4px solid var(--border-main)', overflow: 'hidden', background: 'var(--bg-panel)' }}>
                            <img src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-main)' }}>Hello, {username}!</h1>
                        </div>
                    </div>

                    {/* Friends Section with Connect Button */}
                    <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>Friends {connections.length > 0 && `(${connections.length})`}</span>
                    </div>

                    <div style={{ background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--border-main)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ display: 'flex', marginLeft: '0.5rem' }}>
                                {connections.length > 0 ? (
                                    connections.slice(0, 3).map(user => (
                                        <div key={user.id} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--bg-panel)', marginLeft: '-12px', overflow: 'hidden', background: 'var(--bg-main)' }}>
                                            <img src={user.img} alt="" style={{ width: '100%', height: '100%' }} />
                                        </div>
                                    ))
                                ) : (
                                    [1, 2, 3].map(i => (
                                        <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--bg-panel)', marginLeft: '-12px', overflow: 'hidden', background: 'var(--bg-main)' }}>
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Friend${i}`} alt="" style={{ width: '100%', height: '100%' }} />
                                        </div>
                                    ))
                                )}
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {connections.length > 0 ? "Connect with more friends!" : "Connect with your friends to play together!"}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsSearchModalOpen(true)}
                            className="btn btn-primary"
                            style={{ width: 'auto', padding: '0.6rem 1.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: '700' }}
                        >
                            <UserPlus size={18} />
                            Connect
                        </button>
                    </div>

                    {connections.length > 0 && (
                        <div className="horizontal-scroll" style={{ paddingLeft: '0', marginBottom: '1.5rem' }}>
                            {connections.map(user => (
                                <div className="connection-item" key={user.id} style={{ minWidth: '100px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div className="connection-avatar" style={{ border: user.current_activity ? '3px solid #10b981' : 'none', boxShadow: 'none', width: '70px', height: '70px' }}>
                                        <img src={user.img} alt={user.name} style={{ borderRadius: '50%', width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <span className="badge-online" style={{ border: '3px solid var(--bg-main)', right: '5px', bottom: '5px' }}></span>
                                    </div>
                                    <span className="connection-name" style={{ fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 'bold' }}>{user.name}</span>

                                    {user.current_activity && (
                                        <button
                                            onClick={() => navigate('/play', {
                                                state: {
                                                    id: user.current_activity.id,
                                                    title: user.current_activity.title,
                                                    imageUrl: user.current_activity.imageUrl || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300',
                                                    fileUrl: user.current_activity.fileUrl || null
                                                }
                                            })}
                                            style={{ marginTop: '0.4rem', padding: '0.2rem 0.6rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 'bold' }}>
                                            Join Game
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDeleteFriend(user.id)}
                                        style={{
                                            position: 'absolute',
                                            top: '-5px',
                                            right: '5px',
                                            background: 'var(--bg-panel)',
                                            border: '1px solid var(--border-main)',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            padding: '4px',

                                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                        }}
                                        title="Remove Friend"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="section-title" style={{ marginTop: '2rem' }}>
                        Community Games
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
                    </div>
                    <div className="horizontal-scroll">
                        {allExperiences.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No community games available yet.</div>
                        ) : allExperiences.map(game => (
                            <div 
                                className="small-card" 
                                key={game.id} 
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelectedGame(game)}
                            >
                                <img src={game.img} alt={game.title} className="small-card-img" />
                                <div className="small-card-content">
                                    <div>
                                        <div className="small-card-title">{game.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', gap: '1rem' }}>
                                            <span>Plays: <b>{game.plays || 0}</b></span>
                                            <span>Likes: <b>{game.likes || 0}</b></span>
                                        </div>
                                        <div className="small-card-creator">
                                            <img src={game.creator.avatar} alt={game.creator.name} className="creator-avatar" />
                                            <span className="creator-name">{game.creator.name}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        style={{ padding: '0.5rem', fontSize: '0.8rem', borderRadius: '8px', width: '100%', gap: '0.3rem', background: '#3b82f6', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate('/play', { state: { id: game.id, title: game.title, imageUrl: game.img, fileUrl: game.fileUrl || null } });
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M10 10l4 2-4 2V10z" /></svg>
                                        Play
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Continue Section */}
                    <div className="section-title" style={{ marginTop: '2rem' }}>
                        Your Games
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                    <div className="horizontal-scroll">
                        {userExperiences.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>You haven't created any games yet.</div>
                        ) : userExperiences.map(game => (
                            <div 
                                className="small-card" 
                                key={game.id} 
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelectedGame({
                                    ...game,
                                    image_url: game.img,
                                    file_url: game.fileUrl,
                                    creator_name: game.creator.name
                                })}
                            >
                                <img src={game.img} alt={game.title} className="small-card-img" />
                                <div className="small-card-content">
                                    <div>
                                        <div className="small-card-title">{game.title}</div>
                                        <div className="small-card-creator">
                                            <img src={game.creator.avatar} alt={game.creator.name} className="creator-avatar" />
                                            <span className="creator-name">{game.creator.name}</span>
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        style={{ padding: '0.5rem', fontSize: '0.8rem', borderRadius: '8px', width: '100%', gap: '0.3rem', background: '#3b82f6', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate('/play', { state: { id: game.id, title: game.title, imageUrl: game.img, fileUrl: game.fileUrl || null } });
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M10 10l4 2-4 2V10z" /></svg>
                                        Play
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>

            {/* Connections Search Modal */}
            {isSearchModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: 'var(--bg-panel)', width: '90%', maxWidth: '500px', borderRadius: '12px', border: '1px solid var(--border-main)', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 'bold' }}>Find Friends</h2>
                            <button onClick={() => setIsSearchModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--search-bg)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-main)' }}>
                                <Search size={20} color="var(--text-muted)" style={{ marginRight: '0.75rem' }} />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', color: 'var(--text-main)', outline: 'none', width: '100%', fontSize: '1rem' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {isSearchingUsers ? (
                                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>Qidirilmoqda...</div>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map(user => (
                                        <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-hover)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-main)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <img src={user.img} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                                                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user.name}</span>
                                            </div>
                                            <button
                                                onClick={() => handleAddFriend(user.id)}
                                                className={user.status === 'Requested' ? "btn btn-outline" : "btn btn-primary"}
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: user.status === 'Requested' ? 'var(--border-main)' : '' }}
                                                disabled={user.status === 'Requested'}
                                            >
                                                {user.status === 'Requested' ? <><Check size={16} /> Qo'shilgan</> : <><UserPlus size={16} /> Qo'shish</>}
                                            </button>
                                        </div>
                                    ))
                                ) : searchQuery.trim().length > 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <Search size={40} color="var(--border-main)" />
                                        <span>"{searchQuery}" ismli foydalanuvchi topilmadi</span>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                                        Foydalanuvchi qidirish uchun ismini yozing
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Game Detail Modal */}
            <GameDetailModal 
                game={selectedGame}
                onClose={() => setSelectedGame(null)}
                onPlay={(g) => navigate('/play', { state: { id: g.id, title: g.title, imageUrl: g.image_url, fileUrl: g.file_url } })}
                onStatsUpdate={handleStatsUpdate}
            />
        </div>
    );

}
