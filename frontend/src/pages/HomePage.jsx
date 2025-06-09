import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import RegisterForm from '../components/RegisterForm';
import LoginForm from '../components/LoginForm';
import GameLobby from '../components/GameLobby';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('lobby');
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!user) {
    return (
      <div className="auth-container">
        <div className="tabs">
          <button 
            className={activeTab === 'login' ? 'active' : ''}
            onClick={() => setActiveTab('login')}
          >
            登录
          </button>
          <button 
            className={activeTab === 'register' ? 'active' : ''}
            onClick={() => setActiveTab('register')}
          >
            注册
          </button>
        </div>
        
        <div className="auth-content">
          {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
        </div>
        
        <div className="game-intro">
          <h2>十三水游戏规则</h2>
          <p>十三水是一种扑克牌游戏，玩家将13张牌分成三组进行比牌...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="user-welcome">
        <h2>欢迎, {user.phone}</h2>
        <p>当前积分: {user.points}</p>
      </div>
      
      <GameLobby />
      
      <div className="quick-actions">
        <button className="btn create-game" onClick={() => navigate('/game/create')}>
          创建新游戏
        </button>
        <button className="btn join-game" onClick={() => navigate('/game/join')}>
          加入游戏
        </button>
        <button className="btn profile" onClick={() => navigate('/profile')}>
          个人资料
        </button>
      </div>
    </div>
  );
};

export default HomePage;
