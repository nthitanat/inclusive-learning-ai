import React from 'react';
import { createPortal } from 'react-dom';
import JsonDynamicResponse from '../JsonDynamicRenderer';

interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
}

const PortalModal: React.FC<PortalModalProps> = ({ isOpen, onClose, title, data }) => {
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

export default PortalModal;
