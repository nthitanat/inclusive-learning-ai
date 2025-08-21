"use client"
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import JsonDynamicResponse from '../../components/JsonDynamicRenderer';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

interface User {
  id: string;
  name: string;
  email: string;
  _id?: string;
  [key: string]: any;
}

interface Session {
  [key: string]: any;
}

// Portal Modal Component
const PortalModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  data: any; 
}> = ({ isOpen, onClose, title, data }) => {
  if (!isOpen) return null;

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '2px solid #22c55e',
          color: 'black',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #22c55e',
          paddingBottom: '12px'
        }}>
          <h2 style={{ 
            color: '#22c55e', 
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            {title}
          </h2>
          <button 
            onClick={onClose}
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>
        
        <div style={{ 
          marginBottom: '20px', 
          maxHeight: '70vh', 
          overflow: 'auto',
          backgroundColor: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <JsonDynamicResponse data={data} />
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <button 
            onClick={onClose}
            style={{
              backgroundColor: '#22c55e',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
};

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [finetuneData, setFinetuneData] = useState<any[]>([]);
  
  // Portal modal state
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [portalModalTitle, setPortalModalTitle] = useState('');
  const [portalModalData, setPortalModalData] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
        
        const [usersRes, sessionsRes, finetuneRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/sessions'),
          fetch('/api/feedback/finetune', { 
            headers: authHeaders as HeadersInit 
          })
        ]);
        
        if (!usersRes.ok || !sessionsRes.ok) throw new Error('Failed to fetch basic data');
        
        setUsers(await usersRes.json());
        setSessions(await sessionsRes.json());
        
        if (finetuneRes.ok) {
          const finetuneResult = await finetuneRes.json();
          setFinetuneData(finetuneResult.data || []);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2 text-green-100">Users ({users.length})</h2>
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user._id || user.id}>
                    <TableCell>{user._id || user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </section>
      )}

      {/* Sessions Tab */}
      {tab === 1 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2 text-green-100">Sessions ({sessions.length})</h2>
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Topic</TableCell>
                  <TableCell>Level</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.slice(0, 20).map(session => (
                  <TableRow key={session._id || session.id}>
                    <TableCell>{session._id || session.id}</TableCell>
                    <TableCell>{session.subject || '-'}</TableCell>
                    <TableCell>{session.lessonTopic || '-'}</TableCell>
                    <TableCell>{session.level || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </section>
      )}

      {/* Fine-tuning Data Tab */}
      {tab === 2 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-2 text-green-100">Fine-tuning Feedback Data</h2>
          
          {finetuneData.length === 0 ? (
            <div className="p-8 bg-gray-800 rounded-lg text-center">
              <p className="text-lg text-green-100 mb-2">No fine-tuning data available yet</p>
              <p className="text-sm text-green-300">Data will appear here after users provide feedback on Step 2 (Lesson Plans) or Step 3 (Evaluations)</p>
            </div>
          ) : (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-green-100">Total Records</h3>
                  <p className="text-2xl font-bold text-green-300">{finetuneData.length}</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-green-100">Step 2 (Lesson Plans)</h3>
                  <p className="text-2xl font-bold text-blue-300">
                    {finetuneData.filter(d => d.step === 2).length}
                  </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-green-100">Step 3 (Evaluations)</h3>
                  <p className="text-2xl font-bold text-purple-300">
                    {finetuneData.filter(d => d.step === 3).length}
                  </p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-green-100">High Quality (≥4.0)</h3>
                  <p className="text-2xl font-bold text-yellow-300">
                    {finetuneData.filter(d => d.feedback?.overallScore >= 4.0).length}
                  </p>
                </div>
              </div>

              {/* Data Table */}
              <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Actions</TableCell>
                      <TableCell>Step</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Topic</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {finetuneData.map((data) => (
                      <TableRow key={data._id}>
                        <TableCell>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => {
                                setPortalModalTitle(`Training Data - Step ${data.step}`);
                                setPortalModalData(data.finetuningFormat || data);
                                setPortalModalOpen(true);
                              }}
                              sx={{ 
                                color: '#bbf7d0',
                                borderColor: 'rgba(34, 197, 94, 0.5)',
                                '&:hover': { borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)' }
                              }}
                            >
                              Training Data
                            </Button>
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => {
                                setPortalModalTitle(`Feedback - Step ${data.step}`);
                                setPortalModalData(data.feedback || data);
                                setPortalModalOpen(true);
                              }}
                              sx={{ 
                                color: '#fbbf24',
                                borderColor: 'rgba(251, 191, 36, 0.5)',
                                '&:hover': { borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)' }
                              }}
                            >
                              Feedback
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>Step {data.step}</TableCell>
                        <TableCell>{data.inputData?.subject || '-'}</TableCell>
                        <TableCell>{data.inputData?.lessonTopic || '-'}</TableCell>
                        <TableCell>{data.feedback?.overallScore?.toFixed(1) || '-'}/5.0</TableCell>
                        <TableCell>
                          {data.timestamp ? new Date(data.timestamp).toLocaleDateString() : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Export Button */}
              <div className="mt-4">
                <Button 
                  variant="contained"
                  onClick={() => {
                    const highQualityData = finetuneData
                      .filter(d => d.feedback?.overallScore >= 3.5)
                      .map(d => d.finetuningFormat);
                    
                    const dataStr = highQualityData
                      .map(item => JSON.stringify(item))
                      .join('\n');
                    
                    const blob = new Blob([dataStr], { type: 'application/jsonl' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `finetune-data-${new Date().toISOString().split('T')[0]}.jsonl`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  sx={{ 
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: 'white',
                    '&:hover': { 
                      background: 'linear-gradient(135deg, #16a34a, #15803d)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(34, 197, 94, 0.4)'
                    }
                  }}
                >
                  📥 Export High-Quality Training Data (.jsonl)
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      {/* Portal Modal */}
      <PortalModal
        isOpen={portalModalOpen}
        onClose={() => setPortalModalOpen(false)}
        title={portalModalTitle}
        data={portalModalData}
      />
    </div>
  );
};

export default AdminDashboard;
