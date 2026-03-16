import { X, ThumbsUp, ThumbsDown, Users, Play, Clock, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function GameDetailModal({ game: initialGame, onClose, onPlay, onStatsUpdate }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [game, setGame] = useState(initialGame);
    const [userVote, setUserVote] = useState(null); // 'like', 'dislike', or null
    const [isVoting, setIsVoting] = useState(false);
    const [activePlayers, setActivePlayers] = useState(0);

    // Sync state when initialGame changes (e.g. switching between different game modals)
    useEffect(() => {
        if (initialGame) {
            setGame(initialGame);
            setUserVote(null); // Reset vote until fetched
            setActivePlayers(0);
        }
    }, [initialGame?.id]);

    useEffect(() => {
        if (!initialGame?.id) return;
        
        const refreshStats = async () => {
            try {
                // 1. Fetch latest experience stats (likes, plays)
                const { data: updatedGame, error: expError } = await supabase
                    .from('experiences')
                    .select('*')
                    .eq('id', initialGame.id)
                    .single();
                
                if (!expError && updatedGame) {
                    setGame(updatedGame);
                }

                // 2. Fetch real active players count - Use proper syntax for JSONB
                // We use ->> for text comparison inside JSONB
                const { count, error: playersError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .filter('current_activity->>id', 'eq', initialGame.id);
                
                if (!playersError) setActivePlayers(count || 0);

                if (user) {
                    const { data: voteData, error: voteError } = await supabase
                        .from('experience_votes')
                        .select('vote_type')
                        .eq('user_id', user.id)
                        .eq('experience_id', initialGame.id)
                        .maybeSingle(); // maybeSingle handles 0 or 1 result better than .single()
                    
                    if (!voteError) {
                        setUserVote(voteData ? voteData.vote_type : null);
                    }
                }
            } catch (err) {
                console.error("Error refreshing modal stats:", err);
            }
        };

        refreshStats();
        // Refresh active players every 30 seconds while modal is open
        const interval = setInterval(refreshStats, 30000);
        return () => clearInterval(interval);
    }, [initialGame?.id, user]);

    if (!game) return null;

    const handleVote = async (type) => {
        if (!user || isVoting) return;

        setIsVoting(true);
        const oldVote = userVote;
        const newVote = userVote === type ? null : type;
        
        // Optimistic update
        const updatedGameLocal = { ...game };
        
        // Remove old vote impact
        if (oldVote === 'like') updatedGameLocal.likes = Math.max(0, (updatedGameLocal.likes || 0) - 1);
        if (oldVote === 'dislike') updatedGameLocal.dislikes = Math.max(0, (updatedGameLocal.dislikes || 0) - 1);
        
        // Add new vote impact
        if (newVote === 'like') updatedGameLocal.likes = (updatedGameLocal.likes || 0) + 1;
        if (newVote === 'dislike') updatedGameLocal.dislikes = (updatedGameLocal.dislikes || 0) + 1;
        
        setUserVote(newVote);
        setGame(updatedGameLocal);

        try {
            let error;
            if (newVote === null) {
                // Remove vote
                const { error: delError } = await supabase
                    .from('experience_votes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('experience_id', game.id);
                error = delError;
            } else {
                // Upsert vote
                const { error: upError } = await supabase
                    .from('experience_votes')
                    .upsert({
                        user_id: user.id,
                        experience_id: game.id,
                        vote_type: type
                    }, { onConflict: 'user_id,experience_id' });
                error = upError;
            }

            if (error) throw error;

            // Notify parent to refresh stats (optional, as Modal has its own refresh)
            if (onStatsUpdate) onStatsUpdate(game.id);

        } catch (err) {
            console.error("Voting error details:", err);
            // Revert on error
            setUserVote(oldVote);
            setGame(game);
            
            if (err.message?.includes('schema cache')) {
                alert("Xato: 'experience_votes' jadvali topilmadi. Iltimos, SQL skriptni Supabase-da ishga tushiring.");
            }
        } finally {
            setIsVoting(false);
        }
    };

    // Calculate rating percentage safely
    const totalVotes = (Number(game.likes) || 0) + (Number(game.dislikes) || 0);
    const ratingPercent = totalVotes > 0 
        ? Math.round((Number(game.likes || 0) / totalVotes) * 100) 
        : 0;

    return (
        <div className="modal-overlay" style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', 
            zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', animation: 'fadeIn 0.3s ease'
        }}>
            <div className="modal-content" style={{ 
                background: 'var(--bg-panel)', border: '1px solid var(--border-main)', 
                borderRadius: '24px', width: '100%', maxWidth: '600px', 
                overflow: 'hidden', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Header/Close */}
                <button 
                    onClick={() => {
                        onClose();
                        navigate('/');
                    }}
                    style={{ 
                        position: 'absolute', top: '1.5rem', right: '1.5rem', 
                        background: 'rgba(255,255,255,0.05)', border: 'none', 
                        borderRadius: '50%', width: '40px', height: '40px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-main)', cursor: 'pointer', zIndex: 10,
                        transition: 'all 0.2s'
                    }}
                    className="close-hover"
                >
                    <X size={20} />
                </button>

                {/* Hero Section */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
                    <img 
                        src={game.image_url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600'} 
                        alt={game.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ 
                        position: 'absolute', bottom: 0, left: 0, right: 0, 
                        background: 'linear-gradient(to top, var(--bg-panel), transparent)',
                        padding: '2rem 2rem 1rem 2rem'
                    }}>
                        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                            {game.title}
                        </h2>
                        <p style={{ margin: '0.5rem 0 0 0', color: '#3b82f6', fontWeight: '600', fontSize: '1rem' }}>
                            By {game.creator_name || 'Nexora Developer'}
                        </p>
                    </div>
                </div>

                {/* Stats & Actions Section */}
                <div style={{ padding: '1.5rem 2rem 2.5rem 2rem' }}>
                    
                    {/* Stats Grid - Matching User Screenshot */}
                    {/* Stats Pill Row - Matching User Screenshot */}
                    <div style={{ 
                        display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap'
                    }}>
                        {/* Rating Pill */}
                        <div style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            borderRadius: '100px', 
                            padding: '0.4rem 0.6rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem',
                            border: '1px solid var(--border-main)'
                        }}>
                            <button 
                                onClick={() => handleVote('like')}
                                disabled={isVoting}
                                style={{
                                    background: 'transparent', border: 'none', color: userVote === 'like' ? '#10b981' : 'var(--text-main)', 
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.4rem 0.6rem', borderRadius: '100px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <ThumbsUp size={18} fill={userVote === 'like' ? 'currentColor' : 'none'} />
                                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{game.likes || 0}</span>
                            </button>
                            <div style={{ width: '1px', height: '16px', background: 'var(--border-main)' }}></div>
                            <button 
                                onClick={() => handleVote('dislike')}
                                disabled={isVoting}
                                style={{
                                    background: 'transparent', border: 'none', color: userVote === 'dislike' ? '#ef4444' : 'var(--text-main)', 
                                    display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.4rem 0.6rem', borderRadius: '100px', transition: 'all 0.2s'
                                }}
                            >
                                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{game.dislikes || 0}</span>
                                <ThumbsDown size={18} fill={userVote === 'dislike' ? 'currentColor' : 'none'} />
                            </button>
                        </div>

                        {/* Active Players Pill */}
                        <div style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            borderRadius: '100px', 
                            padding: '0.6rem 1.2rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.6rem',
                            border: '1px solid var(--border-main)'
                        }}>
                            <Users size={18} style={{ color: 'var(--text-main)' }} />
                            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                {activePlayers >= 1000 ? (activePlayers/1000).toFixed(1) + 'K' : activePlayers} active
                            </span>
                        </div>

                        {/* Visits Pill */}
                        <div style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            borderRadius: '100px', 
                            padding: '0.6rem 1.2rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.6rem',
                            border: '1px solid var(--border-main)'
                        }}>
                            <BarChart3 size={18} style={{ color: 'var(--text-main)' }} />
                            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                {game.plays?.toLocaleString() || 0} visits
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h4 style={{ color: 'var(--text-main)', marginBottom: '0.5rem', fontSize: '1rem' }}>About this experience</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                            {game.description || "Enter this immersive world and experience what the Nexora community has built. Play with friends and explore new challenges."}
                        </p>
                    </div>

                    {/* Play Button */}
                    <button 
                        onClick={() => onPlay(game)}
                        style={{ 
                            width: '100%', background: '#3b82f6', border: 'none', 
                            color: 'white', padding: '1.2rem', borderRadius: '16px', 
                            fontSize: '1.2rem', fontWeight: '800', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                            boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)',
                            transition: 'transform 0.2s, background 0.2s'
                        }}
                        className="play-large-btn"
                    >
                        <Play size={24} fill="currentColor" /> Play Now
                    </button>

                </div>
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .close-hover:hover { background: rgba(255,255,255,0.1) !important; transform: scale(1.1); }
                .stat-btn:hover { background: rgba(255,255,255,0.1) !important; transform: translateY(-2px); }
                .play-large-btn:hover { background: #2563eb !important; transform: translateY(-3px); }
                .play-large-btn:active { transform: translateY(0); }
            `}</style>
        </div>
    );
}

const statBtnStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-main)',
    borderRadius: '10px',
    padding: '0.6rem 1rem',
    color: 'var(--text-main)',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};
