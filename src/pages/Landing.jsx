import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Landing() {
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navigate('/home', { replace: true });
            }
        };
        checkAuth();
    }, [navigate]);

    return (
        <div className="page-container">
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 3.5rem', minWidth: '450px' }}>
                <h1 className="brand-title" style={{ fontSize: '3.5rem', marginBottom: '3rem' }}>
                    N<span className="logo-icon"></span>XORA
                </h1>

                <div className="flex-col gap-4">
                    <Link to="/sign-up" className="btn btn-primary w-full" style={{ marginBottom: '1.25rem', padding: '1rem', fontSize: '1.05rem', color: '#fff', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                        Create Account
                    </Link>
                    <Link to="/sign-in" className="btn btn-outline w-full" style={{ padding: '1rem', fontSize: '1.05rem', color: '#fff', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                        Sign In
                    </Link>
                </div>

                <div style={{ marginTop: '3rem', display: 'flex', gap: '2rem', justifyContent: 'center', fontSize: '0.95rem' }}>
                    <a href="#" style={{ color: '#fff', textDecoration: 'underline' }}>Terms</a>
                    <a href="#" style={{ color: '#fff', textDecoration: 'underline' }}>Privacy</a>
                </div>
            </div>
        </div>
    );
}
