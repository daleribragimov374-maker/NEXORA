import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function SignIn() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (authError) {
                let errorMsg = authError.message;
                if (errorMsg === 'Invalid login credentials') {
                    errorMsg = "Email yoki parol noto'g'ri.";
                }
                setError(errorMsg);
                setLoading(false);
                return;
            }

            localStorage.setItem('isAuthenticated', 'true');
            navigate('/home', { replace: true });

        } catch (err) {
            setError("Tizimda xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.");
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="auth-box" style={{ textAlign: 'center' }}>
                <h1 className="brand-title" style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>
                    N<span className="logo-icon"></span>XORA
                </h1>

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                        color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '8px',
                        fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'left'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignIn} style={{ marginTop: '2rem' }}>
                    <div className="input-group">
                        <input
                            type="email"
                            className="form-input"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '8px' }}
                        />
                    </div>

                    <div className="input-group" style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="form-input"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ padding: '1rem', paddingRight: '2.5rem', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: '8px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: '#a0a0a0',
                                cursor: 'pointer'
                            }}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ marginTop: '1rem', padding: '0.85rem', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="flex-col gap-4" style={{ marginTop: '1.5rem' }}>

                    <button 
                        type="button"
                        onClick={() => navigate('/sign-up')}
                        className="btn btn-outline" 
                        style={{ padding: '0.85rem', color: '#fff' }}
                    >
                        Create Account
                    </button>
                </div>

                <div style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
                    <a href="#" style={{ color: '#fff' }}>Forgot Password or Username?</a>
                </div>

                <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1.5rem', justifyContent: 'center', fontSize: '0.85rem' }}>
                    <a href="#" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Terms</a>
                    <a href="#" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Privacy</a>
                </div>

                <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                    <Link to="/" style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>×</Link>
                </div>
            </div>
        </div>
    );
}
