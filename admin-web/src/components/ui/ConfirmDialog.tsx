import { createPortal } from 'react-dom';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
};

export function ConfirmDialog({
  isOpen, title, description, confirmText = 'Confirm', cancelText = 'Cancel',
  onConfirm, onCancel, isDestructive = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200,
    }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', animationDuration: '0.2s' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>{title}</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>{description}</p>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={onCancel}>{cancelText}</button>
          <button className={`btn ${isDestructive ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
