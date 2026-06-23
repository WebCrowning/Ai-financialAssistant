import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertTriangle, TrendingUp, Zap, Sliders, ShieldAlert, Plus, Layers, Play, Pause } from 'lucide-react';

export default function FraudLiveDashboard() {
  const [streamSpeed, setStreamSpeed] = useState(1); // multiplier: 0.5, 1, 2, 5, 20
  const [streamActive, setStreamActive] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState('Established'); // Established, New, High-Risk
  
  // Dashboard overall metrics state
  const [metrics, setMetrics] = useState({
    totalAnalyzed: 42580,
    fraudDetected: 124,
    avgRiskScore: 23,
    avgProcessingTime: 142,
    riskDistribution: {
      low: 32500,
      medium: 8200,
      high: 1500,
      critical: 380
    }
  });

  const [transactionFeed, setTransactionFeed] = useState([
    { id: 1, time: '10:15:24', user: 'USER_Established_4210', merchant: 'Supermarket Store', amount: 45000, location: 'Lagos, NG', status: 'Approved', riskLevel: 'Low', riskScore: 12 },
    { id: 2, time: '10:15:38', user: 'USER_New_9811', merchant: 'Binance Exchange', amount: 350000, location: 'Kano, NG', status: 'Flagged', riskLevel: 'High', riskScore: 78 },
    { id: 3, time: '10:16:02', user: 'USER_HighRisk_1450', merchant: 'Lagos Casino', amount: 500000, location: 'Lagos, NG', status: 'Blocked', riskLevel: 'Critical', riskScore: 94 },
    { id: 4, time: '10:16:15', user: 'USER_Established_2011', merchant: 'Netflix Subscription', amount: 15000, location: 'Abuja, NG', status: 'Approved', riskLevel: 'Low', riskScore: 5 },
    { id: 5, time: '10:16:30', user: 'USER_New_4451', merchant: 'Electronics Outlet', amount: 120000, location: 'London, UK', status: 'Review', riskLevel: 'Medium', riskScore: 55 }
  ]);

  // Form states for manual injection
  const [manualTx, setManualTx] = useState({
    userId: 'USER_Established_8920',
    merchant: 'Amazon Web Services',
    amount: '',
    category: 'Bills',
    location: 'Lagos, NG'
  });

  const intervalRef = useRef(null);

  // Restart stream loop whenever speed or status changes
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!streamActive) return;

    const baseDelay = 3500;
    const delay = baseDelay / streamSpeed;

    intervalRef.current = setInterval(() => {
      generateSimulatedTransaction();
    }, delay);

    return () => clearInterval(intervalRef.current);
  }, [streamSpeed, streamActive, selectedProfile]);

  const processNewTransaction = (tx) => {
    setTransactionFeed(prev => [tx, ...prev.slice(0, 19)]); // Keep last 20

    setMetrics(prev => {
      const newTotal = prev.totalAnalyzed + 1;
      const isFraud = tx.status === 'Blocked' || tx.status === 'Flagged';
      const newFraudCount = isFraud ? prev.fraudDetected + 1 : prev.fraudDetected;
      
      // Update distribution
      const dist = { ...prev.riskDistribution };
      const level = tx.riskLevel.toLowerCase();
      dist[level] = (dist[level] || 0) + 1;

      // Running averages
      const newAvgRisk = Math.round((prev.avgRiskScore * 99 + tx.riskScore) / 100);
      const randomTime = Math.floor(Math.random() * 60) + 90; // processing time in ms
      const newAvgTime = Math.round((prev.avgProcessingTime * 99 + randomTime) / 100);

      return {
        totalAnalyzed: newTotal,
        fraudDetected: newFraudCount,
        avgRiskScore: newAvgRisk,
        avgProcessingTime: newAvgTime,
        riskDistribution: dist
      };
    });
  };

  const generateSimulatedTransaction = (scenarioName = null) => {
    const time = new Date().toTimeString().split(' ')[0];
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const suffix = Math.floor(Math.random() * 9000) + 1000;
    const user = `USER_${selectedProfile}_${suffix}`;
    
    let tx = {
      id,
      time,
      user,
      merchant: 'Supermarket Store',
      amount: 15000,
      location: 'Lagos, NG',
      status: 'Approved',
      riskLevel: 'Low',
      riskScore: 8
    };

    const scenario = scenarioName || ['Normal', 'Normal', 'Normal', 'Large Amount', 'Crypto', 'Normal'][Math.floor(Math.random() * 6)];

    switch (scenario) {
      case 'Normal':
        tx.merchant = ['Uber Taxi', 'Local Eatery', 'Pharmacy Outpost', 'Starbucks Coffee'][Math.floor(Math.random() * 4)];
        tx.amount = Math.floor(Math.random() * 12000) + 3000;
        tx.riskScore = Math.floor(Math.random() * 12) + 4;
        tx.riskLevel = 'Low';
        tx.status = 'Approved';
        break;
      case 'Large Amount':
        tx.merchant = 'Luxury Diamond Store';
        tx.amount = Math.floor(Math.random() * 400000) + 550000;
        tx.riskScore = Math.floor(Math.random() * 20) + 65; // 65-85
        tx.riskLevel = 'High';
        tx.status = 'Flagged';
        break;
      case 'Foreign':
        tx.merchant = 'Offshore Retailer';
        tx.amount = Math.floor(Math.random() * 80000) + 40000;
        tx.location = ['Cayman Islands', 'Moscow, RU', 'Nicosia, CY'][Math.floor(Math.random() * 3)];
        tx.riskScore = Math.floor(Math.random() * 15) + 70; // 70-85
        tx.riskLevel = 'High';
        tx.status = 'Flagged';
        break;
      case 'Crypto':
        tx.merchant = 'Binance Exchange';
        tx.amount = Math.floor(Math.random() * 200000) + 150000;
        tx.riskScore = Math.floor(Math.random() * 10) + 80; // 80-90
        tx.riskLevel = 'High';
        tx.status = 'Flagged';
        break;
      case 'Night Gambling':
        tx.merchant = 'BetNine Casino Engine';
        tx.amount = Math.floor(Math.random() * 50000) + 20000;
        tx.time = '02:44:12';
        tx.riskScore = Math.floor(Math.random() * 10) + 85; // 85-95
        tx.riskLevel = 'Critical';
        tx.status = 'Blocked';
        break;
      case 'Velocity Burst':
        tx.merchant = 'Steam Games Store';
        tx.amount = 85000;
        tx.riskScore = 93;
        tx.riskLevel = 'Critical';
        tx.status = 'Blocked';
        break;
      case 'Card Testing':
        tx.merchant = 'Domain Registrar';
        tx.amount = 1200;
        tx.riskScore = 96;
        tx.riskLevel = 'Critical';
        tx.status = 'Blocked';
        break;
      case 'Dormant Wake-up':
        tx.merchant = 'Foreign Wire Transfer';
        tx.amount = 350000;
        tx.riskScore = 82;
        tx.riskLevel = 'High';
        tx.status = 'Review';
        break;
      default:
        break;
    }

    processNewTransaction(tx);
  };

  const handleManualInject = (e) => {
    e.preventDefault();
    if (!manualTx.amount) return;

    const time = new Date().toTimeString().split(' ')[0];
    const score = Math.floor(Math.random() * 30) + (parseFloat(manualTx.amount) > 100000 ? 55 : 5);
    const riskLevel = score > 80 ? 'Critical' : score > 60 ? 'High' : score > 30 ? 'Medium' : 'Low';
    const status = score > 80 ? 'Blocked' : score > 60 ? 'Flagged' : 'Approved';

    const tx = {
      id: Date.now(),
      time,
      user: manualTx.userId,
      merchant: manualTx.merchant,
      amount: parseFloat(manualTx.amount),
      location: manualTx.location,
      status,
      riskLevel,
      riskScore: score
    };

    processNewTransaction(tx);
    setManualTx(prev => ({ ...prev, amount: '' }));
  };

  const handleBatchInject = () => {
    // Inject 10 transactions rapidly
    let count = 0;
    const batchInterval = setInterval(() => {
      const scenarios = ['Normal', 'Normal', 'Large Amount', 'Crypto', 'Normal', 'Foreign', 'Normal', 'Night Gambling', 'Velocity Burst', 'Normal'];
      generateSimulatedTransaction(scenarios[count]);
      count++;
      if (count >= 10) clearInterval(batchInterval);
    }, 150);
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
      case 'Approved': return 'bg-green-950/40 text-green-300 border border-green-800/60';
      case 'Flagged': return 'bg-yellow-950/40 text-yellow-300 border border-yellow-800/60';
      case 'Blocked': return 'bg-red-950/40 text-red-300 border border-red-850/60';
      case 'Review': return 'bg-blue-950/40 text-blue-300 border border-blue-800/60';
      default: return 'bg-gray-900';
    }
  };

  const fraudRate = metrics.totalAnalyzed > 0 ? (metrics.fraudDetected / metrics.totalAnalyzed) * 100 : 0;

  return (
    <div className="p-6 space-y-6 text-white">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">🛡️ SENTINEL Live Monitor</h1>
          <p className="text-gray-400">Real-time fraud scoring engine logs and streaming transaction analyzer</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setStreamActive(!streamActive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition ${
              streamActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {streamActive ? <Pause size={18} /> : <Play size={18} />}
            {streamActive ? 'Pause Stream' : 'Resume Stream'}
          </button>
          <button
            onClick={handleBatchInject}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 px-4 py-2 rounded-lg font-semibold transition"
          >
            <Layers size={18} />
            Inject Batch (10 Txns)
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 text-center flex flex-col justify-between">
          <p className="text-xs text-gray-400 mb-2">Total Analyzed</p>
          <p className="text-3xl font-bold font-mono">{metrics.totalAnalyzed.toLocaleString()}</p>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center', marginTop: '10px' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulsing-dot"></span>
            <span className="text-[10px] text-emerald-400 uppercase font-semibold font-mono">Stream Speed: {streamSpeed}x</span>
          </div>
        </div>

        <div className="bg-red-950/20 border border-red-900 rounded-xl p-5 text-center flex flex-col justify-between">
          <p className="text-xs text-red-300 mb-2">Fraud / Anomalies Detected</p>
          <p className="text-3xl font-bold font-mono text-red-400">{metrics.fraudDetected}</p>
          <p className="text-[10px] text-red-300 mt-2 font-mono">{fraudRate.toFixed(3)}% fraud rate</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 text-center flex flex-col justify-between">
          <p className="text-xs text-gray-400 mb-2">Average Risk Score</p>
          <p className="text-3xl font-bold font-mono text-purple-400">{metrics.avgRiskScore}/100</p>
          <p className="text-[10px] text-gray-500 mt-2 font-mono">P95 rating limits: 72</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 text-center flex flex-col justify-between">
          <p className="text-xs text-gray-400 mb-2">Avg Processing Speed</p>
          <p className="text-3xl font-bold font-mono text-cyan-400">{metrics.avgProcessingTime} ms</p>
          <p className="text-[10px] text-gray-500 mt-2 font-mono">XGBoost model execution</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 text-center flex flex-col justify-between">
          <p className="text-xs text-gray-400 mb-2">Low Risk Transactions</p>
          <p className="text-3xl font-bold font-mono text-green-400">{metrics.riskDistribution.low.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 mt-2 font-mono">
            {((metrics.riskDistribution.low / metrics.totalAnalyzed) * 100).toFixed(1)}% of total
          </p>
        </div>
      </div>

      {/* Simulator Controls & Scenario Testing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scenario Selectors */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 lg:col-2 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Sliders size={18} /> Simulation Controls</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs text-gray-400 mb-2">User ID Profile Segmentation</label>
                <div className="flex gap-2">
                  {['Established', 'New', 'High-Risk'].map(prof => (
                    <button
                      key={prof}
                      onClick={() => setSelectedProfile(prof)}
                      className={`flex-1 py-1.5 rounded text-xs font-semibold border transition ${
                        selectedProfile === prof
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750'
                      }`}
                    >
                      {prof}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">Stream Speed Adjustment</label>
                <div className="flex gap-1">
                  {[0.5, 1, 2, 5, 20].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setStreamSpeed(speed)}
                      className={`flex-1 py-1.5 rounded text-xs font-mono font-bold border transition ${
                        streamSpeed === speed
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="block text-xs text-gray-400 mb-3 font-semibold">Execute Scenario Injection</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { name: 'Normal', color: 'bg-green-600 hover:bg-green-700' },
                { name: 'Large Amount', color: 'bg-indigo-600 hover:bg-indigo-700' },
                { name: 'Foreign', color: 'bg-orange-600 hover:bg-orange-700' },
                { name: 'Crypto', color: 'bg-purple-600 hover:bg-purple-700' },
                { name: 'Night Gambling', color: 'bg-red-600 hover:bg-red-700' },
                { name: 'Velocity Burst', color: 'bg-rose-600 hover:bg-rose-700' },
                { name: 'Card Testing', color: 'bg-pink-600 hover:bg-pink-700' },
                { name: 'Dormant Wake-up', color: 'bg-cyan-600 hover:bg-cyan-700' }
              ].map(scen => (
                <button
                  key={scen.name}
                  onClick={() => generateSimulatedTransaction(scen.name)}
                  className={`py-2 px-1 text-[11px] font-semibold text-white rounded transition ${scen.color}`}
                >
                  {scen.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Manual Injector Form */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Plus size={18} /> Manual Transaction Injector</h3>
          
          <form onSubmit={handleManualInject} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">User ID</label>
                <input
                  type="text"
                  value={manualTx.userId}
                  onChange={(e) => setManualTx({ ...manualTx, userId: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Merchant</label>
                <input
                  type="text"
                  value={manualTx.merchant}
                  onChange={(e) => setManualTx({ ...manualTx, merchant: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Amount (CFA)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={manualTx.amount}
                  onChange={(e) => setManualTx({ ...manualTx, amount: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Location</label>
                <input
                  type="text"
                  value={manualTx.location}
                  onChange={(e) => setManualTx({ ...manualTx, location: e.target.value })}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 rounded text-xs font-semibold transition mt-2">
              Inject Transaction Instance
            </button>
          </form>
        </div>

      </div>

      {/* Live streaming feed table */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="text-xl font-bold text-white mb-0 flex items-center gap-2">
            <ShieldAlert className="text-red-400 animate-pulse" size={22} /> Live Transaction Feed
          </h2>
          <span className="text-xs bg-gray-800 border border-gray-700 px-3 py-1 rounded text-gray-400">Showing last 20 streams</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-850 text-left">
                <th className="py-3 px-4 text-gray-400 font-semibold">Time</th>
                <th className="py-3 px-4 text-gray-400 font-semibold">User ID</th>
                <th className="py-3 px-4 text-gray-400 font-semibold">Merchant</th>
                <th className="py-3 px-4 text-gray-400 font-semibold">Location</th>
                <th className="py-3 px-4 text-gray-400 font-semibold">Amount</th>
                <th className="py-3 px-4 text-gray-400 font-semibold">Risk Level</th>
                <th className="py-3 px-4 text-gray-400 font-semibold">Risk Score</th>
                <th className="py-3 px-4 text-gray-400 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactionFeed.map(trans => (
                <tr key={trans.id} className="border-b border-gray-850 hover:bg-gray-850/40 transition">
                  <td className="py-3 px-4 text-gray-400 font-mono text-xs">{trans.time}</td>
                  <td className="py-3 px-4 text-white font-mono text-xs">{trans.user}</td>
                  <td className="py-3 px-4 text-gray-200 font-semibold">{trans.merchant}</td>
                  <td className="py-3 px-4 text-gray-400">{trans.location}</td>
                  <td className="py-3 px-4 text-white font-bold">CFA {trans.amount.toLocaleString()}</td>
                  <td className={`py-3 px-4 font-bold text-xs ${getRiskColor(trans.riskLevel)}`}>{trans.riskLevel}</td>
                  <td className="py-3 px-4 text-gray-200 font-mono font-bold">{trans.riskScore}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBg(trans.status)}`}>
                      {trans.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
