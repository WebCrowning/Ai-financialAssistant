import React, { useState } from 'react';
import { Users, TrendingUp, AlertTriangle } from 'lucide-react';

export default function UserProfiles() {
  const [profiles] = useState([
    {
      id: 1,
      segment: 'Established Users',
      count: 15420,
      fraudRate: 0.8,
      avgTransactionAmount: 45000,
      avgTransactionsPerMonth: 24,
      highestRiskPattern: 'Unusual location',
      baselineSpendingPattern: 'Stable',
      accountAge: '2+ years'
    },
    {
      id: 2,
      segment: 'New Users',
      count: 3850,
      fraudRate: 3.2,
      avgTransactionAmount: 28000,
      avgTransactionsPerMonth: 8,
      highestRiskPattern: 'High velocity',
      baselineSpendingPattern: 'Variable',
      accountAge: '< 3 months'
    },
    {
      id: 3,
      segment: 'High-Risk Users',
      count: 287,
      fraudRate: 5.6,
      avgTransactionAmount: 62000,
      avgTransactionsPerMonth: 15,
      highestRiskPattern: 'Card testing',
      baselineSpendingPattern: 'Erratic',
      accountAge: 'Mixed'
    }
  ]);
  const [selectedProfile, setSelectedProfile] = useState(profiles[0]);

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">User Profiles</h1>
        <p className="text-gray-400">User behavior analysis and fraud risk profiles</p>
      </div>

      {/* Profile Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profiles.map(profile => (
          <button
            key={profile.id}
            onClick={() => setSelectedProfile(profile)}
            className={`border-2 rounded-lg p-4 transition text-left ${selectedProfile.id === profile.id
                ? 'border-purple-500 bg-purple-900 bg-opacity-20'
                : 'border-gray-700 hover:border-gray-600 bg-gray-900'
              }`}
          >
            <h3 className="font-bold text-white mb-3">{profile.segment}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Users</span>
                <span className="text-white">{profile.count.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fraud Rate</span>
                <span className={profile.fraudRate > 3 ? 'text-red-400' : profile.fraudRate > 1 ? 'text-yellow-400' : 'text-green-400'}>
                  {profile.fraudRate}%
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Profile Details */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6">{selectedProfile.segment}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">Total Users</p>
            <p className="text-3xl font-bold text-white">{selectedProfile.count.toLocaleString()}</p>
          </div>
          <div className={`rounded-lg p-4 ${selectedProfile.fraudRate > 3 ? 'bg-red-900' : selectedProfile.fraudRate > 1 ? 'bg-yellow-900' : 'bg-green-900'}`}>
            <p className={`text-sm mb-2 ${selectedProfile.fraudRate > 3 ? 'text-red-200' : selectedProfile.fraudRate > 1 ? 'text-yellow-200' : 'text-green-200'}`}>
              Fraud Rate
            </p>
            <p className={`text-3xl font-bold ${selectedProfile.fraudRate > 3 ? 'text-red-400' : selectedProfile.fraudRate > 1 ? 'text-yellow-400' : 'text-green-400'}`}>
              {selectedProfile.fraudRate}%
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">Account Age</p>
            <p className="text-xl font-bold text-white">{selectedProfile.accountAge}</p>
          </div>
        </div>

        {/* Behavior Patterns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-white mb-4">Transaction Patterns</h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-400 text-sm mb-2">Avg Transaction Amount</p>
                <p className="text-2xl font-bold text-white">CFA {selectedProfile.avgTransactionAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Avg Transactions/Month</p>
                <p className="text-2xl font-bold text-white">{selectedProfile.avgTransactionsPerMonth}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Baseline Spending</p>
                <p className="text-white">{selectedProfile.baselineSpendingPattern}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Risk Indicators</h3>
            <div className="bg-gray-800 rounded-lg p-4 mb-3">
              <p className="text-gray-400 text-sm mb-2">Highest Risk Pattern</p>
              <div className="flex items-center gap-2 mt-2">
                <AlertTriangle className="text-orange-400" size={20} />
                <span className="text-white">{selectedProfile.highestRiskPattern}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-green-900 rounded p-2 text-center">
                <p className="text-green-300 font-semibold">Low Risk</p>
                <p className="text-green-200 mt-1">{Math.round(100 - selectedProfile.fraudRate * 10)}%</p>
              </div>
              <div className="bg-yellow-900 rounded p-2 text-center">
                <p className="text-yellow-300 font-semibold">Medium</p>
                <p className="text-yellow-200 mt-1">{Math.round(selectedProfile.fraudRate * 5)}%</p>
              </div>
              <div className="bg-red-900 rounded p-2 text-center">
                <p className="text-red-300 font-semibold">High Risk</p>
                <p className="text-red-200 mt-1">{Math.round(selectedProfile.fraudRate)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Cohort Comparison */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Users size={24} className="text-blue-400" />
          User Cohort Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="text-left py-3 px-4 text-gray-400 font-semibold">Segment</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">User Count</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Fraud Rate</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Avg Transaction</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Monthly Activity</th>
                <th className="text-center py-3 px-4 text-gray-400 font-semibold">Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(profile => (
                <tr key={profile.id} className={`border-b border-gray-800 ${profile.id === selectedProfile.id ? 'bg-blue-900 bg-opacity-20' : ''}`}>
                  <td className="py-4 px-4 text-white font-semibold">{profile.segment}</td>
                  <td className="py-4 px-4 text-center text-gray-300">{profile.count.toLocaleString()}</td>
                  <td className={`py-4 px-4 text-center font-bold ${profile.fraudRate > 3 ? 'text-red-400' : profile.fraudRate > 1 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {profile.fraudRate}%
                  </td>
                  <td className="py-4 px-4 text-center text-gray-300">CFA {profile.avgTransactionAmount.toLocaleString()}</td>
                  <td className="py-4 px-4 text-center text-gray-300">{profile.avgTransactionsPerMonth} txns</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${profile.fraudRate > 3 ? 'bg-red-900 text-red-300' :
                        profile.fraudRate > 1 ? 'bg-yellow-900 text-yellow-300' :
                          'bg-green-900 text-green-300'
                      }`}>
                      {profile.fraudRate > 3 ? 'High' : profile.fraudRate > 1 ? 'Medium' : 'Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 border border-purple-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="text-purple-400" size={24} />
          Profile Insights
        </h2>
        <ul className="space-y-2 text-gray-300">
          <li>• New users are 4x more likely to attempt fraud compared to established users</li>
          <li>• High-risk users show erratic spending patterns that differ from their baseline</li>
          <li>• Card testing is the most common fraud pattern among new user accounts</li>
          <li>• Established users maintain consistent transaction amounts within ±15% variance</li>
          <li>• Account age is inversely correlated with fraud risk probability</li>
        </ul>
      </div>
    </div>
  );
}
