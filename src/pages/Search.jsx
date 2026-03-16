import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import GameDetailModal from '../components/GameDetailModal';

// Removed mock games

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const navigate = useNavigate();

    const handleStatsUpdate = async (gameId) => {
        const { data: updatedGame } = await supabase
            .from('experiences')
            .select('*')
            .eq('id', gameId)
            .single();
        
        if (updatedGame) {
            setResults(prev => prev.map(g => g.id === gameId ? { 
                ...g, 
                plays: updatedGame.plays || 0,
                likes: updatedGame.likes || 0,
                dislikes: updatedGame.dislikes || 0
            } : g));
        }
    };

    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGame, setSelectedGame] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch matching experiences from Supabase
                const { data: dbExperiences } = await supabase
                    .from('experiences')
                    .select('*, profiles(username, avatar_url)')
                    .ilike('title', `%${query}%`);

                if (dbExperiences) {
                    const formatted = dbExperiences.map(exp => ({
                        id: exp.id,
                        title: exp.title,
                        plays: exp.plays || 0,
                        likes: exp.likes || 0,
                        dislikes: exp.dislikes || 0,
                        description: exp.description,
                        image_url: exp.image_url,
                        file_url: exp.file_url,
                        creator_name: exp.profiles?.username || 'Creator',
                        img: exp.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300',
                        fileUrl: exp.file_url,
                        creator: {
                            name: exp.profiles?.username || 'Creator',
                            avatar: exp.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${exp.profiles?.username || 'Creator'}`
                        }
                    }));
                    setResults(formatted);
                }
            } catch (err) {
                console.error("Error searching:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (query) {
            fetchResults();
        } else {
            setResults([]);
            setIsLoading(false);
        }
    }, [query]);

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="main-content">
                <TopNav />
                <div className="dashboard-scroll" style={{ padding: '2rem' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>
                            Search Results for <span style={{ color: '#3b82f6' }}>"{query}"</span>
                        </h1>
                        <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Found {results.length} experiences</p>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
                            <p>Searching the metaverse...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            {results.map(game => (
                                <div
                                    key={game.id}
                                    className="small-card"
                                    style={{ cursor: 'pointer', margin: 0, width: '100%', minWidth: '0' }}
                                    onClick={() => setSelectedGame(game)}
                                >
                                    <img src={game.img} alt={game.title} className="small-card-img" style={{ width: '100%' }} />
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
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M10 10l4 2-4 2V10z" />
                                            </svg>
                                            Play
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--bg-panel)', borderRadius: '16px', border: '1px dashed var(--border-main)' }}>
                            <Search size={48} style={{ color: 'var(--border-main)', margin: '0 auto 1rem auto' }} />
                            <h3 style={{ color: 'var(--text-main)', fontSize: '1.2rem', margin: '0 0 0.5rem 0' }}>No experiences found</h3>
                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Try adjusting your search terms.</p>
                        </div>
                    )}
                </div>
            </div>

            <GameDetailModal 
                game={selectedGame}
                onClose={() => setSelectedGame(null)}
                onPlay={(g) => navigate('/play', { state: { id: g.id, title: g.title, imageUrl: g.image_url, fileUrl: g.file_url } })}
                onStatsUpdate={handleStatsUpdate}
            />
        </div>
    );
}
