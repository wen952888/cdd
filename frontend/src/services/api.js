const API_BASE_URL = 'http://9525.ip-ddns.com/api';

export const registerUser = async (phone, password) => {
  const response = await fetch(`${API_BASE_URL}/user/register.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone, password })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '注册失败');
  }
  
  return response.json();
};

export const loginUser = async (phone, password) => {
  const response = await fetch(`${API_BASE_URL}/user/login.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ phone, password })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '登录失败');
  }
  
  return response.json();
};

export const getUserProfile = async (token) => {
  const response = await fetch(`${API_BASE_URL}/user/profile.php`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('获取用户信息失败');
  }
  
  return response.json();
};

export const createGame = async (token) => {
  const response = await fetch(`${API_BASE_URL}/game/create.php`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '创建游戏失败');
  }
  
  return response.json();
};

export const joinGame = async (token, roomId) => {
  const response = await fetch(`${API_BASE_URL}/game/join.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ roomId })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '加入游戏失败');
  }
  
  return response.json();
};

// 其他API函数...
