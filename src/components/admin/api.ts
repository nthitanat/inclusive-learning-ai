import { User, Session, FinetuneData } from './types';
import { fetchWithAuth, handleApiError } from './utils';

// User CRUD operations
export const saveUser = async (userData: any, onSuccess: () => void) => {
  try {
    if (userData._id) {
      // Update user
      const updateData = { id: userData._id, ...userData };
      delete updateData._id;
      
      const response = await fetchWithAuth('/api/admin/users', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) throw new Error('Failed to update user');
    } else {
      // Create user
      const response = await fetchWithAuth('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) throw new Error('Failed to create user');
    }
    
    onSuccess();
  } catch (error: any) {
    handleApiError(error, 'saving user');
  }
};

export const deleteUser = async (userId: string, onSuccess: () => void) => {
  if (!confirm('Are you sure you want to delete this user?')) return;
  
  try {
    const response = await fetchWithAuth('/api/admin/users', {
      method: 'DELETE',
      body: JSON.stringify({ id: userId })
    });
    
    if (!response.ok) throw new Error('Failed to delete user');
    
    onSuccess();
  } catch (error: any) {
    handleApiError(error, 'deleting user');
  }
};

// Session CRUD operations
export const saveSession = async (sessionData: any, onSuccess: () => void) => {
  try {
    if (sessionData._id) {
      // Update session
      const updateData = { sessionId: sessionData._id, ...sessionData };
      delete updateData._id;
      
      const response = await fetchWithAuth('/api/admin/sessions', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) throw new Error('Failed to update session');
    } else {
      // Create session
      const response = await fetchWithAuth('/api/admin/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData)
      });
      
      if (!response.ok) throw new Error('Failed to create session');
    }
    
    onSuccess();
  } catch (error: any) {
    handleApiError(error, 'saving session');
  }
};

export const deleteSession = async (sessionId: string, onSuccess: () => void) => {
  if (!confirm('Are you sure you want to delete this session?')) return;
  
  try {
    const response = await fetchWithAuth('/api/admin/sessions', {
      method: 'DELETE',
      body: JSON.stringify({ sessionId })
    });
    
    if (!response.ok) throw new Error('Failed to delete session');
    
    onSuccess();
  } catch (error: any) {
    handleApiError(error, 'deleting session');
  }
};

// Finetune operations
export const deleteFinetuneData = async (finetuneId: string, onSuccess: () => void) => {
  if (!confirm('Are you sure you want to delete this finetune data?')) return;
  
  try {
    const response = await fetchWithAuth('/api/feedback/finetune', {
      method: 'DELETE',
      body: JSON.stringify({ id: finetuneId })
    });
    
    if (!response.ok) throw new Error('Failed to delete finetune data');
    
    onSuccess();
  } catch (error: any) {
    handleApiError(error, 'deleting finetune data');
  }
};

// Data fetching
export const fetchAllData = async () => {
  const token = localStorage.getItem('token');
  const authHeaders: Record<string, string> = {};
  if (token) authHeaders['Authorization'] = `Bearer ${token}`;
  
  const [usersRes, sessionsRes, finetuneRes] = await Promise.all([
    fetch('/api/admin/users'),
    fetch('/api/admin/sessions'),
    fetch('/api/feedback/finetune', { 
      headers: authHeaders
    })
  ]);
  
  if (!usersRes.ok || !sessionsRes.ok) {
    throw new Error('Failed to fetch basic data');
  }
  
  const usersData = await usersRes.json();
  const sessionsData = await sessionsRes.json();
  
  let finetuneResult = { data: [] };
  if (finetuneRes.ok) {
    finetuneResult = await finetuneRes.json();
  } else {
    console.warn('Fine-tuning data fetch failed');
  }
  
  return {
    users: usersData,
    sessions: sessionsData,
    finetuneData: finetuneResult.data || []
  };
};
