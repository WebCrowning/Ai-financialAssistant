import React, { useState } from 'react';
import { Settings, TrendingUp, AlertCircle } from 'lucide-react';

export default function MLScorer() {
  const [models] = useState([
    {
      id: 1,
      name: 'Primary Fraud Detection Model',
      version: 'v3.2.1',
      accuracy: 97.2,
      precision: 96.8,
      recall: 94.5,
      f1Score: 95.6,
      lastTrained: '2026-06-10',
      status: 'Active',
      avgResponseTime: 145,
      transactionsTrained: 2500000
    },
    {
      id: 2,
      name: 'Card Testing Detection Model',
      version: 'v2.1.0',
      accuracy: 98.5,
      precision: 98.1,
      recall: 96.8,
      f1Score: 97.4,
      lastTrained: '2026-06-08',
      status: 'Active',
      avgResponseTime: 125,
      transactionsTrained: 750000
    },
    {
      id: 3,
      name: 'Velocity Fraud Model',
      version: 'v1.8.3',
      accuracy: 95.3,
      precision: 94.1,
      recall: 92.7,
      f1Score: 93.4,
      lastTrained: '2026-06-05',
      status: 'Staging',
      avgResponseTime: 156,
      transactionsTrained: 1800000
    }
  ]);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [thresholds, setThresholds] = useState({
    lowRisk: 30,
    mediumRisk: 60,
    highRisk: 80,
    criticalRisk: 90
  });

  const handleThresholdChange = (level, value) => {
    setThresholds({ ...thresholds, [level]: parseInt(value) });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">ML Fraud Scorer</h1>
        <p className="text-gray-400">Machine learning model management and configuration</p>
      </div>

      {/* Model Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {models.map(model => (
          <button
            key={model.id}
            onClick={() => setSelectedModel(model)}
            className={`border-2 rounded-lg p-4 transition text-left ${
              selectedModel.id === model.id
                ? 'border-blue-500 bg-blue-900 bg-opacity-20'
                : 'border-gray-700 hover:border-gray-600 bg-gray-900'
            }`}
          >
            <h3 className="font-bold text-white mb-2">{model.name}</h3>
            <p className="text-sm text-gray-400 mb-2">{model.version}</p>
            <div className="flex justify-between items-center">
              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                model.status === 'Active' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
              }`}>
                {model.status}
              </span>
              <span className="text-blue-400 font-bold">{model.accuracy}%</span>
            </div>
          </button>
        ))}
      </div>

      {/* Model Details */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6">{selectedModel.name}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">Accuracy</p>
            <p className="text-3xl font-bold text-green-400">{selectedModel.accuracy}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">Precision</p>
            <p className="text-3xl font-bold text-blue-400">{selectedModel.precision}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">Recall</p>
            <p className="text-3xl font-bold text-purple-400">{selectedModel.recall}%</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">F1 Score</p>
            <p className="text-3xl font-bold text-orange-400">{selectedModel.f1Score}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-400 text-sm mb-3">Model Information</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Version</span>
                <span className="text-white font-mono">{selectedModel.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Trained</span>
                <span className="text-white">{new Date(selectedModel.lastTrained).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className={selectedModel.status === 'Active' ? 'text-green-400' : 'text-yellow-400'}>
                  {selectedModel.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Response Time</span>
                <span className="text-white">{selectedModel.avgResponseTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Transactions Trained</span>
                <span className="text-white">{(selectedModel.transactionsTrained / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-gray-400 text-sm mb-3">Model Performance</p>
            <div className="space-y-3">
              <div>
                <p className="text-white text-sm mb-1">True Positive Rate</p>
                <div className="w-full bg-gray-800 rounded h-2">
                  <div className="h-2 bg-green-500 rounded" style={{ width: `${selectedModel.recall}%` }}></div>
                </div>
              </div>
              <div>
                <p className="text-white text-sm mb-1">True Negative Rate</p>
                <div className="w-full bg-gray-800 rounded h-2">
                  <div className="h-2 bg-blue-500 rounded" style={{ width: `${100 - (100 - selectedModel.accuracy)}%` }}></div>
                </div>
              </div>
              <div>
                <p className="text-white text-sm mb-1">Overall Performance</p>
                <div className="w-full bg-gray-800 rounded h-2">
                  <div className="h-2 bg-purple-500 rounded" style={{ width: `${selectedModel.f1Score}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Score Thresholds */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="text-yellow-400" size={24} />
          <h2 className="text-xl font-bold text-white">Risk Score Thresholds</h2>
        </div>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-white font-medium">Low Risk (0-{thresholds.lowRisk})</label>
              <input
                type="number"
                value={thresholds.lowRisk}
                onChange={(e) => handleThresholdChange('lowRisk', e.target.value)}
                className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-center"
              />
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div className="h-3 bg-green-500 rounded-full" style={{ width: `${thresholds.lowRisk}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-white font-medium">Medium Risk ({thresholds.lowRisk}-{thresholds.mediumRisk})</label>
              <input
                type="number"
                value={thresholds.mediumRisk}
                onChange={(e) => handleThresholdChange('mediumRisk', e.target.value)}
                className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-center"
              />
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div className="h-3 bg-yellow-500 rounded-full" style={{ width: `${thresholds.mediumRisk}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-white font-medium">High Risk ({thresholds.mediumRisk}-{thresholds.highRisk})</label>
              <input
                type="number"
                value={thresholds.highRisk}
                onChange={(e) => handleThresholdChange('highRisk', e.target.value)}
                className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-center"
              />
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div className="h-3 bg-orange-500 rounded-full" style={{ width: `${thresholds.highRisk}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-white font-medium">Critical Risk ({thresholds.highRisk}-100)</label>
              <input
                type="number"
                value={thresholds.criticalRisk}
                onChange={(e) => handleThresholdChange('criticalRisk', e.target.value)}
                className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-center"
              />
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div className="h-3 bg-red-500 rounded-full" style={{ width: `${thresholds.criticalRisk}%` }}></div>
            </div>
          </div>
        </div>
        <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded transition">
          Save Thresholds
        </button>
      </div>

      {/* Training Status */}
      <div className="bg-gradient-to-r from-green-900 to-emerald-900 border border-green-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-400" size={24} />
          Model Training & Updates
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-green-200 mb-2">Last Training</p>
            <p className="text-white font-semibold">2026-06-10 14:32</p>
            <p className="text-green-300 text-xs mt-1">✓ Successful</p>
          </div>
          <div>
            <p className="text-green-200 mb-2">Next Training</p>
            <p className="text-white font-semibold">2026-06-17 14:00</p>
            <p className="text-green-300 text-xs mt-1">Scheduled</p>
          </div>
          <div>
            <p className="text-green-200 mb-2">Model Improvement</p>
            <p className="text-white font-semibold">+1.2% accuracy</p>
            <p className="text-green-300 text-xs mt-1">Since last training</p>
          </div>
        </div>
      </div>
    </div>
  );
}
