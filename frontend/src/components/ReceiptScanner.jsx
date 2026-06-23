import React, { useState } from 'react';
import { Camera, RefreshCw, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function ReceiptScanner({ token, onRefresh }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanSteps, setScanSteps] = useState([]);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setScanResult(null);
    setError('');
  };

  const startScan = async () => {
    if (!selectedFile) return;

    setScanning(true);
    setError('');
    
    // Simulate OCR steps for high visual fidelity
    const steps = [
      'Initializing connection to database storage...',
      'Uploading receipt photo (interacting with Supabase storage)...',
      'Executing AI OCR receipt scanning algorithm...',
      'Extracting merchant, category, date, and final totals...'
    ];

    setScanSteps([]);
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setScanSteps(prev => [...prev, steps[i]]);
    }

    // Now send the actual request to backend
    const formData = new FormData();
    formData.append('receipt', selectedFile);

    try {
      const response = await fetch('/api/expenses/scan', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to scan receipt');
      }

      setScanResult(data.expense);
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setScanSteps([]);
    setError('');
  };

  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <Camera style={{ color: 'var(--primary)' }} />
        <h2 style={{ margin: 0 }}>Log Cash Expense via Photo Scan</h2>
      </div>

      <p style={{ marginBottom: '20px' }}>Upload a photo of a recent or old receipt. Our built-in assistant parses merchant names, item costs, and records transaction logs automatically.</p>

      {error && (
        <div className="alert-banner" style={{ marginBottom: '20px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Zone / Screen View */}
      {!previewUrl && (
        <div style={{
          border: '2px dashed var(--border-glass)',
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.01)',
          position: 'relative',
          transition: 'var(--transition-smooth)'
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
          }
        }}>
          <input 
            type="file" 
            accept="image/*" 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
            onChange={handleFileChange}
          />
          <Camera size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h4 style={{ marginBottom: '8px' }}>Drag & Drop Receipt Photo Here</h4>
          <p style={{ fontSize: '0.9rem' }}>or click to browse local files (Supports JPEG, PNG)</p>
        </div>
      )}

      {/* Preview / Scanning Animation */}
      {previewUrl && !scanResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-glass)', maxHeight: '350px', background: '#000', display: 'flex', justifyContent: 'center' }}>
            <img src={previewUrl} alt="Receipt Preview" style={{ maxHeight: '350px', width: 'auto', objectFit: 'contain', opacity: scanning ? 0.7 : 1 }} />
            {scanning && <div className="scanner-overlay" />}
          </div>

          {/* Stepper Status Logs */}
          {scanning && (
            <div style={{ padding: '16px', background: 'rgba(15,23,42,0.6)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <RefreshCw className="pulsing-dot" size={16} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--primary)' }} />
                <strong style={{ fontSize: '0.9rem' }}>Running Intelligent OCR...</strong>
              </div>
              <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                {scanSteps.map((step, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!scanning && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-primary" onClick={startScan} style={{ flex: 1 }}>
                <Sparkles size={16} /> Process Receipt Photo
              </button>
              <button className="btn-secondary" onClick={handleReset}>
                Cancel
              </button>
            </div>
          )}

        </div>
      )}

      {/* Scan Results View */}
      {scanResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ 
            padding: '20px', 
            background: 'rgba(16, 185, 129, 0.08)', 
            border: '1px solid rgba(16, 185, 129, 0.2)', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px'
          }}>
            <CheckCircle2 size={24} style={{ color: 'var(--success)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <h4 style={{ color: '#34d399', marginBottom: '4px' }}>Receipt Processed Successfully!</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>AI extracted expense details and saved this transaction into your MySQL account ledger.</p>
            </div>
          </div>

          <div style={{ padding: '20px', background: 'rgba(15,23,42,0.4)', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Merchant / Description</span>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={16} /> {scanResult.description}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Extracted Total Cost</span>
              <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>${parseFloat(scanResult.amount).toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Category</span>
              <span className="badge badge-success">{scanResult.category}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Date of Receipt</span>
              <span>{scanResult.date}</span>
            </div>
          </div>

          <button className="btn-secondary" onClick={handleReset} style={{ width: '100%' }}>
            Scan Another Receipt
          </button>

        </div>
      )}

    </div>
  );
}
