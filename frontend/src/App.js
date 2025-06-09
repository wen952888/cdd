import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GameRoom from './pages/GameRoom';
import ProfilePage from './pages/ProfilePage';
import { authCheck } from './services/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await authCheck();
        setIsAuthenticated(true);
        setUserData(data);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  if (loading) {
    return <div className="loading-screen">加载中...</div>;
  }

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={isAuthenticated ? <HomePage userData={userData} /> : <Navigate to="/login" />} />
          <Route path="/game/:roomId" element={isAuthenticated ? <GameRoom userData={userData} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={isAuthenticated ? <ProfilePage userData={userData} setUserData={setUserData} /> : <Navigate to="/login" />} />
          <Route path="/login" element={!isAuthenticated ? <HomePage isLoginPage={true} /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <HomePage isRegisterPage={true} /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
