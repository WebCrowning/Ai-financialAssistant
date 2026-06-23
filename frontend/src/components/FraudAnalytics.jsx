import React, { useState } from 'react';
import { TrendingUp, BarChart3, PieChart } from 'lucide-react';

export default function FraudAnalytics() {
  const [timeRange, setTimeRange] = useState('monthly');

  const fraudTrends = [
    { month: 'Jan', fraudCases: 45, detectionRate: 92 },
    { month: 'Feb', fraudCases: 52, detectionRate: 94 },
    { month: 'Mar', fraudCases: 38, detectionRate: 96 },
    { month: 'Apr', fraudCases: 61, detectionRate: 95 },
    { month: 'May', fraudCases: 55, detectionRate: 97 },
    { month: 'Jun', fraudCases: 68, detectionRate: 96 }
  ];

  const detectionPatterns = [
    { pattern: 'High Velocity Transactions', count: 245, percentage: 28 },
    { pattern: 'Unusual Location Change', count: 198, percentage: 22 },
    { pattern: 'Card Testing', count: 156, percentage: 18 },
    { pattern: 'Large Amount Transactions', count: 134, percentage: 15 },
    { pattern: 'Crypto/Gambling Purchases', count: 110, percentage: 13 },
    { pattern: 'Other Patterns', count: 35, percentage: 4 }
  ];

  const userSegments = [
    { segment: 'New Users', fraudRate: 3.2, caseCount: 124 },
    { segment: 'Established Users', fraudRate: 0.8, caseCount: 156 },
    { segment: 'High-Risk Users', fraudRate: 5.6, caseCount: 98 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Fraud Analytics</h1>
        <p className="text-gray-400">Fraud trends, patterns, and insights</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-3">
        {['weekly', 'monthly', 'quarterly', 'yearly'].map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-6 py-2 rounded transition capitalize ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Fraud Trend Analysis */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="text-red-400" size={24} />
          <h2 className="text-xl font-bold text-white">Monthly Fraud Trend</h2>
        </div>
        <div className="space-y-6">
          {fraudTrends.map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between mb-2">
                <span className="text-gray-300 font-medium">{item.month}</span>
                <div className="flex gap-6 text-sm">
                  <span className="text-red-400">🚨 {item.fraudCases} cases</span>
                  <span className="text-green-400">✓ {item.detectionRate}% detected</span>
                </div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 bg-gradient-to-r from-red-600 to-orange-500"
                  style={{ width: `${item.fraudCases / 10}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detection Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <PieChart className="text-purple-400" size={24} />
            <h2 className="text-xl font-bold text-white">Top Detection Patterns</h2>
          </div>
          <div className="space-y-3">
            {detectionPatterns.map((pattern, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-300 font-medium">{pattern.pattern}</span>
                  <span className="text-white font-semibold">{pattern.count} cases</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="h-2 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full"
                    style={{ width: `${pattern.percentage * 2.5}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{pattern.percentage}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* User Segment Analysis */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="text-blue-400" size={24} />
            <h2 className="text-xl font-bold text-white">Fraud by User Segment</h2>
          </div>
          <div className="space-y-4">
            {userSegments.map((segment, idx) => (
              <div key={idx} className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-white">{segment.segment}</h3>
                  <span className={`text-lg font-bold ${segment.fraudRate > 3 ? 'text-red-400' : segment.fraudRate > 1 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {segment.fraudRate}%
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Cases: {segment.caseCount}</span>
                  <span>Risk Level: {segment.fraudRate > 3 ? '🔴 High' : segment.fraudRate > 1 ? '🟡 Medium' : '🟢 Low'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 border border-purple-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-800 bg-opacity-50 rounded p-4">
            <p className="text-purple-200 text-sm mb-1">Detection Accuracy</p>
            <p className="text-3xl font-bold text-white">95.2%</p>
            <p className="text-xs text-gray-300 mt-2">Average across all patterns</p>
          </div>
          <div className="bg-pink-800 bg-opacity-50 rounded p-4">
            <p className="text-pink-200 text-sm mb-1">False Positive Rate</p>
            <p className="text-3xl font-bold text-white">2.1%</p>
            <p className="text-xs text-gray-300 mt-2">Legitimate transactions flagged</p>
          </div>
          <div className="bg-blue-800 bg-opacity-50 rounded p-4">
            <p className="text-blue-200 text-sm mb-1">Avg Response Time</p>
            <p className="text-3xl font-bold text-white">145ms</p>
            <p className="text-xs text-gray-300 mt-2">Decision per transaction</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">📊 Analytics Summary</h2>
        <ul className="space-y-2 text-gray-300">
          <li>• Highest fraud cases in crypto/gambling purchases (28%)</li>
          <li>• New users show 3.2% fraud rate vs 0.8% for established users</li>
          <li>• June shows 23% increase in fraud attempts compared to previous months</li>
          <li>• AI detection model accuracy improved to 97% with recent updates</li>
          <li>• Weekend transactions show 15% higher fraud attempt rate</li>
        </ul>
      </div>
    </div>
  );
}
