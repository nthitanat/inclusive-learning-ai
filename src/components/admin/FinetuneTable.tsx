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
import { FinetuneData } from './types';

interface FinetuneTableProps {
  finetuneData: FinetuneData[];
  onDelete: (finetuneId: string) => void;
  onViewTraining: (data: any, step: number) => void;
  onViewFeedback: (data: any, step: number) => void;
}

const FinetuneTable: React.FC<FinetuneTableProps> = ({ 
  finetuneData, 
  onDelete, 
  onViewTraining, 
  onViewFeedback 
}) => {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-2 text-green-100">Fine-tuning Feedback Data</h2>
      
      {finetuneData.length === 0 ? (
        <div className="p-8 bg-gray-800 rounded-lg text-center">
          <p className="text-lg text-green-100 mb-2">No fine-tuning data available yet</p>
          <p className="text-sm text-green-300">
            Data will appear here after users provide feedback on Step 2 (Lesson Plans) or Step 3 (Evaluations)
          </p>
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
                {finetuneData.filter(d => d.feedback?.overallScore && d.feedback.overallScore >= 4.0).length}
              </p>
            </div>
          </div>

          {/* Data Table */}
          <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Actions</TableCell>
                  <TableCell>User</TableCell>
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
                      <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => onViewTraining(data.finetuningFormat || data, data.step)}
                            sx={{ 
                              color: '#bbf7d0',
                              borderColor: 'rgba(34, 197, 94, 0.5)',
                              '&:hover': { borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)' },
                              fontSize: '10px',
                              minWidth: '60px'
                            }}
                          >
                            Training
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => onViewFeedback(data.feedback || data, data.step)}
                            sx={{ 
                              color: '#fbbf24',
                              borderColor: 'rgba(251, 191, 36, 0.5)',
                              '&:hover': { borderColor: '#fbbf24', backgroundColor: 'rgba(251, 191, 36, 0.1)' },
                              fontSize: '10px',
                              minWidth: '60px'
                            }}
                          >
                            Feedback
                          </Button>
                        </div>
                        <IconButton 
                          size="small"
                          onClick={() => onDelete(data._id)}
                          sx={{ color: '#ef4444', alignSelf: 'center' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </div>
                    </TableCell>
                    <TableCell>
                      {data.userInfo ? (
                        <div>
                          {data.userInfo.firstName} {data.userInfo.lastName}
                          <br />
                          <small style={{ color: '#666' }}>{data.userInfo.email}</small>
                        </div>
                      ) : (
                        <small style={{ color: '#666' }}>Unknown User</small>
                      )}
                    </TableCell>
                    <TableCell>Step {data.step}</TableCell>
                    <TableCell>{data.inputData?.subject || '-'}</TableCell>
                    <TableCell>{data.inputData?.lessonTopic || '-'}</TableCell>
                    <TableCell>
                      {data.feedback?.overallScore?.toFixed(1) || '-'}/5.0
                    </TableCell>
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
                  .filter(d => d.feedback?.overallScore && d.feedback.overallScore >= 3.5)
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
  );
};

export default FinetuneTable;
