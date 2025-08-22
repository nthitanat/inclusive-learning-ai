import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { Session, User } from './types';

interface SessionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (session: any) => void;
  session?: Session | null;
  users: User[];
}

const SessionFormModal: React.FC<SessionFormModalProps> = ({ open, onClose, onSave, session, users }) => {
  const [formData, setFormData] = useState({
    userId: '',
    subject: '',
    lessonTopic: '',
    level: '',
    configStep: 1
  });

  useEffect(() => {
    if (session) {
      setFormData({
        userId: session.userId || '',
        subject: session.subject || '',
        lessonTopic: session.lessonTopic || '',
        level: session.level || '',
        configStep: session.configStep || 1
      });
    } else {
      setFormData({
        userId: '',
        subject: '',
        lessonTopic: '',
        level: '',
        configStep: 1
      });
    }
  }, [session]);

  const handleSave = () => {
    onSave({ ...formData, ...(session && { _id: session._id }) });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{session ? 'Edit Session' : 'Create New Session'}</DialogTitle>
      <DialogContent>
        <TextField
          select
          margin="dense"
          label="User"
          fullWidth
          variant="outlined"
          value={formData.userId}
          onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
          SelectProps={{
            native: true,
          }}
        >
          <option value="">Select User</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.firstName} {user.lastName} ({user.email})
            </option>
          ))}
        </TextField>
        <TextField
          margin="dense"
          label="Subject"
          fullWidth
          variant="outlined"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
        />
        <TextField
          margin="dense"
          label="Lesson Topic"
          fullWidth
          variant="outlined"
          value={formData.lessonTopic}
          onChange={(e) => setFormData({ ...formData, lessonTopic: e.target.value })}
        />
        <TextField
          margin="dense"
          label="Level"
          fullWidth
          variant="outlined"
          value={formData.level}
          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
        />
        <TextField
          margin="dense"
          label="Config Step"
          type="number"
          fullWidth
          variant="outlined"
          value={formData.configStep}
          onChange={(e) => setFormData({ ...formData, configStep: parseInt(e.target.value) })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {session ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionFormModal;
