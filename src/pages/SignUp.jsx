import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function SignUp() {
    const [showPassword, setShowPassword] = useState(false);
    const [gender, setGender] = useState(null);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [birthday, setBirthday] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            console.log('Attempting sign up for:', email, username);
            const { data, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username,
                        display_name: username,
                        full_name: username,
                        birthday: birthday,
                        gender: gender,
                    }
                }
            });

            if (authError) {
                console.error('Auth Sign Up Error:', authError);
                setError(authError.message);
                setLoading(false);
                return;
            }

            console.log('User signed up successfully:', data?.user?.id);

            // Create profile and settings records explicitly
            if (data?.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: data.user.id,
                        username: username,
                        updated_at: new Date()
                    }]);

                if (profileError) {
                    console.warn('Profile creation error:', profileError);
                }

                const { error: settingsError } = await supabase
                    .from('user_settings')
                    .insert([{
                        user_id: data.user.id,
                        dark_mode: localStorage.getItem('theme') === 'dark',
                        notifications_enabled: true,
                        language: 'Uzbek'
                    }]);

                if (settingsError) {
                    console.warn('Settings creation error:', settingsError);
                }
            }

            // Auto sign-in after registration
            localStorage.setItem('isAuthenticated', 'true');
            navigate('/home', { replace: true });

        } catch (err) {
            setError('Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="glass-modal auth-box" style={{ maxWidth: '440px', padding: '0', overflow: 'hidden' }}>

                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link to="/" style={{ color: '#fff', fontSize: '1.25rem', padding: '0 0.5rem' }}>✕</Link>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>Create Account</h2>
                    <div style={{ width: '2rem' }}></div>
                </div>

                <div style={{ padding: '1.5rem 2rem' }}>

                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#fca5a5', padding: '0.75rem 1rem', borderRadius: '8px',
                            fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'left'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignUp}>

                        <div className="input-group">
                            <label className="input-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ backgroundColor: '#181a1c', padding: '0.75rem', borderColor: '#2f3133' }}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Birthday</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={birthday}
                                    onChange={(e) => setBirthday(e.target.value)}
                                    style={{ backgroundColor: '#181a1c', padding: '0.75rem', borderColor: '#2f3133', colorScheme: 'dark' }}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Username</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Don't use your real name"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                style={{ backgroundColor: '#181a1c', padding: '0.75rem', borderColor: '#2f3133' }}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-input"
                                    placeholder="At least 8 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ backgroundColor: '#181a1c', padding: '0.75rem', paddingRight: '2.5rem', borderColor: '#2f3133' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer' }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Gender (optional)</label>
                            <div style={{ display: 'flex', border: '1px solid #2f3133', borderRadius: '6px', overflow: 'hidden' }}>
                                <button
                                    type="button"
                                    onClick={() => setGender('female')}
                                    style={{
                                        flex: 1, padding: '0.75rem', background: gender === 'female' ? '#2f3133' : '#181a1c',
                                        border: 'none', borderRight: '1px solid #2f3133', color: '#fff', cursor: 'pointer', transition: '0.2s'
                                    }}
                                >
                                    ♀️
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGender('male')}
                                    style={{
                                        flex: 1, padding: '0.75rem', background: gender === 'male' ? '#2f3133' : '#181a1c',
                                        border: 'none', color: '#fff', cursor: 'pointer', transition: '0.2s'
                                    }}
                                >
                                    ♂️
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn"
                            disabled={loading}
                            style={{ width: '100%', marginTop: '1rem', padding: '0.85rem', backgroundColor: '#3b82f6', color: '#fff', borderRadius: '6px', opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#b0b0b0', textAlign: 'center', lineHeight: '1.4' }}>
                        By clicking Create Account, you are agreeing to the Terms of Use including the arbitration clause and you are acknowledging the Privacy Policy.
                    </p>

                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', justifyContent: 'center', fontSize: '0.85rem' }}>
                        <a href="#" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Terms</a>
                        <a href="#" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Privacy</a>
                    </div>

                </div>
            </div>
        </div>
    );
}
