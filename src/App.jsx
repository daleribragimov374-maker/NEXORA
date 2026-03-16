import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Charts from './pages/Charts';


import More from './pages/More';
import Profile from './pages/Profile';
import Premium from './pages/Premium';

import Notifications from './pages/Notifications';
import CreateGame from './pages/CreateGame';
import GamePlayer from './pages/GamePlayer';
import SearchPage from './pages/Search';
import Admin from './pages/Admin';
import './App.css';

function ThemeManager() {
  const location = useLocation();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isAuthenticated') === 'true';
    const isAuthPage = (location.pathname === '/' && !isLoggedIn) || location.pathname === '/sign-in' || location.pathname === '/sign-up';
    if (isAuthPage) {
      document.body.className = 'auth-mode';
    } else {
      const theme = localStorage.getItem('theme') || 'light';
      document.body.className = theme === 'dark' ? 'dark-mode' : 'app-mode';
    }
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <ThemeManager />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/charts" element={<Charts />} />


        <Route path="/more" element={<More />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/premium" element={<Premium />} />

        <Route path="/notifications" element={<Notifications />} />
        <Route path="/create" element={<CreateGame />} />
        <Route path="/play" element={<GamePlayer />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
