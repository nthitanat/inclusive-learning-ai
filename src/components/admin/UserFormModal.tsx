import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { User } from './types';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (user: any) => void;
  user?: User | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ open, onClose, onSave, user }) => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        password: ''
      });
    } else {
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        password: ''
      });
    }
  }, [user]);

  const handleSave = () => {
    onSave({ ...formData, ...(user && { _id: user._id }) });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{user ? 'Edit User' : 'Create New User'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Email"
          type="email"
          fullWidth
          variant="outlined"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <TextField
          margin="dense"
          label="First Name"
          fullWidth
          variant="outlined"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
        />
        <TextField
          margin="dense"
          label="Last Name"
          fullWidth
          variant="outlined"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
        />
        <TextField
          margin="dense"
          label={user ? 'New Password (optional)' : 'Password'}
          type="password"
          fullWidth
          variant="outlined"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {user ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserFormModal;
