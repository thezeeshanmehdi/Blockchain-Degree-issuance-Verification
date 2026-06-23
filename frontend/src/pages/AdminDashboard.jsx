import React, { useState, useEffect } from 'react';
import { api, FILE_BASE_URL } from '../services/api';
import { 
  Users, CheckCircle2, XCircle, AlertCircle, FileText, RefreshCw, Award, ShieldAlert, Check, Search, Download
} from 'lucide-react';

export const AdminDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  // Issuance / rejection actions state
  const [cgpa, setCgpa] = useState('3.5');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Metrics reporting state
  const [metrics, setMetrics] = useState({
    summary: { totalDegreesIssued: 0, totalVerificationRequests: 0, fraudAttemptsBlocked: 0 },
    performance: { averageIssuanceTimeMs: 0, averageVerificationTimeMs: 0, averageFraudDetectionTimeMs: 0 }
  });

  useEffect(() => {
    fetchApplications();
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await api.admin.getMetrics();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Error fetching reporting metrics:', err);
    }
  };

  const fetchApplications = async (selectId = null) => {
    try {
      const res = await api.admin.getApplications();
      if (res.success) {
        setApplications(res.data);
        if (selectId) {
          const updated = res.data.find(a => a._id === selectId);
          setSelectedApp(updated || null);
        } else if (res.data.length > 0 && !selectedApp) {
          setSelectedApp(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectApplication = async (app) => {
    setLoading(true);
    setActionMessage({ type: '', text: '' });
    try {
      const res = await api.admin.getApplicationById(app._id);
      if (res.success) {
        setSelectedApp(res.data);
        setRejectionReason('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReRunOCR = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    setActionMessage({ type: '', text: '' });
    try {
      const res = await api.admin.reRunOCR(selectedApp._id);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'AI OCR analysis re-run successfully.' });
        fetchApplications(selectedApp._id);
      } else {
        setActionMessage({ type: 'error', text: res.message || 'OCR extraction failed.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'OCR processing error.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    if (!cgpa || isNaN(Number(cgpa)) || Number(cgpa) < 0 || Number(cgpa) > 4.0) {
      setActionMessage({ type: 'error', text: 'Please enter a valid CGPA between 0.0 and 4.0' });
      return;
    }
    setActionLoading(true);
    setActionMessage({ type: '', text: '' });
    try {
      const res = await api.admin.approve(selectedApp._id, Number(cgpa));
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Degree successfully compiled, secured on Private Ledger and Hash published on Public Blockchain!' });
        fetchApplications(selectedApp._id);
        fetchMetrics();
      } else {
        setActionMessage({ type: 'error', text: res.message || 'Approval process failed.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Approval error.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    if (!rejectionReason.trim()) {
      setActionMessage({ type: 'error', text: 'Please provide a reason for rejecting the application.' });
      return;
    }
    setActionLoading(true);
    setActionMessage({ type: '', text: '' });
    try {
      const res = await api.admin.reject(selectedApp._id, rejectionReason);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'Application rejected.' });
        setRejectionReason('');
        fetchApplications(selectedApp._id);
        fetchMetrics();
      } else {
        setActionMessage({ type: 'error', text: res.message || 'Rejection failed.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Rejection error.' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredApps = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const getDocUrl = (relativePath) => {
    return `${FILE_BASE_URL}${relativePath}`;
  };

  return (
    <div className="content-container" style={{ maxWidth: '1440px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Registrar Admin Dashboard</h1>
        <p style={{ color: '#9ca3af' }}>Audit student credentials, examine AI OCR analysis, verify receipts, and register degrees to blockchain.</p>
      </div>

      {/* Statistics Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '20px', 
        marginBottom: '32px' 
      }}>
        {/* Metric 1 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
            <Award size={28} />
          </div>
          <div>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Degrees Issued</p>
            <h3 style={{ fontSize: '1.8rem', margin: '4px 0 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {metrics.summary?.totalDegreesIssued || 0}
            </h3>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verification Queries</p>
            <h3 style={{ fontSize: '1.8rem', margin: '4px 0 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {metrics.summary?.totalVerificationRequests || 0}
            </h3>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <ShieldAlert size={28} />
          </div>
          <div>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fraud Blocked</p>
            <h3 style={{ fontSize: '1.8rem', margin: '4px 0 0', fontWeight: 'bold', color: '#ef4444' }}>
              {metrics.summary?.fraudAttemptsBlocked || 0}
            </h3>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <RefreshCw size={28} />
          </div>
          <div>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Transaction Latency</p>
            <h4 style={{ fontSize: '0.9rem', margin: '4px 0 0', color: 'var(--text-primary)', lineHeight: '1.4' }}>
              Attest: <strong style={{ color: '#6366f1' }}>{metrics.performance?.averageIssuanceTimeMs || 0}ms</strong><br/>
              Verify: <strong style={{ color: '#10b981' }}>{metrics.performance?.averageVerificationTimeMs || 0}ms</strong>
            </h4>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Left Side: Queue List */}
        <div className="glass-panel" style={{ flex: '1 1 350px', padding: '24px', minHeight: '600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="#6366f1" /> Application Queue
            </h2>
            <select 
              className="form-select" 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto', margin: 0 }}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {loading && applications.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div className="spinner"></div>
            </div>
          ) : filteredApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: '#9ca3af' }}>
              <p>No applications match this filter.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '600px' }}>
              {filteredApps.map(app => (
                <div 
                  key={app._id}
                  onClick={() => handleSelectApplication(app)}
                  className="glass-card"
                  style={{ 
                    padding: '16px', 
                    cursor: 'pointer',
                    borderColor: selectedApp?._id === app._id ? '#6366f1' : 'rgba(255, 255, 255, 0.05)',
                    backgroundColor: selectedApp?._id === app._id ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{app.fullName}</h4>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '2px 8px', 
                      borderRadius: '999px',
                      backgroundColor: app.status === 'approved' ? 'rgba(16,185,129,0.1)' : app.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      color: app.status === 'approved' ? '#10b981' : app.status === 'rejected' ? '#ef4444' : '#f59e0b',
                    }}>
                      {app.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '4px' }}>{app.program}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280' }}>
                    <span>Roll: {app.rollNumber}</span>
                    <span>{new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Detailed Audit Panel */}
        <div className="glass-panel" style={{ flex: '2 1 600px', padding: '32px', minHeight: '600px' }}>
          {selectedApp ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              
              {/* Header Details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{selectedApp.fullName}</h2>
                  <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                    Student Email: <strong style={{ color: '#6366f1' }}>{selectedApp.student?.email || 'N/A'}</strong>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Roll Number: <strong>{selectedApp.rollNumber}</strong></p>
                  <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px' }}>Program: <strong>{selectedApp.program}</strong></p>
                </div>
              </div>

              {/* Status Message */}
              {actionMessage.text && (
                <div className={actionMessage.type === 'success' ? 'alert-success' : 'alert-danger'}>
                  {actionMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                  <span>{actionMessage.text}</span>
                </div>
              )}

              {/* Audit Files Grid */}
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Uploaded Documents</h3>
                <div className="grid-3" style={{ gap: '12px' }}>
                  {Object.entries(selectedApp.documents).map(([key, value]) => (
                    <a 
                      key={key} 
                      href={getDocUrl(value)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="glass-card"
                      style={{ 
                        padding: '12px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '8px',
                        textDecoration: 'none',
                        color: '#9ca3af',
                        fontSize: '0.8rem',
                        textAlign: 'center'
                      }}
                    >
                      <FileText size={28} color="#6366f1" />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Click to view</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* OCR Agent & Policy Verification */}
              <div className="glass-card" style={{ borderColor: 'rgba(99, 102, 241, 0.15)', background: 'rgba(99, 102, 241, 0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={18} color="#6366f1" /> AI OCR Agent Auditing
                  </h3>
                  <button 
                    onClick={handleReRunOCR}
                    disabled={actionLoading}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '4px' }}
                  >
                    <RefreshCw size={12} className={actionLoading ? 'spinner' : ''} /> Re-run AI Agent
                  </button>
                </div>

                {/* Audit Flags */}
                <div className="grid-2" style={{ gap: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#9ca3af', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>System Policy Check Flags</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>CNIC Valid (Not Expired):</span>
                        {selectedApp.verificationFlags?.cnicValid ? 
                          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14} /> Passed</span> : 
                          <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={14} /> Failed</span>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>Matric Grade Flag (Min 50%):</span>
                        {selectedApp.verificationFlags?.matricValid ? 
                          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14} /> Passed</span> : 
                          <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={14} /> Failed</span>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>Intermediate Grade Flag (Min 50%):</span>
                        {selectedApp.verificationFlags?.interValid ? 
                          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14} /> Passed</span> : 
                          <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={14} /> Failed</span>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>Payment Verification match:</span>
                        {selectedApp.verificationFlags?.paymentValid ? 
                          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14} /> Passed</span> : 
                          <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><XCircle size={14} /> Failed</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#9ca3af', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>OCR Extracted Data Values</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                      <p>CNIC Expiry Date: <strong style={{ color: 'var(--text-primary)' }}>{selectedApp.ocrData?.cnicExpiry ? new Date(selectedApp.ocrData.cnicExpiry).toLocaleDateString() : 'N/A'}</strong></p>
                      <p>Matric Percentage: <strong style={{ color: 'var(--text-primary)' }}>{selectedApp.ocrData?.matricPercentage ? `${selectedApp.ocrData.matricPercentage}%` : 'N/A'}</strong></p>
                      <p>Intermediate Percentage: <strong style={{ color: 'var(--text-primary)' }}>{selectedApp.ocrData?.interPercentage ? `${selectedApp.ocrData.interPercentage}%` : 'N/A'}</strong></p>
                      <p>Receipt Tx ID: <strong style={{ color: 'var(--text-primary)' }}>{selectedApp.ocrData?.paymentTransactionId || 'N/A'}</strong></p>
                      <p>Receipt Amount: <strong style={{ color: 'var(--text-primary)' }}>{selectedApp.ocrData?.paymentAmount ? `${selectedApp.ocrData.paymentAmount} PKR` : 'N/A'}</strong></p>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', fontSize: '0.85rem', color: '#9ca3af' }}>
                  <strong>Policy Check Summary: </strong>
                  {selectedApp.verificationFlags?.policyPassed ? (
                    <span style={{ color: '#10b981', fontWeight: 600 }}>All requirements passed. Ready to issue degree.</span>
                  ) : (
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>Policy Rejections: {selectedApp.verificationFlags?.rejectionReason || 'Checks not verified.'}</span>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              {selectedApp.status === 'approved' ? (
                <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: 'rgba(16, 185, 129, 0.02)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981' }}>
                    <Award size={24} />
                    <strong style={{ fontSize: '1.1rem' }}>Degree Issued to Blockchain</strong>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>The student degree has been successfully secured on private/public ledger networks.</p>
                  
                  {/* Fetch corresponding degree details if needed or direct pdf */}
                  <a 
                    href={selectedApp.pdfUrl ? `${FILE_BASE_URL}${selectedApp.pdfUrl}` : '#'}
                    className="btn btn-success" 
                    style={{ alignSelf: 'flex-start', fontSize: '0.85rem', padding: '8px 16px', gap: '6px', textDecoration: 'none' }}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download size={14} /> Open Verified PDF Certificate
                  </a>
                </div>
              ) : selectedApp.status === 'rejected' ? (
                <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.02)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ShieldAlert size={24} color="#ef4444" />
                  <div>
                    <strong style={{ fontSize: '1.1rem', color: '#ef4444' }}>Application Rejected</strong>
                    <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px' }}>
                      Reason: {selectedApp.verificationFlags?.rejectionReason || 'No reason provided.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid-2" style={{ gap: '24px' }}>
                  {/* Approve/Issue */}
                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Approve & Issue Certificate</h4>
                    <div className="form-group">
                      <label className="form-label">Graduate Final CGPA</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={cgpa} 
                        onChange={(e) => setCgpa(e.target.value)} 
                        placeholder="e.g. 3.75"
                        style={{ padding: '8px 12px' }}
                      />
                    </div>
                    <button 
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="btn btn-success"
                      style={{ fontSize: '0.9rem', width: '100%' }}
                    >
                      {actionLoading ? 'Compiling Ledgers...' : 'Approve & Issue Degree'}
                    </button>
                  </div>

                  {/* Reject */}
                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Reject Request</h4>
                    <div className="form-group">
                      <label className="form-label">Reason for Rejection</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={rejectionReason} 
                        onChange={(e) => setRejectionReason(e.target.value)} 
                        placeholder="Incomplete files, low grades, etc."
                        style={{ padding: '8px 12px' }}
                      />
                    </div>
                    <button 
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="btn btn-danger"
                      style={{ fontSize: '0.9rem', width: '100%' }}
                    >
                      Reject Application
                    </button>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af', gap: '12px' }}>
              <FileText size={48} style={{ opacity: 0.3 }} />
              <p>Select an application request from the queue to start auditing.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
