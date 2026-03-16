import { Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, BarChart2, User, Users, MoreHorizontal, Layout, Shield, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
    const location = useLocation();
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!user) {
            setIsAdmin(false);
            return;
        }

        const checkAdmin = async () => {
            // Check hardcoded IDs first for immediate access
            if (['99160839-ad7a-42ce-8ce1-706e0cff1886', '21d6a968-5ecf-48db-ab7e-ca8d4575ff8b'].includes(user.id)) {
                setIsAdmin(true);
                return;
            }

            // Fallback to database check
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single();

                if (!error && data?.is_admin) {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            } catch (err) {
                console.error("Admin check error:", err);
                setIsAdmin(false);
            }
        };

        checkAdmin();
    }, [user]);

    const handleSignOut = () => {
        localStorage.removeItem('isAuthenticated');
        window.location.href = '/';
    };

    const navItems = [
        { path: '/home', label: 'Home', icon: HomeIcon },

        { path: '/create', label: 'Create', icon: Layout },
        { path: '/charts', label: 'Charts', icon: BarChart2 },
        { path: '/premium', label: 'Premium', icon: Zap },
        { path: '/more', label: 'More', icon: MoreHorizontal },
    ];

    if (isAdmin) {
        navItems.push({ path: '/admin', label: 'Admin', icon: Shield });
    }

    return (
        <div className="sidebar">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                    <Link
                        to={item.path}
                        key={item.label}
                        className="sidebar-item"
                        style={{
                            color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                            fontWeight: isActive ? '700' : '500',
                            backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                            textDecoration: 'none',
                            borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent'
                        }}
                    >
                        <Icon className="sidebar-icon" size={24} strokeWidth={isActive ? 3 : 2} />
                        {item.label}
                    </Link>
                );
            })}

            {/* Logout Button */}
            <div
                className="sidebar-item"
                onClick={handleSignOut}
                style={{ marginTop: 'auto', marginBottom: '1rem', cursor: 'pointer', color: '#ef4444' }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-icon">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
            </div>
        </div>
    );
}
