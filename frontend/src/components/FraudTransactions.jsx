import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Filter, Eye, Clock, ShieldCheck } from 'lucide-react';

export default function FraudTransactions() {
  const [flaggedTransactions, setFlaggedTransactions] = useState([
    {
      id: 1,
      timestamp: '2026-06-15 14:32:08',
      userId: 'USER_Established_5678',
      amount: 125000,
      location: 'Lagos, NG',
      merchant: 'Electronics Store',
      riskLevel: 'High',
      riskScore: 78,
      reason: 'Unusual location change, large amount',
      status: 'Pending Review',
      userType: 'Established'
    },
    {
      id: 2,
      timestamp: '2026-06-15 14:32:22',
      userId: 'USER_New_9876',
      amount: 250000,
      location: 'Abuja, NG',
      merchant: 'Cryptocurrency Exchange',
      riskLevel: 'Critical',
      riskScore: 95,
      reason: 'High velocity, crypto transaction, new location',
      status: 'Blocked',
      userType: 'New'
    },
    {
      id: 3,
      timestamp: '2026-06-15 14:25:45',
      userId: 'USER_HighRisk_1122',
      amount: 180000,
      location: 'Port Harcourt, NG',
      merchant: 'Gaming Platform',
      riskLevel: 'High',
      riskScore: 82,
      reason: 'Night transaction, unusual merchant, high amount',
      status: 'Under Review',
      userType: 'High-Risk'
    },
    {
      id: 4,
      timestamp: '2026-06-15 14:15:33',
      userId: 'USER_Established_3344',
      amount: 95000,
      location: 'Online',
      merchant: 'Foreign Retailer',
      riskLevel: 'Medium',
      riskScore: 62,
      reason: 'Multiple rapid transactions detected',
      status: 'Pending Review',
      userType: 'Established'
    },
    {
      id: 5,
      timestamp: '2026-06-15 14:05:12',
      userId: 'USER_New_5566',
      amount: 220000,
      location: 'Kano, NG',
      merchant: 'Card Testing Service',
      riskLevel: 'Critical',
      riskScore: 91,
      reason: 'Known card testing layout pattern detected',
      status: 'Blocked',
      userType: 'New'
    }
  ]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filterRisk, setFilterRisk] = useState('All');
  const [alertMsg, setAlertMsg] = useState(null);

  const filteredTransactions = filterRisk === 'All'
    ? flaggedTransactions
    : flaggedTransactions.filter(t => t.riskLevel === filterRisk);

  const handleApprove = (id) => {
    setFlaggedTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: 'Approved', riskScore: 10, riskLevel: 'Low' };
      }
      return t;
    }));
    triggerAlert(`Transaction #${id} has been marked APPROVED.`);
  };

  const handleBlock = (id) => {
    setFlaggedTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: 'Blocked', riskScore: 98, riskLevel: 'Critical' };
      }
      return t;
    }));
    triggerAlert(`Transaction #${id} has been marked BLOCKED.`);
  };

  const handleReviewLater = (id) => {
    setFlaggedTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: 'Under Review' };
      }
      return t;
    }));
    triggerAlert(`Transaction #${id} is now UNDER REVIEW.`);
  };

  const triggerAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'Low': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'High': return 'text-orange-400';
      case 'Critical': return 'text-red-400 font-bold';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'Pending Review': return 'bg-yellow-950/40 text-yellow-300 border border-yellow-800/40';
      case 'Under Review': return 'bg-blue-950/40 text-blue-300 border border-blue-800/40';
      case 'Blocked': return 'bg-red-950/40 text-red-300 border border-red-800/40';
      case 'Approved': return 'bg-green-950/40 text-green-300 border border-green-800/40';
      default: return 'bg-gray-900';
    }
  };

  return (
    <div className="p-6 space-y-6 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Suspicious Flagged Transactions</h1>
        <p className="text-gray-400">Review, approve, or lock transactions identified by SENTINEL engine thresholds</p>
      </div>

      {alertMsg && (
        <div style={{ padding: '12px 18px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }} className="no-print">
          <ShieldCheck size={18} />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 flex items-center gap-3">
        <Filter className="text-gray-500" size={20} />
        <div className="flex gap-2 flex-wrap">
          {['All', 'Low', 'Medium', 'High', 'Critical'].map(level => (
            <button
              key={level}
              onClick={() => setFilterRisk(level)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                filterRisk === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.map(trans => (
          <div key={trans.id} className="bg-gray-900 border border-gray-700 rounded-lg p-5 hover:bg-gray-850 transition cursor-pointer"
            onClick={() => setSelectedTransaction(selectedTransaction?.id === trans.id ? null : trans)}>
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="text-red-400" size={20} />
                  <h3 className="font-bold text-white text-base">{trans.merchant}</h3>
                  <span className="text-[10px] uppercase font-bold bg-gray-800 text-gray-300 px-2.5 py-0.5 rounded border border-gray-700">{trans.userType} Segment</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 ml-8 text-xs text-gray-400">
                  <div>
                    <p className="text-gray-500 mb-1">Transaction ID</p>
                    <p className="text-white font-mono">#TXN_{trans.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Time</p>
                    <p className="text-white">{trans.timestamp}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Location</p>
                    <p className="text-white">{trans.location}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Amount</p>
                    <p className="text-white font-bold">CFA {trans.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">User Reference</p>
                    <p className="text-white font-mono text-[10px]">{trans.userId}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-base font-bold ${getRiskColor(trans.riskLevel)}`}>{trans.riskLevel} Risk</p>
                <p className="text-gray-400 text-xs mt-1">Model Score: {trans.riskScore}</p>
                <span className={`inline-block px-3 py-0.5 rounded text-[10px] font-bold uppercase mt-2.5 ${getStatusBg(trans.status)}`}>
                  {trans.status}
                </span>
              </div>
            </div>

            {/* Detailed View Actions */}
            {selectedTransaction?.id === trans.id && (
              <div className="mt-6 pt-6 border-t border-gray-800" onClick={(e) => e.stopPropagation()}>
                <h4 className="font-bold text-white text-sm mb-2">Flag Trigger Details</h4>
                <p className="text-gray-300 bg-black/35 border border-gray-800 rounded p-3 mb-4 text-xs font-mono">{trans.reason}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleApprove(trans.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle size={15} />
                    Approve Normal
                  </button>
                  <button
                    onClick={() => handleReviewLater(trans.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <Clock size={15} />
                    Put Under Review
                  </button>
                  <button
                    onClick={() => handleBlock(trans.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={15} />
                    Block & Terminate
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-red-950 to-orange-950 border border-red-900 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Anomalous Aggregate Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-red-200 text-xs mb-2">Suspicious Instances</p>
            <p className="text-3xl font-bold text-white font-mono">{flaggedTransactions.length}</p>
          </div>
          <div>
            <p className="text-red-200 text-xs mb-2">Blocked / Terminated</p>
            <p className="text-3xl font-bold text-white font-mono">{flaggedTransactions.filter(t => t.status === 'Blocked').length}</p>
          </div>
          <div>
            <p className="text-red-200 text-xs mb-2">Approved Safe</p>
            <p className="text-3xl font-bold text-white font-mono">{flaggedTransactions.filter(t => t.status === 'Approved').length}</p>
          </div>
          <div>
            <p className="text-red-200 text-xs mb-2">Total Amount Flagged</p>
            <p className="text-3xl font-bold text-white font-mono">CFA {flaggedTransactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
