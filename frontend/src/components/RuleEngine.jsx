import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function RuleEngine() {
  const [rules, setRules] = useState([
    {
      id: 1,
      name: 'High Velocity Rule',
      description: 'Detect multiple transactions in short time period',
      threshold: '5 transactions in 60 seconds',
      severity: 'High',
      enabled: true,
      falsePositiveRate: 1.2
    },
    {
      id: 2,
      name: 'Large Amount Rule',
      description: 'Flag unusually large transactions',
      threshold: '> CFA 500,000',
      severity: 'Medium',
      enabled: true,
      falsePositiveRate: 2.1
    },
    {
      id: 3,
      name: 'Location Change Rule',
      description: 'Detect rapid location changes',
      threshold: '> 1000km in 2 hours',
      severity: 'High',
      enabled: true,
      falsePositiveRate: 0.8
    },
    {
      id: 4,
      name: 'Card Testing Rule',
      description: 'Detect card testing patterns',
      threshold: 'Multiple small transactions to different merchants',
      severity: 'Critical',
      enabled: true,
      falsePositiveRate: 0.3
    },
    {
      id: 5,
      name: 'Crypto Transaction Rule',
      description: 'Flag cryptocurrency purchases',
      threshold: 'Any crypto exchange transaction',
      severity: 'High',
      enabled: true,
      falsePositiveRate: 3.5
    }
  ]);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    threshold: '',
    severity: 'Medium'
  });

  const handleAddRule = () => {
    if (newRule.name && newRule.threshold) {
      setRules([...rules, {
        id: rules.length + 1,
        ...newRule,
        enabled: true,
        falsePositiveRate: 0
      }]);
      setNewRule({ name: '', description: '', threshold: '', severity: 'Medium' });
      setShowAddRule(false);
    }
  };

  const toggleRule = (id) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id) => {
    setRules(rules.filter(r => r.id !== id));
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'text-red-400 bg-red-900';
      case 'High': return 'text-orange-400 bg-orange-900';
      case 'Medium': return 'text-yellow-400 bg-yellow-900';
      default: return 'text-blue-400 bg-blue-900';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Rule Engine</h1>
        <p className="text-gray-400">Configure custom fraud detection rules</p>
      </div>

      {/* Add Rule Button */}
      <button
        onClick={() => setShowAddRule(!showAddRule)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded transition"
      >
        <Plus size={20} />
        Create Rule
      </button>

      {/* Add Rule Form */}
      {showAddRule && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">Create New Rule</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Rule name"
              value={newRule.name}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <textarea
              placeholder="Rule description"
              value={newRule.description}
              onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              rows="2"
            />
            <input
              type="text"
              placeholder="Threshold/Condition"
              value={newRule.threshold}
              onChange={(e) => setNewRule({ ...newRule, threshold: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <select
              value={newRule.severity}
              onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Low">Low Severity</option>
              <option value="Medium">Medium Severity</option>
              <option value="High">High Severity</option>
              <option value="Critical">Critical Severity</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleAddRule}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
              >
                Create Rule
              </button>
              <button
                onClick={() => setShowAddRule(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map(rule => (
          <div key={rule.id} className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-white">{rule.name}</h3>
                  <span className={`text-xs font-semibold px-3 py-1 rounded ${getSeverityColor(rule.severity)}`}>
                    {rule.severity}
                  </span>
                  {rule.enabled ? (
                    <span className="text-xs bg-green-900 text-green-300 px-3 py-1 rounded">Active</span>
                  ) : (
                    <span className="text-xs bg-red-900 text-red-300 px-3 py-1 rounded">Disabled</span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-3">{rule.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Threshold</p>
                    <p className="text-white">{rule.threshold}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">False Positive Rate</p>
                    <p className={`${rule.falsePositiveRate < 1 ? 'text-green-400' : rule.falsePositiveRate < 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {rule.falsePositiveRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Priority</p>
                    <p className="text-white">{rule.severity === 'Critical' ? 'P0' : rule.severity === 'High' ? 'P1' : 'P2'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleRule(rule.id)}
                  className={`p-2 rounded transition ${rule.enabled ? 'bg-green-900 hover:bg-green-800' : 'bg-gray-800 hover:bg-gray-700'}`}
                >
                  {rule.enabled ? (
                    <ToggleRight className="text-green-400" size={20} />
                  ) : (
                    <ToggleLeft className="text-gray-400" size={20} />
                  )}
                </button>
                <button className="bg-gray-800 hover:bg-gray-700 p-2 rounded transition">
                  <Edit2 className="text-blue-400" size={20} />
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="bg-gray-800 hover:bg-gray-700 p-2 rounded transition"
                >
                  <Trash2 className="text-red-400" size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rule Statistics */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 border border-blue-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Rule Engine Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-blue-200 text-sm mb-2">Active Rules</p>
            <p className="text-3xl font-bold text-white">{rules.filter(r => r.enabled).length}/{rules.length}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm mb-2">Avg False Positive</p>
            <p className="text-3xl font-bold text-white">{(rules.reduce((sum, r) => sum + r.falsePositiveRate, 0) / rules.length).toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm mb-2">Critical Rules</p>
            <p className="text-3xl font-bold text-white">{rules.filter(r => r.severity === 'Critical').length}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm mb-2">Rules Status</p>
            <p className="text-3xl font-bold text-green-400">✓ Healthy</p>
          </div>
        </div>
      </div>
    </div>
  );
}
