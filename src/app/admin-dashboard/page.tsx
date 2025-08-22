"use client"
import React, { useEffect, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

// Import separated components
import { User, Session, FinetuneData } from '../../components/admin/types';
import PortalModal from '../../components/admin/PortalModal';
import UserFormModal from '../../components/admin/UserFormModal';
import SessionFormModal from '../../components/admin/SessionFormModal';
import UsersTable from '../../components/admin/UsersTable';
import SessionsTable from '../../components/admin/SessionsTable';
import FinetuneTable from '../../components/admin/FinetuneTable';
import { 
  saveUser, 
  deleteUser, 
  saveSession, 
  deleteSession, 
  deleteFinetuneData, 
  fetchAllData 
} from '../../components/admin/api';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [finetuneData, setFinetuneData] = useState<FinetuneData[]>([]);
  
  // Portal modal state
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [portalModalTitle, setPortalModalTitle] = useState('');
  const [portalModalData, setPortalModalData] = useState<any>(null);
  
  // Form modal states
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [sessionFormOpen, setSessionFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllData();
      setUsers(data.users);
      setSessions(data.sessions);
      setFinetuneData(data.finetuneData);
    } catch (e: any) {
      console.error('Error fetching data:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler functions
  const handleUserSave = async (userData: any) => {
    await saveUser(userData, () => {
      fetchData();
      setEditingUser(null);
    });
  };

  const handleUserDelete = async (userId: string) => {
    await deleteUser(userId, fetchData);
  };

  const handleSessionSave = async (sessionData: any) => {
    await saveSession(sessionData, () => {
      fetchData();
      setEditingSession(null);
    });
  };

  const handleSessionDelete = async (sessionId: string) => {
    await deleteSession(sessionId, fetchData);
  };

  const handleFinetuneDelete = async (finetuneId: string) => {
    await deleteFinetuneData(finetuneId, fetchData);
  };

  // Modal handlers
  const handleViewTraining = (data: any, step: number) => {
    setPortalModalTitle(`Training Data - Step ${step}`);
    setPortalModalData(data);
    setPortalModalOpen(true);
  };

  const handleViewFeedback = (data: any, step: number) => {
    setPortalModalTitle(`Feedback - Step ${step}`);
    setPortalModalData(data);
    setPortalModalOpen(true);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-green-50 drop-shadow-lg">Admin Dashboard</h1>
      
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'rgba(34, 197, 94, 0.3)', 
        mb: 4,
        background: "rgba(21, 128, 61, 0.08)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(34, 197, 94, 0.18)",
        borderRadius: 2,
        p: 2,
      }}>
        <Tabs 
          value={tab} 
          onChange={(_, v) => setTab(v)}
          sx={{
            "& .MuiTab-root": {
              color: "#bbf7d0",
              "&.Mui-selected": {
                color: "#f0fdf4",
              },
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#22c55e",
            },
          }}
        >
          <Tab label="Users" />
          <Tab label="Sessions" />
          <Tab label="Fine-tuning Data" />
        </Tabs>
      </Box>
      
      {/* Users Tab */}
      {tab === 0 && (
        <UsersTable
          users={users}
          onEdit={(user) => {
            setEditingUser(user);
            setUserFormOpen(true);
          }}
          onDelete={handleUserDelete}
          onAdd={() => {
            setEditingUser(null);
            setUserFormOpen(true);
          }}
        />
      )}

      {/* Sessions Tab */}
      {tab === 1 && (
        <SessionsTable
          sessions={sessions}
          users={users}
          onEdit={(session) => {
            setEditingSession(session);
            setSessionFormOpen(true);
          }}
          onDelete={handleSessionDelete}
          onAdd={() => {
            setEditingSession(null);
            setSessionFormOpen(true);
          }}
        />
      )}

      {/* Fine-tuning Data Tab */}
      {tab === 2 && (
        <FinetuneTable
          finetuneData={finetuneData}
          onDelete={handleFinetuneDelete}
          onViewTraining={handleViewTraining}
          onViewFeedback={handleViewFeedback}
        />
      )}

      {/* Portal Modal */}
      <PortalModal
        isOpen={portalModalOpen}
        onClose={() => setPortalModalOpen(false)}
        title={portalModalTitle}
        data={portalModalData}
      />

      {/* Form Modals */}
      <UserFormModal
        open={userFormOpen}
        onClose={() => {
          setUserFormOpen(false);
          setEditingUser(null);
        }}
        onSave={handleUserSave}
        user={editingUser}
      />

      <SessionFormModal
        open={sessionFormOpen}
        onClose={() => {
          setSessionFormOpen(false);
          setEditingSession(null);
        }}
        onSave={handleSessionSave}
        session={editingSession}
        users={users}
      />
    </div>
  );
};

export default AdminDashboard;
