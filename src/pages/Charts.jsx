import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { Search, Hexagon, Bell, ChevronRight, Info, ChevronDown, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import GameDetailModal from '../components/GameDetailModal';

export default function Charts() {
    const navigate = useNavigate();
    const [topPlaying, setTopPlaying] = useState([]);
    const [topLiked, setTopLiked] = useState([]);
    const [topRated, setTopRated] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGame, setSelectedGame] = useState(null);

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

            setTopPlaying(updateList);
            setTopLiked(updateList);
            setTopRated(updateList);
        }
    };

    useEffect(() => {
        const fetchCharts = async () => {
            setIsLoading(true);
            try {
                // Fetch Most Played
                const { data: played } = await supabase
                    .from('experiences')
                    .select('*')
                    .order('plays', { ascending: false })
                    .limit(10);

                // Fetch Most Liked
                const { data: liked } = await supabase
                    .from('experiences')
                    .select('*')
                    .order('likes', { ascending: false })
                    .limit(10);

                // Fetch Top Rated
                const { data: rated } = await supabase
                    .from('experiences')
                    .select('*')
                    .order('rating', { ascending: false })
                    .limit(10);

                setTopPlaying(played || []);
                setTopLiked(liked || []);
                setTopRated(rated || []);
            } catch (err) {
                console.error("Error fetching charts:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCharts();
    }, []);

    const GameCard = ({ game, metricLabel, metricValue }) => (
        <div className="chart-card" style={{ cursor: 'pointer' }} onClick={() => setSelectedGame(game)}>
            <img src={game.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300'} alt={game.title} className="chart-card-img" />
            <div className="chart-card-title">{game.title}</div>

            <div className="chart-card-stats" style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{metricLabel}: <strong>{metricValue || 0}</strong></span>
            </div>
            <button
                className="btn btn-primary"
                style={{ marginTop: 'auto', padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer' }}
                onClick={(e) => {
                    e.stopPropagation();
                    navigate('/play', { state: { id: game.id, title: game.title, imageUrl: game.image_url, fileUrl: game.file_url } });
                }}
            >
                Play Now
            </button>
        </div>
    );

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="main-content">
                <TopNav />

                <div className="dashboard-scroll">
                    <div className="charts-filters">
                        <span className="filter-label">Popular on:</span>
                        <div className="filter-dropdowns">
                            <button className="filter-btn">
                                Computer <ChevronDown size={14} />
                            </button>
                            <button className="filter-btn">
                                All Locations <ChevronDown size={14} />
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Loader2 size={40} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
                            <p>Loading charts...</p>
                        </div>
                    ) : (
                        <>
                            {/* Ko'p o'ynalgan o'yinlar */}
                            <div className="chart-section-header">
                                <div className="chart-section-title">
                                    <h3>Ko'p o'ynalgan o'yinlar</h3>
                                    <ChevronRight size={18} color="#666" />
                                </div>
                                <Info size={18} color="#666" style={{ cursor: 'pointer' }} />
                            </div>
                            <div className="horizontal-scroll" style={{ marginBottom: '2.5rem' }}>
                                {topPlaying.map(game => <GameCard key={game.id} game={game} metricLabel="Plays" metricValue={game.plays} />)}
                            </div>

                            {/* Ko'p layk yig'gan o'yinlar */}
                            <div className="chart-section-header">
                                <div className="chart-section-title">
                                    <h3>Ko'p layk yig'gan o'yinlar</h3>
                                    <ChevronRight size={18} color="#666" />
                                </div>
                                <Info size={18} color="#666" style={{ cursor: 'pointer' }} />
                            </div>
                            <div className="horizontal-scroll" style={{ marginBottom: '2.5rem' }}>
                                {topLiked.map(game => <GameCard key={game.id} game={game} metricLabel="Likes" metricValue={game.likes} />)}
                            </div>

                            {/* Ko'p reyting yig'gan o'yinlar */}
                            <div className="chart-section-header">
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div className="chart-section-title">
                                        <h3>Ko'p reyting yig'gan o'yinlar</h3>
                                        <ChevronRight size={18} color="#666" />
                                    </div>
                                    <span className="chart-section-subtitle">O'yinchilar tomonidan yuqori baholangan</span>
                                </div>
                                <Info size={18} color="#666" style={{ cursor: 'pointer', alignSelf: 'flex-start' }} />
                            </div>
                            <div className="horizontal-scroll" style={{ marginBottom: '2.5rem' }}>
                                {topRated.map(game => <GameCard key={game.id} game={game} metricLabel="Rating" metricValue={game.rating} />)}
                            </div>
                        </>
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
