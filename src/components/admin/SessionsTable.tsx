import React from 'react';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { Session, User } from './types';

interface SessionsTableProps {
  sessions: Session[];
  users: User[];
  onEdit: (session: Session) => void;
  onDelete: (sessionId: string) => void;
  onAdd: () => void;
}

const SessionsTable: React.FC<SessionsTableProps> = ({ sessions, users, onEdit, onDelete, onAdd }) => {
  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-green-100">Sessions ({sessions.length})</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAdd}
          sx={{
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            '&:hover': { background: 'linear-gradient(135deg, #16a34a, #15803d)' }
          }}
        >
          Add Session
        </Button>
      </div>
      <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Actions</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Topic</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Step</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sessions.slice(0, 50).map(session => {
              const user = users.find(u => u._id === session.userId);
              return (
                <TableRow key={session._id}>
                  <TableCell>
                    <IconButton 
                      size="small"
                      onClick={() => onEdit(session)}
                      sx={{ color: '#22c55e', mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small"
                      onClick={() => onDelete(session._id)}
                      sx={{ color: '#ef4444' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                  <TableCell>{session._id}</TableCell>
                  <TableCell>
                    {user ? `${user.firstName} ${user.lastName}` : session.userEmail || 'Unknown'}
                    <br />
                    <small style={{ color: '#666' }}>{user?.email || session.userEmail}</small>
                  </TableCell>
                  <TableCell>{session.subject || '-'}</TableCell>
                  <TableCell>{session.lessonTopic || '-'}</TableCell>
                  <TableCell>{session.level || '-'}</TableCell>
                  <TableCell>{session.configStep || '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </section>
  );
};

export default SessionsTable;
