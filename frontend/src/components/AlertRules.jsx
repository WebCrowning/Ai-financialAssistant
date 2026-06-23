import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Bell } from 'lucide-react';

export default function AlertRules() {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      name: 'Critical Fraud Detected',
      condition: 'Risk Score > 90',
      severity: 'Critical',
      notifications: ['Email', 'SMS', 'Dashboard'],
      enabled: true,
      triggerCount: 47
    },
    {
      id: 2,
      name: 'High Risk Transaction',
      condition: 'Risk Score > 75',
      severity: 'High',
      notifications: ['Email', 'Dashboard'],
      enabled: true,
      triggerCount: 312
    },
    {
      id: 3,
      name: 'Suspicious Velocity Pattern',
      condition: '> 5 transactions in 60 seconds',
      severity: 'High',
      notifications: ['Dashboard', 'SMS'],
      enabled: true,
      triggerCount: 89
    },
    {
      id: 4,
      name: 'Medium Risk Alert',
      condition: 'Risk Score between 60-75',
      severity: 'Medium',
      notifications: ['Dashboard'],
      enabled: true,
      triggerCount: 1248
    },
    {
      id: 5,
      name: 'Card Testing Detected',
      condition: 'Multiple small transactions detected',
      severity: 'Critical',
      notifications: ['Email', 'SMS', 'Dashboard', 'Webhook'],
      enabled: true,
      triggerCount: 23
    }
  ]);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: '',
    condition: '',
    severity: 'Medium',
    notifications: []
  });

  const handleAddAlert = () => {
    if (newAlert.name && newAlert.condition) {
      setAlerts([...alerts, {
        id: alerts.length + 1,
        ...newAlert,
        enabled: true,
        triggerCount: 0
      }]);
      setNewAlert({ name: '', condition: '', severity: 'Medium', notifications: [] });
      setShowAddAlert(false);
    }
  };

  const deleteAlert = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const toggleNotification = (id, notification) => {
    setAlerts(alerts.map(a =>
      a.id === id
        ? {
            ...a,
            notifications: a.notifications.includes(notification)
              ? a.notifications.filter(n => n !== notification)
              : [...a.notifications, notification]
          }
        : a
    ));
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'text-red-400 bg-red-900';
      case 'High': return 'text-orange-400 bg-orange-900';
      case 'Medium': return 'text-yellow-400 bg-yellow-900';
      default: return 'text-blue-400 bg-blue-900';
    }
  };

  const notificationMethods = ['Email', 'SMS', 'Dashboard', 'Webhook', 'Slack'];

  return (
    <div className="p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Alert Rules Configuration</h1>
        <p className="text-gray-400">Set up and manage fraud alert triggers and notifications</p>
      </div>

      {/* Add Alert Button */}
      <button
        onClick={() => setShowAddAlert(!showAddAlert)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded transition"
      >
        <Plus size={20} />
        Create Alert Rule
      </button>

      {/* Add Alert Form */}
      {showAddAlert && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">Create New Alert Rule</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Alert name"
              value={newAlert.name}
              onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Trigger condition"
              value={newAlert.condition}
              onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <select
              value={newAlert.severity}
              onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Low">Low Severity</option>
              <option value="Medium">Medium Severity</option>
              <option value="High">High Severity</option>
              <option value="Critical">Critical Severity</option>
            </select>
            <div>
              <p className="text-gray-300 text-sm mb-2">Notification Methods:</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {notificationMethods.map(method => (
                  <label key={method} className="flex items-center gap-2 text-gray-300 cursor-pointer hover:text-white transition">
                    <input
                      type="checkbox"
                      checked={newAlert.notifications.includes(method)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewAlert({
                            ...newAlert,
                            notifications: [...newAlert.notifications, method]
                          });
                        } else {
                          setNewAlert({
                            ...newAlert,
                            notifications: newAlert.notifications.filter(n => n !== method)
                          });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddAlert}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition"
              >
                Create Alert
              </button>
              <button
                onClick={() => setShowAddAlert(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Rules List */}
      <div className="space-y-4">
        {alerts.map(alert => (
          <div key={alert.id} className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-white">{alert.name}</h3>
                  <span className={`text-xs font-semibold px-3 py-1 rounded ${getSeverityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  {alert.enabled ? (
                    <span className="text-xs bg-green-900 text-green-300 px-3 py-1 rounded">Active</span>
                  ) : (
                    <span className="text-xs bg-red-900 text-red-300 px-3 py-1 rounded">Disabled</span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-4">Condition: {alert.condition}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{alert.triggerCount}</p>
                <p className="text-xs text-gray-400">times triggered</p>
              </div>
            </div>

            {/* Notification Methods */}
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Notification Methods:</p>
              <div className="flex flex-wrap gap-2">
                {notificationMethods.map(method => (
                  <button
                    key={method}
                    onClick={() => toggleNotification(alert.id, method)}
                    className={`px-3 py-1 rounded text-xs transition ${
                      alert.notifications.includes(method)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-700">
              <button className="bg-gray-800 hover:bg-gray-700 p-2 rounded transition">
                <Edit2 className="text-blue-400" size={18} />
              </button>
              <button
                onClick={() => deleteAlert(alert.id)}
                className="bg-gray-800 hover:bg-gray-700 p-2 rounded transition"
              >
                <Trash2 className="text-red-400" size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Statistics */}
      <div className="bg-gradient-to-r from-blue-900 to-cyan-900 border border-blue-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Bell className="text-yellow-400" size={24} />
          Alert System Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <p className="text-blue-200 text-sm mb-2">Active Rules</p>
            <p className="text-3xl font-bold text-white">{alerts.filter(a => a.enabled).length}/{alerts.length}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm mb-2">Total Triggers</p>
            <p className="text-3xl font-bold text-white">{alerts.reduce((sum, a) => sum + a.triggerCount, 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm mb-2">Critical Alerts</p>
            <p className="text-3xl font-bold text-red-400">{alerts.filter(a => a.severity === 'Critical').length}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm mb-2">Notification Methods</p>
            <p className="text-3xl font-bold text-white">{new Set(alerts.flatMap(a => a.notifications)).size}</p>
          </div>
          <div>
            <p className="text-blue-200 text-sm mb-2">System Status</p>
            <p className="text-3xl font-bold text-green-400">✓ Operational</p>
          </div>
        </div>
      </div>
    </div>
  );
}
