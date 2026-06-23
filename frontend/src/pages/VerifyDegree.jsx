import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api, FILE_BASE_URL } from '../services/api';
import { 
  ShieldCheck, ShieldAlert, Award, FileText, Download, Calendar, Cpu, Hash, CheckCircle, Database 
} from 'lucide-react';

export const VerifyDegree = () => {
  const { hash } = useParams();
  const [loading, setLoading] = useState(true);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hash) {
      performVerification();
    } else {
      setLoading(false);
      setError('No cryptographic degree hash was specified in the URL.');
    }
  }, [hash]);

  const performVerification = async () => {
    try {
      const res = await api.verification.verify(hash);
      if (res.success && res.verified) {
        setVerificationResult(res.data);
      } else {
        setError(res.message || 'Verification failed. Cryptographic Hash does not exist on the ledger.');
      }
    } catch (err) {
      setError('Could not establish a connection to the public blockchain nodes.');
    } finally {
      setLoading(false);
    }
  };

  const getPDFUrl = (relativePath) => {
    return `${FILE_BASE_URL}${relativePath}`;
  };

  return (
    <div className="bg-glow-container" style={{ minHeight: 'calc(100vh - 80px)', padding: '60px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="spinner"></div>
          <p style={{ color: '#9ca3af' }}>Querying public blockchain nodes...</p>
        </div>
      ) : error ? (
        /* Failure Screen */
        <div className="glass-panel verification-card" style={{ borderColor: 'var(--color-error)', width: '100%', maxWidth: '640px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '20px', borderRadius: '50%', color: 'var(--color-error)' }}>
              <ShieldAlert size={48} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-error)', marginBottom: '12px' }}>Verification Failed</h2>
          <div className="alert-danger" style={{ marginBottom: '24px', justifyContent: 'center' }}>
            {error}
          </div>
          <div className="glass-card" style={{ textAlign: 'left', background: 'rgba(239, 68, 68, 0.02)', borderColor: 'rgba(239, 68, 68, 0.1)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong>Security Alert:</strong> The signature hash could not be located in the public blockchain directory. The certificate might be counterfeit, altered, or unregistered. Do not trust this certificate.
            </p>
          </div>
        </div>
      ) : (
        /* Success Screen */
        <div className="glass-panel verification-card verification-success-glow" style={{ width: '100%', maxWidth: '780px', padding: '40px' }}>
          
          {/* Status Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '50%', color: 'var(--color-success)' }}>
              <ShieldCheck size={52} />
            </div>
          </div>

          <h2 className="gradient-text-gold" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Degree Verified Authentic</h2>
          <p style={{ color: 'var(--color-success)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <CheckCircle size={16} /> Cryptographic Proof Located on Public Ledger
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
            
            {/* Degree Metadata */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="#f59e0b" /> Academic Credentials
              </h3>
              
              <div className="grid-2" style={{ gap: '16px 24px', fontSize: '0.9rem' }}>
                <p style={{ color: '#9ca3af' }}>Graduate Name: <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '1.05rem', marginTop: '4px' }}>{verificationResult.graduateName}</strong></p>
                <p style={{ color: '#9ca3af' }}>Degree Awarded: <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '1.05rem', marginTop: '4px' }}>{verificationResult.programName}</strong></p>
                <p style={{ color: '#9ca3af' }}>Serial Number: <strong style={{ color: 'var(--text-primary)', display: 'block', marginTop: '4px' }}>{verificationResult.serialNumber}</strong></p>
                <p style={{ color: '#9ca3af' }}>Cumulative GPA: <strong style={{ color: 'var(--text-primary)', display: 'block', marginTop: '4px' }}>{verificationResult.cgpa.toFixed(2)} / 4.00</strong></p>
              </div>
            </div>

            {/* Blockchain Evidence Logs */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} color="#6366f1" /> Hybrid Ledger Proofs
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                
                <div style={{ borderLeft: '2px solid #10b981', paddingLeft: '12px' }}>
                  <p style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Database size={12} /> PRIVATE STORAGE (AWS Datastore)
                  </p>
                  <p style={{ color: '#9ca3af', marginTop: '4px' }}>Records: Sensitive data encrypted & stored.</p>
                  <p style={{ color: 'var(--text-primary)', overflowWrap: 'break-word', marginTop: '2px' }}>
                    Transaction ID: {verificationResult.blockchain.privateTxId}
                  </p>
                </div>

                <div style={{ borderLeft: '2px solid #6366f1', paddingLeft: '12px', marginTop: '8px' }}>
                  <p style={{ color: '#6366f1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Hash size={12} /> PUBLIC VERIFIER (Ethereum Smart Contract)
                  </p>
                  <p style={{ color: '#9ca3af', marginTop: '4px' }}>Records: Cryptographic Degree Hash registered publicly.</p>
                  <p style={{ color: 'var(--text-primary)', overflowWrap: 'break-word', marginTop: '2px' }}>
                    Contract Address: {verificationResult.blockchain.publicContractAddress}
                  </p>
                  <p style={{ color: 'var(--text-primary)', overflowWrap: 'break-word', marginTop: '2px' }}>
                    Transaction ID: {verificationResult.blockchain.publicTxId}
                  </p>
                </div>

                <div style={{ borderLeft: '2px solid #f59e0b', paddingLeft: '12px', marginTop: '8px' }}>
                  <p style={{ color: '#f59e0b', fontWeight: 600 }}>
                    # DEGREE SIGNATURE HASH
                  </p>
                  <p style={{ color: '#f59e0b', fontSize: '0.85rem', overflowWrap: 'break-word', marginTop: '2px', fontWeight: 700 }}>
                    {verificationResult.degreeHash}
                  </p>
                </div>

              </div>
            </div>

            {/* Actions */}
            {verificationResult.pdfUrl && (
              <a 
                href={getPDFUrl(verificationResult.pdfUrl)}
                className="btn btn-primary"
                style={{ display: 'inline-flex', justifyContent: 'center', gap: '8px', textDecoration: 'none' }}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={18} /> Download Verified Digital Certificate (PDF)
              </a>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
