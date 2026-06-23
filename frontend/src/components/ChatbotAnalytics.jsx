import React, { useState, useEffect, useRef } from 'react';

// Font Awesome CDN (add to index.html)
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />

const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#dbeafe',
  secondary: '#7c3aed',
  secondaryLight: '#ede9fe',
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

export default function ChatbotAnalytics({ user, token }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your FinVision AI Assistant. By default, I analyze your stored website data (expenses, income, and purchases). You can also:\n\n• Upload an Excel sheet with your SMS transactions for specific analysis\n• Ask questions about your spending\n• Get personalized financial recommendations",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [expenditureData, setExpenditureData] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [fileData, setFileData] = useState(null);
  const [fileAnalysis, setFileAnalysis] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchExpenditureData();
    fetchChatHistory();
  }, [token]);

  const fetchChatHistory = async () => {
    if (!token) return;
    try {
      const response = await fetch('/api/chatbot-analytics/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const loadedMessages = [];
          
          loadedMessages.push({
            id: 1,
            type: 'bot',
            content: "Hello! I'm your FinVision AI Assistant. By default, I analyze your stored website data (expenses, income, and purchases). You can also:\n\n• Upload an Excel sheet with your SMS transactions for specific analysis\n• Ask questions about your spending\n• Get personalized financial recommendations",
            timestamp: data[0] ? new Date(data[0].created_at) : new Date()
          });

          data.forEach((item) => {
            loadedMessages.push({
              id: loadedMessages.length + 1,
              type: 'user',
              content: item.query,
              timestamp: new Date(item.created_at)
            });
            loadedMessages.push({
              id: loadedMessages.length + 1,
              type: 'bot',
              content: item.response,
              timestamp: new Date(item.created_at)
            });
          });
          setMessages(loadedMessages);
        }
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleClearChat = async () => {
    if (!token) return;
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      try {
        const response = await fetch('/api/chatbot-analytics/history', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          setMessages([
            {
              id: 1,
              type: 'bot',
              content: "Hello! I'm your FinVision AI Assistant. By default, I analyze your stored website data (expenses, income, and purchases). You can also:\n\n• Upload an Excel sheet with your SMS transactions for specific analysis\n• Ask questions about your spending\n• Get personalized financial recommendations",
              timestamp: new Date()
            }
          ]);
          setExpenditureData(null);
          setFileAnalysis(null);
          setUploadedFile(null);
          setFileData(null);
        }
      } catch (error) {
        console.error('Error clearing chat history:', error);
      }
    }
  };

  const fetchExpenditureData = async () => {
    try {
      const response = await fetch('/api/chatbot-analytics/expenditure', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExpenditureData(data);
      }
    } catch (error) {
      console.error('Error fetching expenditure data:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop().toLowerCase();
    const validTypes = [
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
      'text/csv', 
      'text/plain'
    ];
    const validExts = ['xls', 'xlsx', 'csv', 'txt'];
    
    if (!validTypes.includes(file.type) && !validExts.includes(fileExt)) {
      addMessage('bot', 'Please upload a valid Excel, CSV, or Text file.');
      return;
    }

    setUploadedFile(file);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target.result;
        setFileData(content);

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/chatbot-analytics/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          setFileAnalysis(result);
          addMessage('bot', `✅ I've successfully uploaded your file with ${result.recordCount || 'multiple'} records. I can now analyze your data. What would you like to know?`);
          fetchExpenditureData();
        } else {
          addMessage('bot', 'I had trouble processing your file. Please ensure it has standard financial columns.');
        }
      } catch (error) {
        addMessage('bot', 'Error processing file. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const addMessage = (type, content) => {
    setMessages(prev => [...prev, { id: prev.length + 1, type, content, timestamp: new Date() }]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userQuery = inputValue;
    addMessage('user', userQuery);
    setInputValue('');
    setLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chatbot-analytics/analyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          query: userQuery, 
          hasFileData: !!fileData, 
          expenditureData, 
          fileAnalysis 
        })
      });

      if (response.ok) {
        const result = await response.json();
        addMessage('bot', result.analysis || 'I could not generate a response.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        addMessage('bot', errorData.analysis || 'I encountered an error analyzing your request. Please check your AI service configuration.');
      }
    } catch (error) {
      addMessage('bot', "Sorry, I'm unable to connect to the AI service. Please try again later.");
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderCleanMessageContent = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();
      const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || /^\d+\./.test(trimmed);
      const parts = line.split('**');
      const formattedLine = parts.map((part, partIdx) => {
        if (partIdx % 2 === 1) {
          return <strong key={partIdx}>{part}</strong>;
        }
        return part;
      });
      return (
        <span 
          key={lineIdx} 
          style={{ 
            display: 'block', 
            marginBottom: line.trim() === '' ? '12px' : '4px',
            paddingLeft: isBullet ? '16px' : '0',
            textIndent: isBullet ? '-16px' : '0',
            lineHeight: '1.6'
          }}
        >
          {formattedLine}
        </span>
      );
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const userDisplayName = user?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIconWrapper}>
            <i className="fas fa-brain" style={{ color: COLORS.white, fontSize: '24px' }}></i>
          </div>
          <div>
            <h1 style={styles.title}>Financial AI Analyst</h1>
            <p style={styles.subtitle}>Advanced expenditure analytics powered by intelligent insights</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button 
            onClick={handleClearChat}
            style={styles.clearHistoryButton}
            className="clear-history-button"
            title="Clear Chat History"
          >
            <i className="fas fa-trash-can" style={{ marginRight: '6px' }}></i>
            Clear Chat
          </button>
          <div style={styles.statusBadge}>
            <span style={styles.statusDot}></span>
            <span style={styles.statusText}>AI Online</span>
          </div>
          <div style={styles.userBadge}>
            <i className="fas fa-user-circle" style={{ color: COLORS.primary, fontSize: '20px' }}></i>
            <span style={styles.userName}>{userDisplayName}</span>
          </div>
        </div>
      </header>

      <div style={styles.mainGrid}>
        {/* Chat / Insights Section */}
        <div style={styles.chatContainer}>
          {/* Tabs */}
          <div style={styles.tabsContainer}>
            <button
              onClick={() => setActiveTab('chat')}
              style={{
                ...styles.tab,
                ...(activeTab === 'chat' ? styles.tabActive : {})
              }}
            >
              <i className="fas fa-comment-dots"></i>
              Chat Interaction
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              style={{
                ...styles.tab,
                ...(activeTab === 'insights' ? styles.tabActive : {})
              }}
            >
              <i className="fas fa-chart-pie"></i>
              Data Insights
            </button>
          </div>

          {/* Content Area */}
          <div style={styles.contentArea}>
            {activeTab === 'chat' ? (
              <>
                <div style={styles.messagesContainer}>
                  {messages.map(msg => (
                    <div key={msg.id} style={{
                      ...styles.messageWrapper,
                      ...(msg.type === 'user' ? styles.messageWrapperUser : styles.messageWrapperBot)
                    }}>
                      {msg.type === 'bot' && (
                        <div style={styles.avatarBot}>
                          <i className="fas fa-robot" style={{ fontSize: '16px', color: COLORS.white }}></i>
                        </div>
                      )}
                      <div style={{
                        ...styles.messageBubble,
                        ...(msg.type === 'user' ? styles.messageBubbleUser : styles.messageBubbleBot)
                      }}>
                        <div style={styles.messageText}>
                          {renderCleanMessageContent(msg.content)}
                        </div>
                        <span style={styles.messageTime}>
                          <i className="far fa-clock" style={{ marginRight: '4px' }}></i>
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      {msg.type === 'user' && (
                        <div style={styles.avatarUser}>
                          <span style={styles.avatarUserText}>{getInitials(userDisplayName)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div style={styles.messageWrapperBot}>
                      <div style={styles.avatarBot}>
                        <i className="fas fa-robot" style={{ fontSize: '16px', color: COLORS.white }}></i>
                      </div>
                      <div style={{...styles.messageBubble, ...styles.messageBubbleBot, ...styles.typingBubble}}>
                        <div style={styles.typingDots}>
                          <div style={styles.typingDot}></div>
                          <div style={styles.typingDot}></div>
                          <div style={styles.typingDot}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={styles.inputArea}>
                  <div style={styles.inputWrapper}>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about your spending..."
                      disabled={loading}
                      style={styles.chatInput}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={loading || !inputValue.trim()}
                      style={{
                        ...styles.sendButton,
                        opacity: (loading || !inputValue.trim()) ? 0.5 : 1,
                        cursor: (loading || !inputValue.trim()) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {loading ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-paper-plane"></i>
                      )}
                    </button>
                  </div>
                  <p style={styles.disclaimer}>
                    <i className="fas fa-info-circle"></i>
                    AI responses are for educational purposes. Always verify important financial decisions.
                  </p>
                </div>
              </>
            ) : (
              <div style={styles.insightsContainer}>
                {fileAnalysis && fileAnalysis.summary && (
                  <div style={styles.smsSummaryContainer}>
                    <h4 style={styles.smsSummaryTitle}>
                      <i className="fas fa-file-invoice-dollar" style={{ color: COLORS.primary }}></i>
                      SMS Export Summary: {fileAnalysis.fileName}
                    </h4>
                    <div style={styles.smsGrid}>
                      <div style={{ ...styles.insightCard, flex: '1 1 200px' }}>
                        <div style={{ ...styles.insightIcon, background: COLORS.successLight }}>
                          <i className="fas fa-plus-circle" style={{ color: COLORS.success, fontSize: '20px' }}></i>
                        </div>
                        <div>
                          <span style={styles.insightLabel}>SMS Total Income</span>
                          <span style={{ ...styles.insightValue, color: COLORS.success }}>
                            CFA {fileAnalysis.summary.totalIncome?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </div>
                      <div style={{ ...styles.insightCard, flex: '1 1 200px' }}>
                        <div style={{ ...styles.insightIcon, background: COLORS.dangerLight }}>
                          <i className="fas fa-minus-circle" style={{ color: COLORS.danger, fontSize: '20px' }}></i>
                        </div>
                        <div>
                          <span style={styles.insightLabel}>SMS Total Expenses</span>
                          <span style={{ ...styles.insightValue, color: COLORS.danger }}>
                            CFA {fileAnalysis.summary.totalExpenses?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </div>
                      <div style={{ ...styles.insightCard, flex: '1 1 200px' }}>
                        <div style={{ ...styles.insightIcon, background: COLORS.primaryLight }}>
                          <i className="fas fa-scale-balanced" style={{ color: COLORS.primary, fontSize: '20px' }}></i>
                        </div>
                        <div>
                          <span style={styles.insightLabel}>SMS Net Balance</span>
                          <span style={{ ...styles.insightValue, color: fileAnalysis.summary.netBalance >= 0 ? COLORS.success : COLORS.danger }}>
                            CFA {fileAnalysis.summary.netBalance?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {expenditureData ? (
                  <>
                    <div style={styles.insightCard}>
                      <div style={{ ...styles.insightIcon, background: COLORS.successLight }}>
                        <i className="fas fa-arrow-trend-up" style={{ color: COLORS.success, fontSize: '20px' }}></i>
                      </div>
                      <div>
                        <span style={styles.insightLabel}>Total Monthly Expenditure</span>
                        <span style={{...styles.insightValue, color: COLORS.success}}>
                          CFA {expenditureData.totalExpenditure?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>

                    <div style={styles.insightCard}>
                      <div style={{ ...styles.insightIcon, background: COLORS.primaryLight }}>
                        <i className="fas fa-chart-line" style={{ color: COLORS.primary, fontSize: '20px' }}></i>
                      </div>
                      <div>
                        <span style={styles.insightLabel}>Average Daily Spend</span>
                        <span style={{...styles.insightValue, color: COLORS.primary}}>
                          CFA {expenditureData.averageDaily?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>

                    <div style={styles.insightCard}>
                      <div style={{ ...styles.insightIcon, background: COLORS.warningLight }}>
                        <i className="fas fa-tag" style={{ color: COLORS.warning, fontSize: '20px' }}></i>
                      </div>
                      <div>
                        <span style={styles.insightLabel}>Top Spending Category</span>
                        <span style={{...styles.insightValue, color: COLORS.warning}}>
                          {expenditureData.topCategory || 'Not Available'}
                        </span>
                      </div>
                    </div>

                    <div style={styles.insightCard}>
                      <div style={{ ...styles.insightIcon, background: COLORS.secondaryLight }}>
                        <i className="fas fa-list-ul" style={{ color: COLORS.secondary, fontSize: '20px' }}></i>
                      </div>
                      <div>
                        <span style={styles.insightLabel}>Total Transactions</span>
                        <span style={{...styles.insightValue, color: COLORS.secondary}}>
                          {expenditureData.transactionCount || 0}
                        </span>
                      </div>
                    </div>

                    {expenditureData.categoryBreakdown && Object.keys(expenditureData.categoryBreakdown).length > 0 && (
                      <div style={styles.categoryBreakdown}>
                        <h4 style={styles.categoryBreakdownTitle}>
                          <i className="fas fa-pie-chart"></i>
                          Category Breakdown
                        </h4>
                        {Object.entries(expenditureData.categoryBreakdown).map(([category, amount]) => (
                          <div key={category} style={styles.categoryItem}>
                            <span style={styles.categoryName}>{category}</span>
                            <span style={styles.categoryAmount}>CFA {amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  !fileAnalysis && (
                    <div style={styles.emptyState}>
                      <i className="fas fa-chart-pie" style={{ fontSize: '64px', color: COLORS.gray[300], marginBottom: '16px' }}></i>
                      <p style={styles.emptyStateText}>No expenditure data available</p>
                      <span style={styles.emptyStateSub}>Try logging some transactions or upload a file</span>
                    </div>
                  )
                )}

                {fileAnalysis && fileAnalysis.transactions && fileAnalysis.transactions.length > 0 && (
                  <div style={styles.transactionPreview}>
                    <h4 style={styles.transactionPreviewTitle}>
                      <i className="fas fa-list"></i>
                      Recent SMS Transactions ({fileAnalysis.transactions.length} total)
                    </h4>
                    <div style={styles.transactionList}>
                      {fileAnalysis.transactions.slice(0, 15).map((t, idx) => (
                        <div key={idx} style={styles.transactionItem}>
                          <span style={styles.transactionDate}>{t.date}</span>
                          <span style={styles.transactionDesc}>{t.description || t.transactionType}</span>
                          <span style={{
                            ...styles.transactionAmount,
                            color: t.isIncome ? COLORS.success : COLORS.danger
                          }}>
                            {t.isIncome ? '+' : '-'}CFA {t.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          {/* File Upload Widget */}
          <div style={styles.widgetCard}>
            <h3 style={styles.widgetTitle}>
              <i className="fas fa-upload" style={{ color: COLORS.primary }}></i>
              Upload Data
            </h3>
            <div 
              style={styles.uploadArea}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = COLORS.primary; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = COLORS.gray[300]; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = COLORS.gray[300];
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                  const file = files[0];
                  const inputEvent = { target: { files: [file] } };
                  handleFileUpload(inputEvent);
                }
              }}
            >
              <i className="fas fa-cloud-upload-alt" style={{ fontSize: '40px', color: COLORS.primary, marginBottom: '12px' }}></i>
              <p style={styles.uploadText}>Upload Excel or CSV</p>
              <p style={styles.uploadSubtext}>Click or drag & drop</p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                disabled={loading}
              />
            </div>
            {uploadedFile && (
              <div style={styles.uploadedFile}>
                <i className="fas fa-file-excel" style={{ color: COLORS.success }}></i>
                <div style={styles.uploadedFileInfo}>
                  <span style={styles.uploadedFileName}>{uploadedFile.name}</span>
                  <span style={styles.uploadedFileSize}>{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                </div>
                <button 
                  onClick={() => setUploadedFile(null)}
                  style={styles.uploadedFileRemove}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          <div style={styles.widgetCard}>
            <h3 style={styles.widgetTitle}>
              <i className="fas fa-bolt" style={{ color: COLORS.warning }}></i>
              Quick Questions
            </h3>
            <div style={styles.quickQuestions}>
              {[
                { icon: 'fa-chart-bar', text: 'What are my top spending categories?' },
                { icon: 'fa-wallet', text: 'How much did I spend this month?' },
                { icon: 'fa-lightbulb', text: 'Where can I save the most?' },
                { icon: 'fa-trend-up', text: 'What is my spending trend?' }
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveTab('chat');
                    setInputValue(q.text);
                    setTimeout(() => {
                      const input = document.querySelector('input[type="text"]');
                      if (input) input.focus();
                    }, 100);
                  }}
                  style={styles.quickQuestionBtn}
                >
                  <i className={`fas ${q.icon}`} style={{ color: COLORS.primary }}></i>
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats Widget */}
          <div style={styles.widgetCard}>
            <h3 style={styles.widgetTitle}>
              <i className="fas fa-info-circle" style={{ color: COLORS.secondary }}></i>
              Session Info
            </h3>
            <div style={styles.sessionInfo}>
              <div style={styles.sessionItem}>
                <span style={styles.sessionLabel}>Messages</span>
                <span style={styles.sessionValue}>{messages.length}</span>
              </div>
              <div style={styles.sessionItem}>
                <span style={styles.sessionLabel}>File Uploaded</span>
                <span style={styles.sessionValue}>{uploadedFile ? '✅' : '❌'}</span>
              </div>
              <div style={styles.sessionItem}>
                <span style={styles.sessionLabel}>Data Available</span>
                <span style={styles.sessionValue}>{expenditureData ? '✅' : '❌'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframes for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-10px); }
        }
        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        
        .chat-input:focus {
          border-color: ${COLORS.primary} !important;
          box-shadow: 0 0 0 3px ${COLORS.primaryLight} !important;
        }
        
        .send-button:hover:not(:disabled) {
          background: ${COLORS.primaryDark} !important;
          transform: scale(1.05);
        }
        
        .quick-question-btn:hover {
          background: ${COLORS.primaryLight} !important;
          border-color: ${COLORS.primary} !important;
          transform: translateX(4px);
        }
        
        .message-bubble-bot {
          border-bottom-left-radius: 4px;
        }
        
        .message-bubble-user {
          border-bottom-right-radius: 4px;
        }
        
        .upload-area:hover {
          border-color: ${COLORS.primary} !important;
          background: ${COLORS.primaryLight} !important;
        }
        
        .status-dot {
          animation: pulse 2s infinite;
        }
        
        .clear-history-button:hover {
          background: ${COLORS.danger} !important;
          color: ${COLORS.white} !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
        }
      `}</style>
    </div>
  );
}

// Styles
const styles = {
  container: {
    padding: '28px',
    maxWidth: '1440px',
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
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
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
    letterSpacing: '-0.5px',
  },
  subtitle: {
    margin: '4px 0 0 0',
    color: COLORS.gray[500],
    fontSize: '14px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  clearHistoryButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: COLORS.dangerLight,
    border: `1px solid ${COLORS.danger}`,
    borderRadius: '20px',
    color: COLORS.danger,
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    background: COLORS.successLight,
    borderRadius: '20px',
    border: `1px solid ${COLORS.success}`,
  },
  statusDot: {
    width: '8px',
    height: '8px',
    background: COLORS.success,
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.success,
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    background: COLORS.primaryLight,
    borderRadius: '20px',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.primary,
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '24px',
    height: 'calc(100vh - 200px)',
  },
  chatContainer: {
    background: COLORS.white,
    borderRadius: '16px',
    border: `1px solid ${COLORS.gray[200]}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  tabsContainer: {
    display: 'flex',
    borderBottom: `1px solid ${COLORS.gray[200]}`,
    background: COLORS.gray[50],
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    padding: '14px 20px',
    background: 'transparent',
    border: 'none',
    borderBottom: `3px solid transparent`,
    color: COLORS.gray[500],
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: COLORS.primary,
    borderBottomColor: COLORS.primary,
    background: COLORS.white,
  },
  contentArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  messageWrapper: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    animation: 'fadeIn 0.3s ease',
  },
  messageWrapperUser: {
    flexDirection: 'row-reverse',
  },
  messageWrapperBot: {
    flexDirection: 'row',
  },
  avatarBot: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarUser: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: COLORS.gray[200],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarUserText: {
    fontSize: '14px',
    fontWeight: '700',
    color: COLORS.gray[600],
  },
  messageBubble: {
    maxWidth: '75%',
    padding: '14px 18px',
    borderRadius: '12px',
    wordWrap: 'break-word',
    lineHeight: '1.6',
  },
  messageBubbleBot: {
    background: COLORS.gray[50],
    color: COLORS.gray[900],
    borderTopLeftRadius: '4px',
  },
  messageBubbleUser: {
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.secondary})`,
    color: COLORS.white,
    borderTopRightRadius: '4px',
  },
  messageText: {
    margin: 0,
    fontSize: '14px',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.6',
  },
  messageTime: {
    display: 'block',
    marginTop: '6px',
    fontSize: '11px',
    opacity: 0.6,
  },
  typingBubble: {
    background: COLORS.gray[50],
    padding: '12px 18px',
  },
  typingDots: {
    display: 'flex',
    gap: '6px',
    padding: '4px 0',
  },
  typingDot: {
    width: '8px',
    height: '8px',
    background: COLORS.gray[400],
    borderRadius: '50%',
    animation: 'bounce 1.4s infinite',
  },
  inputArea: {
    padding: '16px 20px',
    borderTop: `1px solid ${COLORS.gray[200]}`,
    background: COLORS.gray[50],
    flexShrink: 0,
  },
  inputWrapper: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    padding: '12px 16px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '10px',
    fontSize: '14px',
    background: COLORS.white,
    color: COLORS.gray[900],
    outline: 'none',
    transition: 'all 0.2s',
  },
  sendButton: {
    padding: '12px 20px',
    background: COLORS.primary,
    border: 'none',
    borderRadius: '10px',
    color: COLORS.white,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimer: {
    margin: '8px 0 0 0',
    fontSize: '11px',
    color: COLORS.gray[400],
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
  },
  insightsContainer: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto',
    flex: 1,
  },
  insightCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: COLORS.gray[50],
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  insightIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  insightLabel: {
    display: 'block',
    fontSize: '12px',
    color: COLORS.gray[500],
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  insightValue: {
    display: 'block',
    fontSize: '18px',
    fontWeight: '700',
    marginTop: '2px',
  },
  categoryBreakdown: {
    background: COLORS.gray[50],
    borderRadius: '12px',
    padding: '16px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  categoryBreakdownTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.gray[700],
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  categoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: `1px solid ${COLORS.gray[100]}`,
    fontSize: '13px',
  },
  categoryName: {
    color: COLORS.gray[600],
  },
  categoryAmount: {
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 0',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: '16px',
    fontWeight: '600',
    color: COLORS.gray[700],
    margin: 0,
  },
  emptyStateSub: {
    fontSize: '13px',
    color: COLORS.gray[400],
    marginTop: '4px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  widgetCard: {
    background: COLORS.white,
    borderRadius: '16px',
    border: `1px solid ${COLORS.gray[200]}`,
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  widgetTitle: {
    margin: '0 0 16px 0',
    fontSize: '15px',
    fontWeight: '600',
    color: COLORS.gray[900],
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  uploadArea: {
    padding: '32px 16px',
    border: `2px dashed ${COLORS.gray[300]}`,
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: COLORS.gray[50],
  },
  uploadText: {
    margin: '0 0 4px 0',
    fontWeight: '600',
    color: COLORS.gray[700],
    fontSize: '14px',
  },
  uploadSubtext: {
    margin: 0,
    fontSize: '12px',
    color: COLORS.gray[400],
  },
  uploadedFile: {
    marginTop: '12px',
    padding: '12px',
    background: COLORS.successLight,
    border: `1px solid ${COLORS.success}`,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  uploadedFileInfo: {
    flex: 1,
  },
  uploadedFileName: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: COLORS.success,
  },
  uploadedFileSize: {
    display: 'block',
    fontSize: '11px',
    color: COLORS.gray[500],
  },
  uploadedFileRemove: {
    padding: '4px 8px',
    border: 'none',
    background: 'transparent',
    color: COLORS.gray[500],
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'all 0.2s',
  },
  quickQuestions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  quickQuestionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: COLORS.gray[50],
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    color: COLORS.gray[700],
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'left',
  },
  sessionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sessionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: `1px solid ${COLORS.gray[100]}`,
    fontSize: '13px',
  },
  sessionLabel: {
    color: COLORS.gray[500],
  },
  sessionValue: {
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  smsSummaryContainer: {
    marginBottom: '20px',
    background: COLORS.white,
    padding: '20px',
    borderRadius: '16px',
    border: `1px solid ${COLORS.gray[200]}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  smsSummaryTitle: {
    margin: '0 0 16px 0',
    fontSize: '15px',
    fontWeight: '600',
    color: COLORS.gray[900],
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  smsGrid: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  transactionPreview: {
    background: COLORS.white,
    borderRadius: '12px',
    padding: '16px',
    border: `1px solid ${COLORS.gray[200]}`,
    marginTop: '16px',
  },
  transactionPreviewTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: COLORS.gray[700],
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  transactionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  transactionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: `1px solid ${COLORS.gray[100]}`,
    fontSize: '13px',
  },
  transactionDate: {
    color: COLORS.gray[500],
    minWidth: '80px',
  },
  transactionDesc: {
    flex: 1,
    color: COLORS.gray[700],
    margin: '0 8px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  transactionAmount: {
    fontWeight: '600',
    minWidth: '80px',
    textAlign: 'right',
  },
};

// Inject keyframes
if (typeof document !== 'undefined') {
  const styleId = 'chatbot-analytics-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-10px); }
      }
      
      .messages-container::-webkit-scrollbar {
        width: 6px;
      }
      .messages-container::-webkit-scrollbar-track {
        background: transparent;
      }
      .messages-container::-webkit-scrollbar-thumb {
        background: ${COLORS.gray[300]};
        border-radius: 3px;
      }
      .messages-container::-webkit-scrollbar-thumb:hover {
        background: ${COLORS.gray[400]};
      }
      
      @media (max-width: 1024px) {
        .main-grid {
          grid-template-columns: 1fr !important;
        }
        .sidebar {
          flex-direction: row !important;
          flex-wrap: wrap !important;
        }
        .sidebar > * {
          flex: 1 !important;
          min-width: 280px !important;
        }
      }
      
      @media (max-width: 640px) {
        .header {
          flex-direction: column !important;
          text-align: center !important;
        }
        .header-left {
          flex-direction: column !important;
        }
        .header-right {
          flex-wrap: wrap !important;
          justify-content: center !important;
        }
        .message-bubble {
          max-width: 90% !important;
        }
        .container {
          padding: 16px !important;
        }
      }
    `;
    document.head.appendChild(styleSheet);
  }
}