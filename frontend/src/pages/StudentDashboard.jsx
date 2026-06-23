import React, { useState, useEffect, useRef } from 'react';
import { api, FILE_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, History, UploadCloud, CheckCircle2, Clock, XCircle, AlertCircle, FileCheck, Landmark, ShieldCheck 
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [fullName, setFullName] = useState(user?.name || '');
  const [rollNumber, setRollNumber] = useState('');
  const [program, setProgram] = useState('Bachelor of Computer Science');
  const [dob, setDob] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Crypto');
  const [transactionId, setTransactionId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  
  // File state
  const [files, setFiles] = useState({
    cnicFront: null,
    cnicBack: null,
    matricMarksheet: null,
    interMarksheet: null,
    paymentReceipt: null
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputs = useRef({});

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.applications.getMy();
      if (res.success) {
        setApplications(res.data);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [fieldName]: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Form validations
    if (!fullName || !rollNumber || !dob || !contactNumber || !transactionId || !amountPaid) {
      setFormError('All input details are required.');
      return;
    }

    // File validations
    if (!files.cnicFront || !files.cnicBack || !files.matricMarksheet || !files.interMarksheet || !files.paymentReceipt) {
      setFormError('All 5 required documents must be uploaded.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('rollNumber', rollNumber);
      formData.append('program', program);
      formData.append('dob', dob);
      formData.append('contactNumber', contactNumber);
      formData.append('paymentMethod', paymentMethod);
      formData.append('transactionId', transactionId);
      formData.append('amountPaid', amountPaid);
      
      formData.append('cnicFront', files.cnicFront);
      formData.append('cnicBack', files.cnicBack);
      formData.append('matricMarksheet', files.matricMarksheet);
      formData.append('interMarksheet', files.interMarksheet);
      formData.append('paymentReceipt', files.paymentReceipt);

      const res = await api.applications.submit(formData);
      
      if (res.success) {
        setFormSuccess('Application request submitted successfully! AI OCR checking has been triggered in the background.');
        // Reset form inputs
        setRollNumber('');
        setDob('');
        setContactNumber('');
        setTransactionId('');
        setAmountPaid('');
        setFiles({
          cnicFront: null,
          cnicBack: null,
          matricMarksheet: null,
          interMarksheet: null,
          paymentReceipt: null
        });
        // Reset file inputs values
        Object.values(fileInputs.current).forEach(input => {
          if (input) input.value = '';
        });

        // Refresh list
        fetchApplications();
      } else {
        setFormError(res.message || 'Submission failed.');
      }
    } catch (err) {
      setFormError('Submission failed. Please check network connectivity.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-approved"><CheckCircle2 size={12} style={{ marginRight: '4px' }} /> Approved</span>;
      case 'rejected':
        return <span className="badge badge-rejected"><XCircle size={12} style={{ marginRight: '4px' }} /> Rejected</span>;
      case 'processing':
        return <span className="badge badge-processing"><Clock size={12} style={{ marginRight: '4px' }} /> Analyzing OCR</span>;
      default:
        return <span className="badge badge-pending"><Clock size={12} style={{ marginRight: '4px' }} /> Pending Audit</span>;
    }
  };

  return (
    <div className="content-container">
      <div style={{ marginBottom: '32px' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Student Dashboard</h1>
        <p style={{ color: '#9ca3af' }}>Manage your applications, check OCR status, and access blockchain verified degrees.</p>
      </div>

      <div className="grid-2">
        {/* Application Form */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText color="#6366f1" /> Request Digital Degree
          </h2>

          {formError && (
            <div className="alert-danger" style={{ marginBottom: '20px' }}>
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="alert-success" style={{ marginBottom: '20px' }}>
              <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
              <span>{formSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required 
              />
            </div>

            <div className="grid-2" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. IU-2022-9989" 
                  value={rollNumber} 
                  onChange={(e) => setRollNumber(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={dob} 
                  onChange={(e) => setDob(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="grid-2" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Program</label>
                <select 
                  className="form-select" 
                  value={program} 
                  onChange={(e) => setProgram(e.target.value)}
                >
                  <option>Bachelor of Computer Science</option>
                  <option>Bachelor of Business Administration</option>
                  <option>Master of Business Administration</option>
                  <option>BS Software Engineering</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Contact Number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 0300-1234567" 
                  value={contactNumber} 
                  onChange={(e) => setContactNumber(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '8px 0' }} />
            
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>Document Uploads (CNIC & Academic Records)</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">CNIC Front Image</label>
                <div className="file-upload-zone" style={{ padding: '12px' }}>
                  <UploadCloud size={20} color="#9ca3af" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                    {files.cnicFront ? files.cnicFront.name : 'Select CNIC Front (expiry date must be visible)'}
                  </span>
                  <input 
                    ref={el => fileInputs.current.cnicFront = el}
                    type="file" 
                    className="file-upload-input" 
                    onChange={(e) => handleFileChange(e, 'cnicFront')} 
                    accept="image/*,.pdf"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">CNIC Back Image</label>
                <div className="file-upload-zone" style={{ padding: '12px' }}>
                  <UploadCloud size={20} color="#9ca3af" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                    {files.cnicBack ? files.cnicBack.name : 'Select CNIC Back'}
                  </span>
                  <input 
                    ref={el => fileInputs.current.cnicBack = el}
                    type="file" 
                    className="file-upload-input" 
                    onChange={(e) => handleFileChange(e, 'cnicBack')} 
                    accept="image/*,.pdf"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Matriculation Marksheet (Min 50% Required)</label>
                <div className="file-upload-zone" style={{ padding: '12px' }}>
                  <UploadCloud size={20} color="#9ca3af" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                    {files.matricMarksheet ? files.matricMarksheet.name : 'Select Matriculation Marksheet'}
                  </span>
                  <input 
                    ref={el => fileInputs.current.matricMarksheet = el}
                    type="file" 
                    className="file-upload-input" 
                    onChange={(e) => handleFileChange(e, 'matricMarksheet')} 
                    accept="image/*,.pdf"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Intermediate Marksheet (Min 50% Required)</label>
                <div className="file-upload-zone" style={{ padding: '12px' }}>
                  <UploadCloud size={20} color="#9ca3af" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                    {files.interMarksheet ? files.interMarksheet.name : 'Select Intermediate Marksheet'}
                  </span>
                  <input 
                    ref={el => fileInputs.current.interMarksheet = el}
                    type="file" 
                    className="file-upload-input" 
                    onChange={(e) => handleFileChange(e, 'interMarksheet')} 
                    accept="image/*,.pdf"
                  />
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '8px 0' }} />
            
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Landmark size={18} color="#f59e0b" /> Payment Verification
            </h3>

            <div className="grid-3" style={{ gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Method</label>
                <select 
                  className="form-select" 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option>Crypto</option>
                  <option>1Link</option>
                  <option>Visa</option>
                  <option>Mastercard</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Transaction ID / Hash</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. TXN1029384756" 
                  value={transactionId} 
                  onChange={(e) => setTransactionId(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="grid-2" style={{ gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Amount Paid (PKR/USDT Equivalent)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 5000" 
                  value={amountPaid} 
                  onChange={(e) => setAmountPaid(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Receipt Screenshot</label>
                <div className="file-upload-zone" style={{ padding: '12px' }}>
                  <UploadCloud size={20} color="#9ca3af" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                  <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>
                    {files.paymentReceipt ? files.paymentReceipt.name : 'Select Receipt Image'}
                  </span>
                  <input 
                    ref={el => fileInputs.current.paymentReceipt = el}
                    type="file" 
                    className="file-upload-input" 
                    onChange={(e) => handleFileChange(e, 'paymentReceipt')} 
                    accept="image/*,.pdf"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={submitting}
              style={{ width: '100%', marginTop: '16px' }}
            >
              {submitting ? 'Submitting Application...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* Submission History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History color="#f59e0b" /> Application Status Log
            </h2>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <div className="spinner"></div>
              </div>
            ) : applications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                <FileCheck size={40} style={{ opacity: 0.5, marginBottom: '12px' }} />
                <p>You have not submitted any degree issuance requests yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {applications.map((app) => (
                  <div key={app._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{app.program}</h4>
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Submitted on: {new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                      {getStatusBadge(app.status)}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <p><strong>Roll Number:</strong> {app.rollNumber}</p>
                      <p><strong>Payment Tx ID:</strong> {app.paymentDetails.transactionId} ({app.paymentDetails.amountPaid} PKR)</p>
                      {app.verificationFlags && app.status !== 'approved' && app.status !== 'rejected' && (
                        <p style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6366f1' }}>
                          <ShieldCheck size={14} /> AI OCR verification completed. Waiting for Admin signature.
                        </p>
                      )}
                    </div>

                    {app.status === 'rejected' && app.verificationFlags?.rejectionReason && (
                      <div className="alert-danger" style={{ padding: '10px 14px', fontSize: '0.85rem' }}>
                        <strong>Rejection Reason:</strong> {app.verificationFlags.rejectionReason}
                      </div>
                    )}

                    {app.status === 'approved' && (
                      <div style={{ marginTop: '8px' }}>
                        <a 
                          href={app.pdfUrl ? `${FILE_BASE_URL}${app.pdfUrl}` : '#'}
                          className="btn btn-success" 
                          style={{ fontSize: '0.85rem', padding: '8px 16px', textDecoration: 'none' }}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Download Verified Degree PDF
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
