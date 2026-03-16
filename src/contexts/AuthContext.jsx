import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [tokens, setTokens] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchTokens = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('tokens')
                .eq('id', userId)
                .single();
            if (!error && data) {
                setTokens(data.tokens);
            }
        } catch (err) {
            console.error('Error fetching tokens:', err);
        }
    };

    useEffect(() => {
        // 1. Get initial session
        const getInitialSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);
                if (session?.user) {
                    fetchTokens(session.user.id);
                }
            } catch (error) {
                console.error('Error getting initial session:', error);
            } finally {
                setLoading(false);
            }
        };

        getInitialSession();

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);

            if (session) {
                localStorage.setItem('isAuthenticated', 'true');
                fetchTokens(session.user.id);
            } else {
                localStorage.removeItem('isAuthenticated');
                setTokens(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const value = {
        user,
        tokens,
        loading,
        refreshTokens: () => user && fetchTokens(user.id),
        signOut: () => supabase.auth.signOut(),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
