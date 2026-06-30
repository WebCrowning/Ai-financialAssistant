import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';

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

// Parse individual SMS content
function parseSMSContent(content, date, time) {
  if (!content) return null;
  const text = content.toLowerCase();

  const result = {
    transactionType: 'unknown',
    amount: 0,
    fee: 0,
    balance: 0,
    sender: '',
    receiver: '',
    description: '',
    isIncome: false,
    isExpense: false,
    category: 'Other'
  };

  const parseAmount = (matchStr) => {
    if (!matchStr) return 0;
    return parseFloat(matchStr.replace(/,/g, '').replace(/\s/g, '')) || 0;
  };

  // Balance Inquiry
  if (text.includes('current balance') && text.includes('available balance')) {
    const balanceMatch = text.match(/(?:current|available)\s*balance[:\s]*([\d,.]+)/i) || text.match(/(?:current balance|available balance)[:\s]*([\d,.]+)/i);
    if (balanceMatch) {
      result.balance = parseAmount(balanceMatch[1]);
      result.transactionType = 'balance_check';
      result.description = 'Balance Inquiry';
      result.category = 'Balance';
      return result;
    }
  }

  // Received payment / deposit received
  if (
    text.includes('you have received') ||
    text.includes('received from') ||
    text.includes('has sent you') ||
    text.includes('deposit of') ||
    text.includes('deposited by')
  ) {
    const amountMatch = text.match(/(?:received|sent you|deposit of|deposited by)\s*(?:of)?\s*(?:fcfa|xaf)?\s*([\d,.]+)\s*(?:xaf|fcfa|fcf a)?/i) ||
      text.match(/(?:received|sent you|deposit of|deposited by)\s*([\d,.]+)/i);

    let amount = 0;
    if (amountMatch) amount = parseAmount(amountMatch[1]);

    if (amount > 0) {
      result.amount = amount;
      result.transactionType = 'receive';
      result.isIncome = true;
      result.isExpense = false;
      result.description = 'Received Money';

      const senderMatch = text.match(/(?:from|of|by)\s+([^(\d]+)(?:\(|on|ref:)/i) ||
        text.match(/(?:from|by)\s+([a-zA-Z\s]+)\b/i);
      if (senderMatch) {
        result.sender = senderMatch[1].trim();
        result.description = `Received from ${senderMatch[1].trim()}`;
      }

      const balanceMatch = text.match(/(?:new balance|balance)[:\s]*([\d,.]+)/i);
      if (balanceMatch) {
        result.balance = parseAmount(balanceMatch[1]);
      }

      if (text.includes('betpawa') || text.includes('gaming') || text.includes('1xbet') || text.includes('ennovative')) {
        result.category = 'Gaming/Betting';
        result.description = 'Betpawa/Gaming Withdrawal';
      } else if (text.includes('transfer') || text.includes('momo')) {
        result.category = 'Transfer';
      } else {
        result.category = 'Received Payment';
      }
      return result;
    }
  }

  // Merchant payments / transaction of X by Y
  if (text.includes('transaction of')) {
    const amountMatch = text.match(/transaction\s+of\s*(?:fcfa|xaf)?\s*([\d,.]+)\s*(?:xaf|fcfa|fcf a)?/i) ||
      text.match(/transaction\s+of\s*([\d,.]+)/i);
    let amount = 0;
    if (amountMatch) amount = parseAmount(amountMatch[1]);

    if (amount > 0) {
      result.amount = amount;
      result.transactionType = 'payment';
      result.isIncome = false;
      result.isExpense = true;

      const receiverMatch = text.match(/by\s+([^(\d]+)(?:\(|on|ref:)/i) ||
        text.match(/by\s+([a-zA-Z\s_]+)\b/i);
      if (receiverMatch) {
        result.receiver = receiverMatch[1].trim();
        result.description = `Transaction via ${receiverMatch[1].trim()}`;
      } else {
        result.description = 'Mobile Money Transaction';
      }

      const feeMatch = text.match(/fee\s+was\s*([\d,.]+)\s*(?:xaf|fcfa|fcf a)?/i);
      if (feeMatch) {
        result.fee = parseAmount(feeMatch[1]);
      }

      const balanceMatch = text.match(/(?:new balance|balance)[:\s]*([\d,.]+)/i);
      if (balanceMatch) {
        result.balance = parseAmount(balanceMatch[1]);
      }

      if (text.includes('bundles') || text.includes('airtime') || text.includes('bundle') || text.includes('internet')) {
        result.category = 'Airtime/Bundles';
      } else if (text.includes('betpawa') || text.includes('gaming') || text.includes('1xbet') || text.includes('ennovative')) {
        result.category = 'Gaming/Betting';
      } else if (text.includes('transfer') || text.includes('transferred')) {
        result.category = 'Transfer';
      } else {
        result.category = 'Payment';
      }

      return result;
    }
  }

  // Payment / transfer / withdrawal / purchase / platform transfer
  if (
    text.includes('your payment of') ||
    text.includes('you have transferred') ||
    text.includes('you have withdrawn') ||
    text.includes('payment of') ||
    text.includes('transferred to') ||
    text.includes('withdrawn from') ||
    text.includes('purchase of') ||
    text.includes('purchased') ||
    text.includes('withdrawal of') ||
    text.includes('pay to')
  ) {
    const amountMatch = text.match(/(?:payment|transfer|withdrawn|transferred|withdrew|purchase|purchased|withdrawal|pay)\s*(?:of)?\s*(?:fcfa|xaf)?\s*([\d,.]+)\s*(?:xaf|fcfa|fcf a)?/i) ||
      text.match(/(?:payment|transfer|withdrawn|transferred|withdrew|purchase|purchased|withdrawal|pay)\s*(?:of)?\s*(?:fcfa|xaf)?\s*([\d,.]+)/i);
    let amount = 0;
    if (amountMatch) amount = parseAmount(amountMatch[1]);

    if (amount > 0) {
      result.amount = amount;
      result.transactionType = (text.includes('withdraw') || text.includes('withdrawal')) ? 'withdrawal' : 'payment';
      result.isIncome = false;
      result.isExpense = true;

      const receiverMatch = text.match(/to\s+([^(\d]+)(?:\(|on|ref:)/i) ||
        text.match(/at\s+([^(\d]+)(?:\(|on|ref:)/i);
      if (receiverMatch) {
        result.receiver = receiverMatch[1].trim();
        result.description = result.transactionType === 'withdrawal' ? `Cash Withdrawal at ${receiverMatch[1].trim()}` : `Payment to ${receiverMatch[1].trim()}`;
      } else {
        result.description = result.transactionType === 'withdrawal' ? 'Cash Withdrawal' : 'Payment / Transfer';
      }

      const feeMatch = text.match(/(?:fee|charges)[:\s]*([\d,.]+)/i);
      if (feeMatch) {
        result.fee = parseAmount(feeMatch[1]);
      }

      const balanceMatch = text.match(/(?:new balance|balance)[:\s]*([\d,.]+)/i);
      if (balanceMatch) {
        result.balance = parseAmount(balanceMatch[1]);
      }

      if (text.includes('bundles') || text.includes('airtime') || text.includes('bundle') || text.includes('internet')) {
        result.category = 'Airtime/Bundles';
        result.description = 'MTN Airtime/Bundles';
      } else if (text.includes('betpawa') || text.includes('gaming') || text.includes('1xbet') || text.includes('ennovative')) {
        result.category = 'Gaming/Betting';
        result.description = 'Betpawa/Gaming Deposit';
      } else if (text.includes('transfer') || text.includes('transferred')) {
        result.category = 'Transfer';
        if (result.receiver) {
          result.description = `Transfer to ${result.receiver}`;
        }
      } else if (result.transactionType === 'withdrawal') {
        result.category = 'Withdrawal';
      } else {
        result.category = 'Payment';
      }
      return result;
    }
  }

  // Advance/loan
  if (text.includes('advance') || text.includes('xtracash') || text.includes('loan')) {
    const amountMatch = text.match(/(?:advance|loan|xtracash)\s*(?:of)?\s*(?:fcfa|xaf)?\s*([\d,.]+)/i);
    if (amountMatch) {
      result.amount = parseAmount(amountMatch[1]);
      result.transactionType = 'advance';
      result.isIncome = true;
      result.isExpense = false;
      result.category = 'Loan/Advance';
      result.description = 'Mobile Money Advance';
      return result;
    }
  }

  // Repayment
  if (text.includes('repaid from your account') || text.includes('loan repayment') || text.includes('repayment of')) {
    const amountMatch = text.match(/(?:amount|repayment|repaid)\s*(?:of)?\s*(?:fcfa|xaf)?\s*([\d,.]+)/i);
    if (amountMatch) {
      result.amount = parseAmount(amountMatch[1]);
      result.transactionType = 'repayment';
      result.isIncome = false;
      result.isExpense = true;
      result.category = 'Loan Repayment';
      result.description = 'Advance Repayment';
      return result;
    }
  }

  return null;
}

// Parse SMS Export content string
function parseSMSExport(content) {
  try {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];

    let headerIndex = -1;
    let dataStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('date') && line.includes('time') && line.includes('direction') && line.includes('content')) {
        headerIndex = i;
        dataStartIndex = i + 1;
        break;
      }
    }

    if (headerIndex === -1) {
      return parseSMSByPattern(lines);
    }

    let delimiter = '|';
    const headerLine = lines[headerIndex];
    if (headerLine.includes('|')) {
      delimiter = '|';
    } else if (headerLine.includes(',')) {
      delimiter = ',';
    } else if (headerLine.includes('\t')) {
      delimiter = '\t';
    }

    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase());
    const dateIdx = headers.indexOf('date');
    const timeIdx = headers.indexOf('time');
    const directionIdx = headers.indexOf('direction');
    const contactIdx = headers.indexOf('contact');
    const phoneIdx = headers.indexOf('phone');
    const contentIdx = headers.indexOf('content');
    const typeIdx = headers.indexOf('type');

    const transactions = [];

    for (let i = dataStartIndex; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map(c => c.trim());
      if (cols.length <= Math.max(dateIdx, timeIdx, contentIdx)) continue;

      const date = cols[dateIdx] || '';
      const time = cols[timeIdx] || '';
      const direction = directionIdx !== -1 ? cols[directionIdx] : '';
      const contact = contactIdx !== -1 ? cols[contactIdx] : '';
      const phone = phoneIdx !== -1 ? cols[phoneIdx] : '';
      const contentText = cols[contentIdx] || '';
      const type = typeIdx !== -1 ? cols[typeIdx] : 'SMS';

      if (type && type.toUpperCase() !== 'SMS' && type !== '') continue;

      const parsed = parseSMSContent(contentText, date, time);
      if (parsed) {
        transactions.push({
          date,
          time,
          direction,
          contact,
          phone,
          content: contentText,
          type,
          ...parsed
        });
      }
    }

    return transactions;
  } catch (error) {
    console.error('Error parsing SMS export:', error);
    return [];
  }
}

function parseSMSByPattern(lines) {
  const transactions = [];
  let currentDate = '';
  let currentTime = '';

  for (const line of lines) {
    const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      currentDate = dateMatch[1];
    }

    const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
    if (timeMatch) {
      currentTime = timeMatch[1];
    }

    const lineLower = line.toLowerCase();
    if (
      lineLower.includes('mobilemoney') ||
      lineLower.includes('momo') ||
      lineLower.includes('received') ||
      lineLower.includes('transferred') ||
      lineLower.includes('payment of') ||
      lineLower.includes('withdrawn')
    ) {
      const parsed = parseSMSContent(line, currentDate, currentTime);
      if (parsed) {
        transactions.push({
          date: currentDate,
          time: currentTime,
          direction: parsed.isIncome ? 'Received' : 'Sent',
          contact: 'MobileMoney',
          phone: 'MobileMoney',
          content: line,
          type: 'SMS',
          ...parsed
        });
      }
    }
  }

  return transactions;
}

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
  }, [user]);

  const fetchChatHistory = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('chatbot_conversations')
        .select('query, response, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

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
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const handleClearChat = async () => {
    if (!user?.id) return;
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      try {
        const { error } = await supabase
          .from('chatbot_conversations')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;

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
      } catch (error) {
        console.error('Error clearing chat history:', error);
      }
    }
  };

  const fetchExpenditureData = async () => {
    if (!user?.id) return;
    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();

      let { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', firstDayOfMonth)
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      if (!transactions || transactions.length === 0) {
        const { data: fallbackTxns, error: fallbackErr } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })
          .limit(500);

        if (fallbackErr) throw fallbackErr;
        transactions = fallbackTxns || [];
      }

      if (transactions.length === 0) {
        setExpenditureData({
          totalExpenditure: 0,
          averageDaily: 0,
          topCategory: 'No data',
          transactionCount: 0
        });
        return;
      }

      const totalExpenditure = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      const uniqueDays = new Set(transactions.map(t =>
        new Date(t.transaction_date).toDateString()
      )).size;

      const averageDaily = uniqueDays > 0 ? totalExpenditure / uniqueDays : totalExpenditure;

      const categoryTotals = {};
      transactions.forEach(t => {
        const category = t.category || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(t.amount || 0);
      });

      const topCategory = Object.keys(categoryTotals).length > 0
        ? Object.keys(categoryTotals).reduce((a, b) =>
          categoryTotals[a] > categoryTotals[b] ? a : b
        )
        : 'Not available';

      setExpenditureData({
        totalExpenditure: parseFloat(totalExpenditure.toFixed(2)),
        averageDaily: parseFloat(averageDaily.toFixed(2)),
        topCategory,
        transactionCount: transactions.length,
        distinctDays: uniqueDays,
        categoryBreakdown: categoryTotals
      });

    } catch (error) {
      console.error('Error fetching expenditure data:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!user?.id) return;

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

    const parseFile = () => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        if (fileExt === 'xlsx' || fileExt === 'xls') {
          reader.readAsArrayBuffer(file);
          reader.onload = (event) => {
            try {
              const data = new Uint8Array(event.target.result);
              const workbook = XLSX.read(data, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              const sheet = workbook.Sheets[sheetName];
              const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
              
              let headerIndex = -1;
              for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (Array.isArray(row)) {
                  const rowStr = row.map(cell => String(cell || '').toLowerCase()).join('|');
                  if (rowStr.includes('date') && rowStr.includes('time') && rowStr.includes('direction') && rowStr.includes('content')) {
                    headerIndex = i;
                    break;
                  }
                }
              }

              if (headerIndex === -1) {
                reject(new Error('Could not find header row in Excel file'));
                return;
              }

              const headers = rows[headerIndex].map(h => String(h || '').trim().toLowerCase());
              const dateIdx = headers.indexOf('date');
              const timeIdx = headers.indexOf('time');
              const directionIdx = headers.indexOf('direction');
              const contactIdx = headers.indexOf('contact');
              const phoneIdx = headers.indexOf('phone');
              const contentIdx = headers.indexOf('content');
              const typeIdx = headers.indexOf('type');

              const transactionsList = [];

              for (let i = headerIndex + 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row || row.length === 0) continue;

                const date = dateIdx !== -1 ? String(row[dateIdx] || '').trim() : '';
                const time = timeIdx !== -1 ? String(row[timeIdx] || '').trim() : '';
                const direction = directionIdx !== -1 ? String(row[directionIdx] || '').trim() : '';
                const contact = contactIdx !== -1 ? String(row[contactIdx] || '').trim() : '';
                const phone = phoneIdx !== -1 ? String(row[phoneIdx] || '').trim() : '';
                const contentText = contentIdx !== -1 ? String(row[contentIdx] || '').trim() : '';
                const type = typeIdx !== -1 ? String(row[typeIdx] || '').trim() : 'SMS';

                if (!contentText) continue;

                const parsed = parseSMSContent(contentText, date, time);
                if (parsed) {
                  transactionsList.push({
                    date,
                    time,
                    direction,
                    contact,
                    phone,
                    content: contentText,
                    type,
                    ...parsed
                  });
                }
              }

              resolve(transactionsList);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = (err) => reject(err);
        } else {
          reader.readAsText(file);
          reader.onload = (event) => {
            try {
              const content = event.target.result;
              const transactionsList = parseSMSExport(content);
              resolve(transactionsList);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = (err) => reject(err);
        }
      });
    };

    try {
      const parsedTransactions = await parseFile();
      setFileData(file);

      // Check for duplicate to avoid multiple inserts of the same transaction
      const { data: existingTxns, error: fetchErr } = await supabase
        .from('transactions')
        .select('amount, transaction_date, description')
        .eq('user_id', user.id);

      if (fetchErr) throw fetchErr;

      const toInsert = [];
      for (const t of parsedTransactions) {
        let dbDate = new Date();
        if (t.date) {
          const parsedDate = new Date(t.date);
          if (!isNaN(parsedDate.getTime())) {
            dbDate = parsedDate;
          }
        }
        const dbDateISO = dbDate.toISOString();
        const category = t.category || 'Other';
        const description = t.description || t.content || 'SMS Transaction';
        const amount = t.amount || 0;
        const type = t.isIncome ? 'credit' : 'debit';

        const isDuplicate = (existingTxns || []).some(e => {
          return Math.abs(parseFloat(e.amount) - amount) < 0.01 &&
                 new Date(e.transaction_date).getTime() === new Date(dbDateISO).getTime() &&
                 e.description === description;
        });

        if (!isDuplicate) {
          toInsert.push({
            user_id: user.id,
            amount,
            category,
            description,
            transaction_date: dbDateISO,
            transaction_type: type,
            account: 'MTN Mobile Money'
          });
        }
      }

      if (toInsert.length > 0) {
        const { error: insertErr } = await supabase
          .from('transactions')
          .insert(toInsert);
        if (insertErr) throw insertErr;
      }

      // Calculate summary statistics
      const totalIncome = parsedTransactions
        .filter(t => t.isIncome)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = parsedTransactions
        .filter(t => t.isExpense)
        .reduce((sum, t) => sum + t.amount, 0);

      const netBalance = totalIncome - totalExpenses;

      const categoryBreakdown = {};
      parsedTransactions.forEach(t => {
        const cat = t.category || 'Other';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + t.amount;
      });

      const contacts = {};
      parsedTransactions.forEach(t => {
        if (t.sender) contacts[t.sender] = (contacts[t.sender] || 0) + t.amount;
        if (t.receiver) contacts[t.receiver] = (contacts[t.receiver] || 0) + t.amount;
      });

      const sortedContacts = Object.entries(contacts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const summary = {
        totalTransactions: parsedTransactions.length,
        totalIncome,
        totalExpenses,
        netBalance,
        categoryBreakdown,
        topContacts: sortedContacts,
        dateRange: {
          start: parsedTransactions.length > 0 ? parsedTransactions[parsedTransactions.length - 1].date : null,
          end: parsedTransactions.length > 0 ? parsedTransactions[0].date : null
        }
      };

      const result = {
        success: true,
        fileName: file.name,
        fileSize: file.size,
        recordCount: parsedTransactions.length,
        transactions: parsedTransactions,
        summary
      };

      setFileAnalysis(result);
      addMessage('bot', `✅ I've successfully uploaded your file with ${result.recordCount || 'multiple'} records. I can now analyze your data. What would you like to know?`);
      await fetchExpenditureData();
    } catch (error) {
      console.error('Error processing upload:', error);
      addMessage('bot', 'I had trouble processing your file. Please ensure it has standard financial columns.');
    } finally {
      setLoading(false);
    }
  };

  const addMessage = (type, content) => {
    setMessages(prev => [...prev, { id: prev.length + 1, type, content, timestamp: new Date() }]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!user?.id) return;

    const userQuery = inputValue;
    addMessage('user', userQuery);
    setInputValue('');
    setLoading(true);
    setIsTyping(true);

    try {
      const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

      if (!openRouterApiKey) {
        addMessage('bot',
          '⚠️ **AI Service Not Configured**\n\n' +
          'The environment variable `VITE_OPENROUTER_API_KEY` is missing or empty.\n\n' +
          '**To fix this:**\n' +
          '• **Locally:** Add `VITE_OPENROUTER_API_KEY=sk-or-v1-...` to `frontend/.env`, then restart the dev server.\n' +
          '• **Vercel:** Go to Project Settings → Environment Variables → add `VITE_OPENROUTER_API_KEY` → Redeploy.'
        );
        return;
      }

      // Build context for AI with various data sources
      let context = `You are a financial advisor AI assistant helping users understand their financial situation, including SMS transactions, website store purchases, manually recorded expenses, and income.\n\n`;

      let activeTransactions = [];

      // Check if we have fileAnalysis
      if (fileAnalysis && fileAnalysis.transactions && fileAnalysis.transactions.length > 0) {
        activeTransactions = fileAnalysis.transactions;
      } else {
        // Fetch database transactions, expenses, income, orders
        const { data: dbTransactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })
          .limit(200);

        const { data: dbExpenses } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(100);

        const { data: dbIncome } = await supabase
          .from('income')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(50);

        const { data: dbOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        const mappedTransactions = (dbTransactions || []).map(t => ({
          date: t.transaction_date,
          amount: parseFloat(t.amount),
          category: t.category || 'Transaction',
          description: t.description,
          isIncome: t.transaction_type === 'credit',
          isExpense: t.transaction_type === 'debit',
          transactionType: t.transaction_type === 'credit' ? 'receive' : 'payment',
          source: 'SMS/Bank'
        }));

        const mappedExpenses = (dbExpenses || []).map(e => ({
          date: e.date,
          amount: parseFloat(e.amount),
          category: e.category || 'Expense',
          description: e.description,
          isIncome: false,
          isExpense: true,
          transactionType: 'payment',
          source: 'Manual Expense'
        }));

        const mappedIncome = (dbIncome || []).map(i => ({
          date: i.date,
          amount: parseFloat(i.amount),
          category: i.category || 'Income',
          description: i.source,
          isIncome: true,
          isExpense: false,
          transactionType: 'receive',
          source: 'Income Record'
        }));

        const mappedOrders = (dbOrders || []).map(o => {
          let items = [];
          try { items = typeof o.items_json === 'string' ? JSON.parse(o.items_json) : (o.items_json || []); } catch (e) {}
          const desc = items.map(i => i.name).join(', ') || 'Store Purchase';
          return {
            date: o.created_at,
            amount: parseFloat(o.total_amount),
            category: 'Store Purchase',
            description: desc,
            isIncome: false,
            isExpense: true,
            transactionType: 'payment',
            source: 'Website Store'
          };
        });

        activeTransactions = [...mappedTransactions, ...mappedExpenses, ...mappedIncome, ...mappedOrders];
      }

      if (activeTransactions.length > 0) {
        const totalIncome = activeTransactions.filter(t => t.isIncome).reduce((s, t) => s + t.amount, 0);
        const totalExpenses = activeTransactions.filter(t => t.isExpense).reduce((s, t) => s + t.amount, 0);
        const netBalance = totalIncome - totalExpenses;

        context += `📊 **Financial Data Analysis Summary**\n`;
        context += `• Total Records: ${activeTransactions.length}\n`;
        context += `• Total Income: CFA ${totalIncome.toLocaleString()}\n`;
        context += `• Total Expenses: CFA ${totalExpenses.toLocaleString()}\n`;
        context += `• Net Balance: CFA ${netBalance.toLocaleString()}\n\n`;

        // Category breakdown
        const categories = {};
        activeTransactions.forEach(t => {
          const cat = t.category || 'Other';
          categories[cat] = (categories[cat] || 0) + t.amount;
        });

        context += `📂 **Category Breakdown:**\n`;
        Object.entries(categories)
          .sort((a, b) => b[1] - a[1])
          .forEach(([cat, amount]) => {
            context += `• ${cat}: CFA ${amount.toLocaleString()}\n`;
          });

        // Top transactions
        context += `\n💰 **Largest Transactions:**\n`;
        activeTransactions
          .slice()
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10)
          .forEach(t => {
            let dateStr = t.date;
            if (t.date instanceof Date) {
              dateStr = t.date.toISOString().split('T')[0];
            }
            context += `• ${dateStr}: [${t.source || 'Unknown'}] ${t.description || t.transactionType} - CFA ${t.amount.toLocaleString()}\n`;
          });

        context += `\n\nUser Query: ${userQuery}\n\n`;
        context += `Provide specific, actionable financial advice based on this comprehensive financial data (including website purchases, recorded expenses, and income).`;

      } else if (expenditureData) {
        context += `📊 **Expenditure Data:**\n`;
        context += `• Total Monthly Expenditure: CFA ${expenditureData.totalExpenditure || 0}\n`;
        context += `• Average Daily Spending: CFA ${expenditureData.averageDaily || 0}\n`;
        context += `• Top Spending Category: ${expenditureData.topCategory}\n`;
        context += `• Total Transactions: ${expenditureData.transactionCount || 0}\n\n`;
        context += `User Query: ${userQuery}\n\n`;
        context += `Provide helpful, specific financial advice based on the data provided.`;
      } else {
        context += `No financial data available yet. Please log some expenses, income, make store purchases, or upload an SMS export file.\n\n`;
        context += `User Query: ${userQuery}\n\n`;
        context += `Provide general financial advice and encourage the user to log their financial data on the website.`;
      }

      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterApiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-OpenRouter-Title': 'FinVision AI Assistant'
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: context
            },
            {
              role: 'user',
              content: userQuery
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (openRouterResponse.ok) {
        const result = await openRouterResponse.json();
        const analysis = result.choices[0]?.message?.content || 'I could not generate a response.';
        addMessage('bot', analysis);

        // Store conversation in database
        await supabase
          .from('chatbot_conversations')
          .insert({
            user_id: user.id,
            query: userQuery,
            response: analysis
          });
      } else {
        let errorData = {};
        try { errorData = await openRouterResponse.json(); } catch (_) {}
        const statusCode = openRouterResponse.status;
        const apiError = errorData?.error?.message || errorData?.message || 'No additional details returned.';
        addMessage('bot',
          `❌ **OpenRouter API Error (HTTP ${statusCode})**\n\n` +
          `**Reason:** ${apiError}\n\n` +
          (statusCode === 401
            ? '**Fix:** Your `VITE_OPENROUTER_API_KEY` is invalid or expired. Generate a new key at https://openrouter.ai/keys and update your environment variables.'
            : statusCode === 429
            ? '**Fix:** You have exceeded your OpenRouter rate limit or credit balance. Check your usage at https://openrouter.ai/activity.'
            : statusCode === 402
            ? '**Fix:** Your OpenRouter account has insufficient credits. Top up at https://openrouter.ai/credits.'
            : '**Fix:** Check the OpenRouter status page at https://status.openrouter.ai or verify your API key configuration.')
        );
      }
    } catch (error) {
      console.error('Error in send message:', error);
      addMessage('bot',
        `🔌 **Connection Error**\n\n` +
        `**Details:** ${error?.message || 'Unknown error'}\n\n` +
        'This is usually caused by a network issue or a browser CORS policy blocking the request to OpenRouter.\n\n' +
        '**To fix this:**\n' +
        '• Check your internet connection.\n' +
        '• Open the browser DevTools (F12) → Network tab → find the failed request to `openrouter.ai` and inspect the error.\n' +
        '• Ensure `VITE_OPENROUTER_API_KEY` is correctly set in your environment.'
      );
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