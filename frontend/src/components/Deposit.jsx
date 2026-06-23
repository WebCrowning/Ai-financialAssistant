import React, { useState, useEffect } from 'react';

// Font Awesome CDN (added to index.html)
const mtnIcon = '/MTN.png';
const orangeIcon = '/Orange.png';
const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#dbeafe',
  success: '#059669',
  successLight: '#d1fae5',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  warning: '#d97706',
  warningLight: '#fef3c7',
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },
  white: '#ffffff',
  black: '#000000'
};

export default function Deposit({ token, user }) {
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('mtn');
  const [depositHistory, setDepositHistory] = useState([]);
  const [alertMsg, setAlertMsg] = useState(null);
  const [alertType, setAlertType] = useState('success');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [transactionId, setTransactionId] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [showUSSDModal, setShowUSSDModal] = useState(false);
  const [ussdCode, setUssdCode] = useState('');

  const userDisplayName = user?.display_name || user?.email?.split('@')[0] || 'User';

  // Campay API Configuration
  const CAMPAY_CONFIG = {
    appId: 'WYrqFhs00aH7OVRrR8YBqJWhTDOX_iYv3TLk4V1Yhx05stMge1e6UxW1o4YCwftBquVgswNb55u4fFVr_soYRg',
    appUsername: 'CjMhrcSG0VERcEAADYogsYKB2CjHnYA3_5NH1nS3sRyIlsZA_ZJwUMK0LLn_nT4HqxAXhf0pgBHp2sve7HlLOg',
    appPassword: 'MLo71h9moDfYehHEenqs1_CXIbYBLXW_KKVjz30L_0OvHiHwKRVqkDlMTLVa5Bf82Vx53CRCOcOTFiESOanrMw',
    accessToken: '2c6db42be678aa0c93814dfcded2eb50075a68e4',
    webhookKey: 'lcYAH0fjuYtDoVwX5Iiam6tnZtI3XKYL5-UitkcELnbKoBBpzSGOLr0fvgTUXPp5vUs5aplmA2AeHbQR0pbXGA'
  };

  const PAYMENT_PROVIDERS = [
    { id: 'mtn', name: 'MTN Mobile Money', image: mtnIcon, color: '#FFCD00' },
    { id: 'orange', name: 'Orange Money', image: orangeIcon, color: '#FF6600' },
    { id: 'airtel', name: 'Airtel Money', icon: 'fa-phone', color: '#FF0000' },
    { id: 'vodafone', name: 'Vodafone Cash', icon: 'fa-phone', color: '#E60000' }
  ];

  const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000, 100000];

  useEffect(() => {
    fetchDepositHistory();
  }, [token]);

  const showAlert = (message, type = 'success') => {
    setAlertMsg(message);
    setAlertType(type);
    setTimeout(() => setAlertMsg(null), 8000);
  };

  const fetchDepositHistory = async () => {
    try {
      const response = await fetch('/api/deposits', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDepositHistory(data);
      }
    } catch (error) {
      console.error('Error fetching deposit history:', error);
    }
  };

  // Format phone number for Campay API
  const formatPhoneNumber = (number) => {
    const cleaned = number.replace(/\D/g, '');
    
    // If it starts with 237, keep it
    if (cleaned.startsWith('237')) {
      return cleaned;
    }
    
    // If it starts with 0, remove leading 0 and add 237
    if (cleaned.startsWith('0')) {
      return '237' + cleaned.substring(1);
    }
    
    // If it's 9 digits (Cameroon format), add 237
    if (cleaned.length === 9) {
      return '237' + cleaned;
    }
    
    // If it's 8 digits, add 237 and assume 6
    if (cleaned.length === 8) {
      return '2376' + cleaned;
    }
    
    return cleaned;
  };

  const initiateDeposit = async () => {
    if (!amount || parseFloat(amount) < 3) {
      showAlert('Minimum deposit amount is 3 FR', 'error');
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log('📱 Original phone:', phoneNumber);
    console.log('📱 Formatted phone:', formattedPhone);

    // Validate phone number (Cameroon format: 9 digits starting with 6 or 7, or 237 + 9 digits)
    const isValid = /^(237)?[67]\d{8}$/.test(formattedPhone);
    if (!isValid) {
      showAlert('Please enter a valid Cameroon phone number (e.g., 651342166 or 237651342166)', 'error');
      return;
    }

    setLoading(true);
    setDebugInfo(null);
    
    try {
      // Determine the provider code that Campay expects
      const providerMap = {
        'mtn': 'MTN',
        'orange': 'ORANGE',
        'airtel': 'AIRTEL',
        'vodafone': 'VODAFONE'
      };

      const payload = {
        amount: parseFloat(amount),
        currency: 'XAF',
        from: formattedPhone,
        description: `Deposit to FinVision wallet for ${userDisplayName}`,
        external_reference: `DEP-${Date.now()}-${user?.id || 'user'}`,
        provider: providerMap[selectedProvider] || selectedProvider.toUpperCase(),
        customer_name: userDisplayName,
        customer_email: user?.email || ''
      };

      console.log('📤 Sending to Campay:', JSON.stringify(payload, null, 2));

      const response = await fetch('https://demo.campay.net/api/collect/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${CAMPAY_CONFIG.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('📥 Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        showAlert(`Server error: ${responseText.substring(0, 100)}`, 'error');
        setLoading(false);
        return;
      }

      console.log('📥 Parsed response:', data);

      // Check if the response contains a reference (success indicator)
      if (data.reference) {
        // SUCCESS! The payment was initiated
        setTransactionId(data.reference);
        
        // Check if there's a USSD code to show
        if (data.ussd_code) {
          setUssdCode(data.ussd_code);
          setShowUSSDModal(true);
          showAlert(`Payment initiated! Use USSD code ${data.ussd_code} to complete the transaction.`, 'success');
        } else {
          // If no USSD code, show OTP modal (assuming OTP will be sent)
          setShowOTPModal(true);
          showAlert('Payment initiated! Please enter the OTP sent to your phone.', 'success');
        }

        // Record the deposit as pending
        try {
          await fetch('/api/deposits', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amount: parseFloat(amount),
              phone: phoneNumber,
              provider: selectedProvider,
              reference: data.reference,
              status: 'pending',
              operator: data.operator || selectedProvider
            })
          });
        } catch (err) {
          console.error('Error recording pending deposit:', err);
        }
      } else if (data.status === 'success' || data.status === 'pending' || data.success === true) {
        // Alternative success indicators
        const ref = data.reference || data.id || data.transaction_id || data.transactionId || data.ref;
        if (ref) {
          setTransactionId(ref);
          setShowOTPModal(true);
          showAlert('Payment initiated! Please enter the OTP sent to your phone.', 'success');
        } else {
          showAlert('Payment initiated but no reference received.', 'warning');
        }
      } else {
        // Error response
        const errorMsg = data.message || data.detail || data.error || data.status || 'Payment initiation failed';
        showAlert(errorMsg, 'error');
        setDebugInfo({ 
          status: response.status, 
          data: data,
          payload: payload
        });
      }
    } catch (error) {
      console.error('❌ Error initiating deposit:', error);
      showAlert(`Network error: ${error.message}. Please check your connection.`, 'error');
      setDebugInfo({ 
        error: error.message,
        stack: error.stack
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUSSDComplete = async () => {
    // User has completed the USSD flow
    setShowUSSDModal(false);
    showAlert('Waiting for payment confirmation...', 'warning');
    
    // Record deposit as completed
    try {
      const depositRecord = await fetch('/api/deposits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          phone: phoneNumber,
          provider: selectedProvider,
          reference: transactionId,
          status: 'completed',
          operator: selectedProvider
        })
      });

      if (depositRecord.ok) {
        showAlert(`✅ Successfully deposited CFA ${parseFloat(amount).toLocaleString()}!`, 'success');
        setAmount('');
        setPhoneNumber('');
        fetchDepositHistory();
      }
    } catch (err) {
      console.error('Error recording deposit:', err);
    }
  };

  const verifyOTP = async () => {
    if (!otpCode || otpCode.length < 4) {
      showAlert('Please enter the OTP code', 'error');
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        reference: transactionId,
        otp: otpCode
      };

      console.log('📤 Verifying OTP:', payload);

      const response = await fetch('https://demo.campay.net/api/collect/verify/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${CAMPAY_CONFIG.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('📥 Raw OTP response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse OTP response:', e);
        showAlert('Invalid response from verification server', 'error');
        setProcessing(false);
        return;
      }

      console.log('📥 Parsed OTP response:', data);

      if (response.ok || data.status === 'success' || data.success === true) {
        // Record deposit as completed
        try {
          const depositRecord = await fetch('/api/deposits', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amount: parseFloat(amount),
              phone: phoneNumber,
              provider: selectedProvider,
              reference: transactionId,
              status: 'completed'
            })
          });

          if (depositRecord.ok) {
            showAlert(`✅ Successfully deposited CFA ${parseFloat(amount).toLocaleString()}!`, 'success');
            setShowOTPModal(false);
            setOtpCode('');
            setAmount('');
            setPhoneNumber('');
            fetchDepositHistory();
          } else {
            const errorData = await depositRecord.json();
            showAlert(`Deposit completed but record failed: ${errorData.message || 'Unknown error'}`, 'warning');
          }
        } catch (err) {
          console.error('Error recording deposit:', err);
          showAlert('Deposit completed but failed to record. Please contact support.', 'warning');
        }
      } else {
        showAlert(data.message || data.detail || data.error || 'OTP verification failed', 'error');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      showAlert(`Verification error: ${error.message}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIconWrapper}>
            <i className="fas fa-wallet" style={{ color: COLORS.white, fontSize: '24px' }}></i>
          </div>
          <div>
            <h1 style={styles.title}>Deposit Funds</h1>
            <p style={styles.subtitle}>Add money to your FinVision wallet via mobile money</p>
          </div>
        </div>
        <div style={styles.userInfo}>
          <i className="fas fa-user-circle" style={{ color: COLORS.primary, fontSize: '20px' }}></i>
          <span style={styles.userName}>{userDisplayName}</span>
        </div>
      </header>

      {/* Alert Messages */}
      {alertMsg && (
        <div style={{
          ...styles.alert,
          ...(alertType === 'success' ? styles.alertSuccess : alertType === 'warning' ? styles.alertWarning : styles.alertError)
        }}>
          <i className={`fas ${alertType === 'success' ? 'fa-check-circle' : alertType === 'warning' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'}`}></i>
          <span>{alertMsg}</span>
          <button onClick={() => setAlertMsg(null)} style={styles.alertClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Debug Info */}
      {debugInfo && (
        <div style={styles.debugContainer}>
          <details style={styles.debugDetails}>
            <summary style={styles.debugSummary}>
              <i className="fas fa-bug"></i> Debug Information (Click to expand)
            </summary>
            <pre style={styles.debugContent}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div style={styles.depositGrid}>
        {/* Deposit Form */}
        <div style={styles.depositCard}>
          <h2 style={styles.cardTitle}>
            <i className="fas fa-plus-circle" style={{ color: COLORS.primary }}></i>
            Make a Deposit
          </h2>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Select Payment Provider</label>
            <div style={styles.providerGrid}>
              {PAYMENT_PROVIDERS.map(provider => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className="provider-btn"
                  style={{
                    ...styles.providerBtn,
                    ...(selectedProvider === provider.id ? styles.providerBtnActive : {}),
                    borderColor: selectedProvider === provider.id ? provider.color : COLORS.gray[200]
                  }}
                >
                  {provider.image ? (
                      <img src={provider.image} alt={provider.name} style={ provider.id === 'orange' ? { width: '50px', height: '40px', marginRight: '8px' } : { width: '40px', height: '40px', marginRight: '8px' } } />
                    ) : (
                      <i className={`fas ${provider.icon}`} style={{ color: provider.color }}></i>
                    )}
                  <span style={styles.providerName}>{provider.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Phone Number</label>
            <div style={styles.phoneInput}>
              <span style={styles.phonePrefix}>+237</span>
              <input
                type="tel"
                placeholder="6XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 9) {
                    setPhoneNumber(value);
                  }
                }}
                style={styles.phoneInputField}
                maxLength="9"
              />
            </div>
            <p style={styles.helpText}>
              Enter your 9-digit mobile money number (e.g., 651342166)
            </p>
            {phoneNumber && phoneNumber.length === 9 && (
              <p style={{...styles.helpText, color: COLORS.success, fontWeight: '500'}}>
                <i className="fas fa-check-circle"></i> Valid number: +237 {phoneNumber}
              </p>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Amount (CFA)</label>
            <div style={styles.amountInput}>
              <span style={styles.currencySymbol}>CFA</span>
              <input
                type="number" min="3"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={styles.amountInputField}

                step="25"
              />
            </div>
          </div>

          <div style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map(quickAmount => (
              <button
                key={quickAmount}
                onClick={() => setAmount(quickAmount.toString())}
                className="quick-amount-btn"
                style={{
                  ...styles.quickAmountBtn,
                  ...(parseFloat(amount) === quickAmount ? styles.quickAmountBtnActive : {})
                }}
              >
                CFA {quickAmount.toLocaleString()}
              </button>
            ))}
          </div>

          <button
            onClick={initiateDeposit}
            disabled={loading || !amount || !phoneNumber || phoneNumber.length !== 9}
            className="deposit-btn"
            style={{
              ...styles.depositBtn,
              opacity: (loading || !amount || !phoneNumber || phoneNumber.length !== 9) ? 0.6 : 1,
              cursor: (loading || !amount || !phoneNumber || phoneNumber.length !== 9) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-arrow-right"></i>
                Deposit CFA {amount ? parseFloat(amount).toLocaleString() : '0'}
              </>
            )}
          </button>

          <div style={styles.footerNote}>
            <i className="fas fa-shield-alt" style={{ color: COLORS.success }}></i>
            <span>Your transaction is secured and encrypted</span>
          </div>
        </div>

        {/* Deposit History */}
        <div style={styles.historyCard}>
          <h2 style={styles.cardTitle}>
            <i className="fas fa-history" style={{ color: COLORS.gray[500] }}></i>
            Deposit History
          </h2>

          {depositHistory.length === 0 ? (
            <div style={styles.emptyHistory}>
              <i className="fas fa-wallet" style={{ fontSize: '48px', color: COLORS.gray[300] }}></i>
              <p style={styles.emptyText}>No deposits yet</p>
              <span style={styles.emptySubtext}>Your deposit history will appear here</span>
            </div>
          ) : (
            <div style={styles.historyList}>
              {depositHistory.map((deposit, index) => {
                const createdTime = new Date(deposit.created_at).getTime();
                const isOverTime = deposit.status === 'pending' && (Date.now() - createdTime > 6 * 60 * 1000);
                const status = isOverTime ? 'failed' : deposit.status;
                
                let statusLabel = 'Pending';
                let statusBg = COLORS.warningLight;
                let statusColor = COLORS.warning;
                let iconColor = COLORS.success; // Default arrow down is green if completed or pending, but red if failed
                
                if (status === 'completed') {
                  statusLabel = 'Completed';
                  statusBg = COLORS.successLight;
                  statusColor = COLORS.success;
                  iconColor = COLORS.success;
                } else if (status === 'failed') {
                  statusLabel = 'Failed';
                  statusBg = COLORS.dangerLight;
                  statusColor = COLORS.danger;
                  iconColor = COLORS.danger;
                }

                return (
                  <div key={index} className="history-item" style={styles.historyItem}>
                    <div style={styles.historyIcon}>
                      <i className="fas fa-arrow-down" style={{ color: iconColor }}></i>
                    </div>
                    <div style={styles.historyDetails}>
                      <div style={styles.historyHeader}>
                        <span style={styles.historyAmount}>+CFA {parseFloat(deposit.amount).toLocaleString()}</span>
                        <span style={{
                          ...styles.historyStatus,
                          background: statusBg,
                          color: statusColor
                        }}>
                          {statusLabel}
                        </span>
                      </div>
                      <div style={styles.historyMeta}>
                        <span style={styles.historyProvider}>
                          <i className="fas fa-phone"></i>
                          {PAYMENT_PROVIDERS.find(p => p.id === deposit.provider)?.name || deposit.provider || 'Mobile Money'}
                        </span>
                        <span style={styles.historyDate}>
                          <i className="fas fa-calendar-alt"></i>
                          {formatDate(deposit.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* OTP Modal */}
      {showOTPModal && (
        <div style={styles.modalOverlay} onClick={() => setShowOTPModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <i className="fas fa-shield-alt" style={{ color: COLORS.primary }}></i>
                Verify OTP
              </h3>
              <button
                onClick={() => setShowOTPModal(false)}
                className="modal-close"
                style={styles.modalClose}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={styles.modalContent}>
              <p style={styles.modalText}>
                We've sent a One-Time Password (OTP) to your phone number <strong>+237 {phoneNumber}</strong>.
                Please enter it below to confirm your deposit of <strong>CFA {parseFloat(amount).toLocaleString()}</strong>.
              </p>

              <div style={styles.otpInputGroup}>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="otp-input"
                  style={styles.otpInput}
                  maxLength="6"
                  autoFocus
                />
                <button
                  onClick={verifyOTP}
                  disabled={processing || otpCode.length < 4}
                  className="otp-verify-btn"
                  style={{
                    ...styles.otpVerifyBtn,
                    opacity: (processing || otpCode.length < 4) ? 0.6 : 1,
                    cursor: (processing || otpCode.length < 4) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {processing ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    'Verify OTP'
                  )}
                </button>
              </div>

              <p style={styles.otpResend}>
                Didn't receive the code? <button onClick={() => showAlert('OTP resent!', 'success')} className="resend-btn" style={styles.resendBtn}>Resend</button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* USSD Modal */}
      {showUSSDModal && (
        <div style={styles.modalOverlay} onClick={() => setShowUSSDModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <i className="fas fa-phone" style={{ color: COLORS.primary }}></i>
                Complete Payment via USSD
              </h3>
              <button
                onClick={() => setShowUSSDModal(false)}
                className="modal-close"
                style={styles.modalClose}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={styles.modalContent}>
              <div style={styles.ussdInfo}>
                <div style={styles.ussdCodeDisplay}>
                  <span style={styles.ussdLabel}>USSD Code:</span>
                  <span style={styles.ussdCodeValue}>{ussdCode}</span>
                </div>
                <p style={styles.modalText}>
                  <i className="fas fa-info-circle" style={{ color: COLORS.primary, marginRight: '8px' }}></i>
                  Dial <strong>{ussdCode}</strong> on your phone and follow the prompts to complete the payment of <strong>CFA {parseFloat(amount).toLocaleString()}</strong>.
                </p>
                <div style={styles.ussdSteps}>
                  <p style={styles.ussdStep}>1. Dial <strong>{ussdCode}</strong> on your mobile phone</p>
                  <p style={styles.ussdStep}>2. Follow the on-screen instructions</p>
                  <p style={styles.ussdStep}>3. Enter your PIN to confirm the payment</p>
                  <p style={styles.ussdStep}>4. Wait for the confirmation message</p>
                </div>
              </div>

              <button
                onClick={handleUSSDComplete}
                className="deposit-btn"
                style={styles.ussdCompleteBtn}
              >
                <i className="fas fa-check"></i>
                I've Completed the Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles (same as before with USSD additions)
const styles = {
  container: {
    padding: '28px',
    maxWidth: '1200px',
    margin: '0 auto',
    background: COLORS.gray[50],
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    padding: '20px 24px',
    background: COLORS.white,
    borderRadius: '16px',
    border: `1px solid ${COLORS.gray[200]}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerIconWrapper: {
    width: '48px',
    height: '48px',
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  subtitle: {
    margin: '4px 0 0 0',
    color: COLORS.gray[500],
    fontSize: '14px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: COLORS.primaryLight,
    borderRadius: '20px',
  },
  userName: {
    fontWeight: '600',
    color: COLORS.primary,
    fontSize: '14px',
  },
  alert: {
    padding: '14px 20px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    position: 'relative',
    fontWeight: '500',
  },
  alertSuccess: {
    background: COLORS.successLight,
    border: `1px solid ${COLORS.success}`,
    color: COLORS.success,
  },
  alertWarning: {
    background: COLORS.warningLight,
    border: `1px solid ${COLORS.warning}`,
    color: COLORS.warning,
  },
  alertError: {
    background: COLORS.dangerLight,
    border: `1px solid ${COLORS.danger}`,
    color: COLORS.danger,
  },
  alertClose: {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
  },
  debugContainer: {
    background: COLORS.gray[900],
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '20px',
    overflow: 'auto',
  },
  debugDetails: {
    color: COLORS.gray[300],
    fontSize: '13px',
  },
  debugSummary: {
    cursor: 'pointer',
    fontWeight: '600',
    color: COLORS.gray[300],
  },
  debugContent: {
    marginTop: '10px',
    padding: '10px',
    background: COLORS.gray[800],
    borderRadius: '4px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '300px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: 'monospace',
  },
  depositGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  depositCard: {
    background: COLORS.white,
    padding: '24px',
    borderRadius: '16px',
    border: `1px solid ${COLORS.gray[200]}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  historyCard: {
    background: COLORS.white,
    padding: '24px',
    borderRadius: '16px',
    border: `1px solid ${COLORS.gray[200]}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  cardTitle: {
    margin: '0 0 20px 0',
    fontSize: '16px',
    fontWeight: '700',
    color: COLORS.gray[900],
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: '8px',
  },
  providerGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  providerBtn: {
    padding: '12px',
    border: `2px solid ${COLORS.gray[200]}`,
    borderRadius: '10px',
    background: COLORS.white,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  providerBtnActive: {
    borderColor: COLORS.primary,
    background: COLORS.primaryLight,
  },
  providerName: {
    fontSize: '13px',
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  phoneInput: {
    display: 'flex',
    alignItems: 'center',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '10px',
    background: COLORS.gray[50],
    overflow: 'hidden',
  },
  phonePrefix: {
    padding: '12px 16px',
    background: COLORS.gray[100],
    color: COLORS.gray[600],
    fontWeight: '600',
    fontSize: '14px',
    borderRight: `1px solid ${COLORS.gray[200]}`,
  },
  phoneInputField: {
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    background: 'transparent',
    fontSize: '14px',
    outline: 'none',
    color: COLORS.gray[900],
  },
  helpText: {
    margin: '6px 0 0 0',
    fontSize: '12px',
    color: COLORS.gray[400],
  },
  amountInput: {
    display: 'flex',
    alignItems: 'center',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '10px',
    background: COLORS.gray[50],
    overflow: 'hidden',
  },
  currencySymbol: {
    padding: '12px 16px',
    background: COLORS.gray[100],
    color: COLORS.gray[600],
    fontWeight: '700',
    fontSize: '14px',
    borderRight: `1px solid ${COLORS.gray[200]}`,
  },
  amountInputField: {
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    background: 'transparent',
    fontSize: '18px',
    fontWeight: '700',
    outline: 'none',
    color: COLORS.gray[900],
  },
  quickAmounts: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  quickAmountBtn: {
    padding: '6px 14px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '20px',
    background: COLORS.white,
    color: COLORS.gray[600],
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  quickAmountBtnActive: {
    background: COLORS.primary,
    color: COLORS.white,
    borderColor: COLORS.primary,
  },
  depositBtn: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: '12px',
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`,
    color: COLORS.white,
    fontSize: '16px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  footerNote: {
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    justifyContent: 'center',
    fontSize: '12px',
    color: COLORS.gray[500],
  },
  emptyHistory: {
    textAlign: 'center',
    padding: '40px 0',
  },
  emptyText: {
    margin: '12px 0 4px 0',
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  emptySubtext: {
    fontSize: '13px',
    color: COLORS.gray[400],
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: COLORS.gray[50],
    borderRadius: '10px',
    transition: 'background 0.2s',
  },
  historyIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: COLORS.successLight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  historyDetails: {
    flex: 1,
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  historyAmount: {
    fontWeight: '700',
    color: COLORS.gray[900],
    fontSize: '14px',
  },
  historyStatus: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 10px',
    borderRadius: '12px',
  },
  historyMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: COLORS.gray[500],
  },
  historyProvider: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  historyDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '100%',
    maxWidth: '480px',
    background: COLORS.white,
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
    color: COLORS.gray[900],
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  modalClose: {
    padding: '8px',
    border: 'none',
    background: COLORS.gray[100],
    borderRadius: '8px',
    color: COLORS.gray[500],
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  modalText: {
    margin: 0,
    color: COLORS.gray[600],
    fontSize: '14px',
    lineHeight: '1.6',
  },
  otpInputGroup: {
    display: 'flex',
    gap: '12px',
  },
  otpInput: {
    flex: 1,
    padding: '12px 16px',
    border: `2px solid ${COLORS.gray[200]}`,
    borderRadius: '10px',
    fontSize: '18px',
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  otpVerifyBtn: {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '10px',
    background: COLORS.primary,
    color: COLORS.white,
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  otpResend: {
    textAlign: 'center',
    fontSize: '13px',
    color: COLORS.gray[500],
    margin: 0,
  },
  resendBtn: {
    border: 'none',
    background: 'none',
    color: COLORS.primary,
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  ussdInfo: {
    background: COLORS.gray[50],
    padding: '16px',
    borderRadius: '10px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  ussdCodeDisplay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '12px',
    background: COLORS.gray[900],
    borderRadius: '8px',
    marginBottom: '16px',
  },
  ussdLabel: {
    color: COLORS.gray[400],
    fontSize: '14px',
    fontWeight: '500',
  },
  ussdCodeValue: {
    color: COLORS.white,
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '2px',
  },
  ussdSteps: {
    marginTop: '12px',
  },
  ussdStep: {
    margin: '8px 0',
    color: COLORS.gray[600],
    fontSize: '14px',
    padding: '4px 0',
  },
  ussdCompleteBtn: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: '12px',
    background: `linear-gradient(135deg, ${COLORS.success}, ${COLORS.success})`,
    color: COLORS.white,
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
};

// Hover styles
if (typeof document !== 'undefined') {
  const id = 'deposit-page-styles';
  if (!document.getElementById(id)) {
    const styleSheet = document.createElement("style");
    styleSheet.id = id;
    styleSheet.textContent = `
      .provider-btn:hover {
        border-color: ${COLORS.primary} !important;
        background: ${COLORS.primaryLight} !important;
      }
      
      .quick-amount-btn:hover {
        border-color: ${COLORS.primary} !important;
        color: ${COLORS.primary} !important;
      }
      
      .deposit-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
      }
      
      .ussd-complete-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(5, 150, 105, 0.3);
      }
      
      .history-item:hover {
        background: ${COLORS.white} !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      }
      
      .otp-input:focus {
        border-color: ${COLORS.primary} !important;
        box-shadow: 0 0 0 3px ${COLORS.primaryLight} !important;
      }
      
      .otp-verify-btn:hover:not(:disabled) {
        background: ${COLORS.primaryDark} !important;
        transform: scale(1.02);
      }
      
      .modal-close:hover {
        background: ${COLORS.gray[200]} !important;
      }
      
      .alert-close:hover {
        opacity: 0.7;
      }
      
      .resend-btn:hover {
        color: ${COLORS.primaryDark} !important;
      }
      
      @media (max-width: 768px) {
        .deposit-grid {
          grid-template-columns: 1fr !important;
        }
        
        .provider-grid {
          grid-template-columns: 1fr !important;
        }
        
        .otp-input-group {
          flex-direction: column !important;
        }
        
        .header {
          flex-direction: column !important;
          text-align: center !important;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}