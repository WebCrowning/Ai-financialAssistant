import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ShieldCheck, ToggleLeft, ToggleRight, Send, User, Bot, Zap } from 'lucide-react';

export default function AIAssistant({ token, userSettings, onSettingsUpdate }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'bot',
      text: "Hello! I'm your FinVision AI Financial Advisor. Ask me anything about your budgets, savings goals, or bills optimization!"
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/assistant/insights', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setInsights(data);
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [token, userSettings.guardian_mode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const toggleGuardianMode = async () => {
    const nextVal = userSettings.guardian_mode === 1 ? 0 : 1;
    try {
      const response = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ guardian_mode: nextVal })
      });

      if (response.ok) {
        onSettingsUpdate({ ...userSettings, guardian_mode: nextVal });
      }
    } catch (err) {
      console.error('Error toggling guardian mode:', err);
    }
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatHistory(prev => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput('');
    setChatLoading(true);

    setTimeout(() => {
      let reply = "";
      const lowerMsg = userMessage.toLowerCase();

      if (lowerMsg.includes('laptop') || lowerMsg.includes('goal') || lowerMsg.includes('save') || lowerMsg.includes('target')) {
        reply = "Analyzing goals... You have active savings targets (like New Laptop and iPhone 17). To accelerate completion, I suggest allocating CFA 15,000 from your overspent Food budget or establishing automatic direct-debits on payday to lock in savings.";
      } else if (lowerMsg.includes('food') || lowerMsg.includes('overspent') || lowerMsg.includes('budget') || lowerMsg.includes('limit')) {
        reply = "Reviewing budgets... Your Food budget has exceeded the recommended threshold by CFA 15,500. I suggest planning meals, using local supermarkets instead of dining delivery services, and keeping your Guardian Shield active to prevent impulse transactions.";
      } else if (lowerMsg.includes('bill') || lowerMsg.includes('subscription') || lowerMsg.includes('utility')) {
        reply = "Reviewing bills: I recommend canceling the unused Fitness App to save CFA 180,000/year and optimizing your fiber internet plan.";
      } else if (lowerMsg.includes('invest') || lowerMsg.includes('stocks') || lowerMsg.includes('shares')) {
        reply = "Investment strategy: With a 15% savings margin, consider allocating CFA 20,000/month to liquid money market funds yielding 10-12% annually.";
      } else if (lowerMsg.includes('guardian') || lowerMsg.includes('shield')) {
        reply = "The Guardian Shield blocks unauthorized transactions exceeding your set limits by 50% and flags duplicate subscription alerts.";
      } else {
        reply = "Your net balance is negative by CFA 2,098. Expenses exceed income. Main expense categories: transfers (CFA 27,489), airtime (CFA 11,199). Consider budgeting and reducing discretionary spending.";
      }

      setChatHistory(prev => [...prev, { sender: 'bot', text: reply }]);
      setChatLoading(false);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="ai-assistant-wrapper">
        <div className="ai-loading-container">
          <div className="ai-loading-spinner-wrapper">
            <div className="ai-loading-spinner"></div>
            <Sparkles className="ai-loading-sparkle" />
          </div>
          <p className="ai-loading-title">Analyzing financial graphs and generating predictive schedules...</p>
          <p className="ai-loading-subtitle">This may take a few moments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-assistant-wrapper">
      <div className="ai-assistant-container">
        {/* Header */}
        <header className="ai-header">
          <div className="ai-header-left">
            <div className="ai-header-icon-wrapper">
              <Bot className="ai-header-icon" />
            </div>
            <div className="ai-header-text">
              <h1 className="ai-header-title">FinVision AI</h1>
              <p className="ai-header-subtitle">Financial Intelligence Assistant</p>
            </div>
          </div>

          <div className="ai-header-right">
            <div className="ai-guardian-toggle">
              <ShieldCheck className={`ai-guardian-icon ${userSettings.guardian_mode ? 'active' : 'inactive'}`} />
              <span className={`ai-guardian-label ${userSettings.guardian_mode ? 'active' : 'inactive'}`}>
                Guardian {userSettings.guardian_mode ? 'Active' : 'Inactive'}
              </span>
              <button onClick={toggleGuardianMode} className="ai-guardian-button">
                {userSettings.guardian_mode ? (
                  <ToggleRight className="ai-toggle-on" />
                ) : (
                  <ToggleLeft className="ai-toggle-off" />
                )}
              </button>
            </div>
            <div className="ai-status-badge">
              <Zap className="ai-status-icon" />
              <span className="ai-status-text">Online</span>
            </div>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="ai-chat-messages">
          {chatHistory.map((chat, idx) => (
            <div key={idx} className={`ai-message-wrapper ${chat.sender}`}>
              {chat.sender === 'bot' && (
                <div className="ai-avatar ai-bot-avatar">
                  <Bot className="ai-avatar-icon" />
                </div>
              )}

              <div className={`ai-message-bubble ${chat.sender}`}>
                <div className="ai-message-text">
                  {renderCleanMessageContent(chat.text)}
                </div>
              </div>

              {chat.sender === 'user' && (
                <div className="ai-avatar ai-user-avatar">
                  <User className="ai-avatar-icon" />
                </div>
              )}
            </div>
          ))}

          {chatLoading && (
            <div className="ai-message-wrapper bot">
              <div className="ai-avatar ai-bot-avatar">
                <Bot className="ai-avatar-icon" />
              </div>
              <div className="ai-message-bubble bot ai-loading-bubble">
                <div className="ai-loading-dots">
                  <div className="ai-dot"></div>
                  <div className="ai-dot"></div>
                  <div className="ai-dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="ai-input-area">
          <form onSubmit={handleSendMessage} className="ai-input-form">
            <div className="ai-input-wrapper">
              <input
                type="text"
                placeholder="Ask about budgets, savings, bills optimization..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
                className="ai-chat-input"
              />
            </div>
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="ai-send-button"
            >
              <Send className="ai-send-icon" />
              <span className="ai-send-text">Send</span>
            </button>
          </form>
          <p className="ai-disclaimer">FinVision AI may provide financial guidance. Always verify important decisions.</p>
        </div>
      </div>
    </div>
  );
}