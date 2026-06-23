const fs = require('fs');

// Port the helper functions directly from server.js for isolated testing
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
    if (dateMatch) currentDate = dateMatch[1];
    
    const timeMatch = line.match(/(\d{2}:\d{2}:\d{2})/);
    if (timeMatch) currentTime = timeMatch[1];
    
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
  
  if (text.includes('current balance') && text.includes('available balance')) {
    const balanceMatch = text.match(/(?:current balance|available balance)[:\s]*([\d,.]+)/i);
    if (balanceMatch) {
      result.balance = parseAmount(balanceMatch[1]);
      result.transactionType = 'balance_check';
      result.description = 'Balance Inquiry';
      result.category = 'Balance';
      return result;
    }
  }
  
  if (
    text.includes('you have received') || 
    text.includes('you have received an advance') || 
    text.includes('received from') || 
    text.includes('has sent you')
  ) {
    const amountMatch = text.match(/(?:received|sent you)\s*([\d,.]+)\s*(?:xaf|fcfa|fcf a)/i) ||
                        text.match(/(?:received|sent you)\s*([\d,.]+)/i) ||
                        text.match(/(?:received an advance of)\s*([\d,.]+)/i);
    
    let amount = 0;
    if (amountMatch) amount = parseAmount(amountMatch[1]);
    
    if (amount > 0) {
      result.amount = amount;
      result.transactionType = 'receive';
      result.isIncome = true;
      result.isExpense = false;
      result.description = 'Received Money';
      
      const senderMatch = text.match(/(?:from|of)\s+([^(\d]+)(?:\(|on|ref:)/i) || 
                          text.match(/from\s+([a-zA-Z\s]+)\b/i);
      if (senderMatch) {
        result.sender = senderMatch[1].trim();
        result.description = `Received from ${senderMatch[1].trim()}`;
      }
      
      const balanceMatch = text.match(/(?:new balance|balance)[:\s]*([\d,.]+)/i);
      if (balanceMatch) {
        result.balance = parseAmount(balanceMatch[1]);
      }
      
      if (text.includes('betpawa') || text.includes('gaming') || text.includes('ennovative') || text.includes('1xbet')) {
        result.category = 'Gaming/Betting';
        result.description = 'Betpawa/Gaming Withdrawal';
      } else if (text.includes('mobilemoney') || text.includes('momo') || text.includes('transfer')) {
        result.category = 'Transfer';
      } else {
        result.category = 'Received Payment';
      }
      
      return result;
    }
  }
  
  if (
    text.includes('your payment of') || 
    text.includes('you have transferred') || 
    text.includes('you have withdrawn') || 
    text.includes('payment of') || 
    text.includes('transferred to') || 
    text.includes('withdrawn from')
  ) {
    const amountMatch = text.match(/(?:payment|transfer|withdrawn|transferred|withdrew)\s*(?:of)?\s*([\d,.]+)\s*(?:xaf|fcfa|fcf a)/i) ||
                        text.match(/(?:payment|transfer|withdrawn|transferred|withdrew)\s*(?:of)?\s*([\d,.]+)/i);
    let amount = 0;
    if (amountMatch) amount = parseAmount(amountMatch[1]);
    
    if (amount > 0) {
      result.amount = amount;
      result.transactionType = text.includes('withdraw') ? 'withdrawal' : 'payment';
      result.isIncome = false;
      result.isExpense = true;
      
      const receiverMatch = text.match(/to\s+([^(\d]+)(?:\(|on|ref:)/i) || 
                            text.match(/at\s+([^(\d]+)(?:\(|on|ref:)/i);
      if (receiverMatch) {
        result.receiver = receiverMatch[1].trim();
        result.description = text.includes('withdraw') ? `Cash Withdrawal at ${receiverMatch[1].trim()}` : `Payment to ${receiverMatch[1].trim()}`;
      } else {
        result.description = text.includes('withdraw') ? 'Cash Withdrawal' : 'Payment / Transfer';
      }
      
      const feeMatch = text.match(/(?:fee|charges)[:\s]*([\d,.]+)/i);
      if (feeMatch) {
        result.fee = parseAmount(feeMatch[1]);
      }
      
      const balanceMatch = text.match(/(?:new balance|balance)[:\s]*([\d,.]+)/i);
      if (balanceMatch) {
        result.balance = parseAmount(balanceMatch[1]);
      }
      
      if (text.includes('mtnc bundles') || text.includes('airtime') || text.includes('bundle') || text.includes('internet')) {
        result.category = 'Airtime/Bundles';
        result.description = 'MTN Airtime/Bundles';
      } else if (text.includes('betpawa') || text.includes('gaming') || text.includes('1xbet')) {
        result.category = 'Gaming/Betting';
        result.description = 'Betpawa/Gaming Deposit';
      } else if (text.includes('transfer') || text.includes('transferred')) {
        result.category = 'Transfer';
        if (result.receiver) {
          result.description = `Transfer to ${result.receiver}`;
        }
      } else if (text.includes('withdraw')) {
        result.category = 'Withdrawal';
      } else {
        result.category = 'Payment';
      }
      
      return result;
    }
  }
  
  if (text.includes('advance') || text.includes('xtracash') || text.includes('loan')) {
    const amountMatch = text.match(/(?:advance|loan|xtracash)\s*(?:of)?\s*([\d,.]+)/i);
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
  
  if (text.includes('repaid from your account') || text.includes('loan repayment') || text.includes('repayment of')) {
    const amountMatch = text.match(/(?:amount|repayment|repaid)\s*(?:of)?\s*([\d,.]+)/i);
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

// Simulated file content
const mockFileContent = `
date | time | direction | contact | phone | content | type
2026-06-15 | 10:30:15 | Received | MTN MoMo | +237600000000 | You have received 15,000 FCFA from John Doe (237677777777). Reference: 99887766. New balance: 45,500 FCFA. | SMS
2026-06-15 | 11:15:20 | Sent | MTN MoMo | +237600000000 | You have transferred 5,000 FCFA to Mary Smith (237688888888). Fee: 100 FCFA. New balance: 40,400 FCFA. | SMS
2026-06-16 | 08:00:00 | Received | MTN MoMo | +237600000000 | You have received an advance of 10,000 FCFA. New balance: 50,400 FCFA. | SMS
2026-06-16 | 14:22:10 | Sent | MTN MoMo | +237600000000 | Your payment of 12,500 FCFA to Betpawa has been completed. New balance: 37,900 FCFA. | SMS
2026-06-17 | 17:45:00 | Sent | MTN MoMo | +237600000000 | You have withdrawn 20,000 FCFA at Agent shop. Fee: 200 FCFA. New balance: 17,700 FCFA. | SMS
2026-06-18 | 09:12:00 | Sent | MTN MoMo | +237600000000 | Repayment of 10,000 FCFA has been deducted from your account. New balance: 7,700 FCFA. | SMS
`;

console.log("Testing SMS parsing...");
const transactions = parseSMSExport(mockFileContent);
console.log(`Parsed ${transactions.length} transactions successfully.`);

console.log("\nDetails of Parsed Transactions:");
transactions.forEach((t, i) => {
  console.log(`\n[${i+1}] ${t.date} ${t.time} - ${t.description}`);
  console.log(`    Amount: CFA ${t.amount}`);
  console.log(`    Type: ${t.transactionType} (Income: ${t.isIncome}, Expense: ${t.isExpense})`);
  console.log(`    Category: ${t.category}`);
  console.log(`    Balance: CFA ${t.balance}`);
  console.log(`    Fee: CFA ${t.fee}`);
});

// Verification check
const expectedCount = 6;
if (transactions.length !== expectedCount) {
  console.error(`ERROR: Expected ${expectedCount} transactions, got ${transactions.length}`);
  process.exit(1);
}

const jdoe = transactions[0];
if (jdoe.amount !== 15000 || jdoe.isIncome !== true || jdoe.balance !== 45500 || jdoe.sender !== 'john doe') {
  console.error("ERROR: First transaction not parsed correctly", jdoe);
  process.exit(1);
}

const betpawa = transactions[3];
if (betpawa.amount !== 12500 || betpawa.isExpense !== true || betpawa.category !== 'Gaming/Betting') {
  console.error("ERROR: Betpawa transaction not parsed correctly", betpawa);
  process.exit(1);
}

console.log("\n✅ ALL TESTS PASSED SUCCESSFULLY!");
