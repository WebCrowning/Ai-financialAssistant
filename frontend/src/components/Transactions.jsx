import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Plus, Edit2, Trash2, X, 
  FileText, Camera, DollarSign, ListOrdered, CheckCircle, 
  AlertTriangle, ChevronDown, Calendar, CreditCard, 
  Tag, TrendingUp, TrendingDown, Wallet, BarChart3,
  Eye, MoreVertical, Copy, Printer, RefreshCw
} from 'lucide-react';
import ReceiptScanner from './ReceiptScanner';
import IncomeLogger from './IncomeLogger';

// Professional color system
const COLORS = {
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  secondary: '#7c3aed',
  success: '#059669',
  successLight: '#d1fae5',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  warning: '#d97706',
  warningLight: '#fef3c7',
  purple: '#7c3aed',
  purpleLight: '#ede9fe',
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
  }
};

export default function Transactions({ token }) {
  const [activeTab, setActiveTab] = useState('expenses');
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [accountFilter, setAccountFilter] = useState('All');
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm] = useState({ 
    amount: '', 
    category: '', 
    description: '', 
    date: '', 
    account: '' 
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const [expRes, incRes] = await Promise.all([
        fetch('/api/expenses', { headers }),
        fetch('/api/income', { headers })
      ]);
      if (expRes.ok) setExpenses(await expRes.json());
      if (incRes.ok) setIncomes(await incRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense record permanently?')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (res.ok) {
        setSuccess('Expense deleted successfully.');
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) { 
      setError('Failed to delete expense.'); 
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedExpenses.length} selected expenses?`)) return;
    try {
      await Promise.all(
        selectedExpenses.map(id => 
          fetch(`/api/expenses/${id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${token}` } 
          })
        )
      );
      setSuccess(`${selectedExpenses.length} expenses deleted.`);
      setSelectedExpenses([]);
      setShowBulkActions(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete expenses.');
    }
  };

  const startEdit = (exp) => {
    setEditingExpense(exp);
    setEditForm({
      amount: exp.amount,
      category: exp.category,
      description: exp.description,
      date: exp.date.split('T')[0],
      account: exp.account || 'Main Bank Account'
    });
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setSuccess('Expense updated successfully.');
        setEditingExpense(null);
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Update failed');
      }
    } catch (err) { 
      setError('Update failed.'); 
    }
  };

  const handleExportCSV = () => {
    let dataToExport = activeTab === 'expenses' ? expenses : incomes;
    const headers = activeTab === 'expenses' 
      ? ['Date', 'Description', 'Category', 'Account', 'Amount']
      : ['Date', 'Source', 'Category', 'Amount', 'Type'];
      
    const rows = dataToExport.map(item => activeTab === 'expenses'
      ? [new Date(item.date).toLocaleDateString(), item.description, item.category, item.account || 'Main Bank Account', item.amount]
      : [new Date(item.date).toLocaleDateString(), item.source, item.category, item.amount, item.is_irregular ? 'Irregular' : 'Regular']
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); 
    link.click(); 
    document.body.removeChild(link);
  };

  const toggleExpenseSelection = (id) => {
    setSelectedExpenses(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedExpenses.length === filteredExpenses.length) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(filteredExpenses.map(e => e.id));
    }
  };

  const filteredExpenses = expenses
    .filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = categoryFilter === 'All' || t.category === categoryFilter;
      const matchesAcc = accountFilter === 'All' || (t.account || 'Main Bank Account') === accountFilter;
      return matchesSearch && matchesCat && matchesAcc;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc' 
          ? new Date(b.date) - new Date(a.date)
          : new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'amount') {
        return sortOrder === 'desc' 
          ? parseFloat(b.amount) - parseFloat(a.amount)
          : parseFloat(a.amount) - parseFloat(b.amount);
      }
      return 0;
    });

  const categories = ['All', ...new Set(expenses.map(t => t.category))];
  const accounts = ['All', 'Main Bank Account', 'MTN MoMo', 'Orange Money', 'Virtual Card'];

  // Calculate summary stats
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const avgExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;
  const uniqueCategories = new Set(filteredExpenses.map(e => e.category)).size;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.headerIconWrapper}>
            <FileText size={24} style={{ color: COLORS.primary }} />
          </div>
          <div>
            <h1 style={styles.title}>Transaction Management</h1>
            <p style={styles.subtitle}>Complete control over your financial records</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button onClick={handleExportCSV} style={styles.exportBtn}>
            <Download size={16} />
            Export CSV
          </button>
          <button onClick={fetchData} style={styles.refreshBtn}>
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <div style={styles.errorAlert}>
          <AlertTriangle size={18} />
          {error}
        </div>
      )}
      {success && (
        <div style={styles.successAlert}>
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabsContainer}>
        {[
          { id: 'expenses', label: 'Expense Manager', icon: ListOrdered },
          { id: 'income', label: 'Income Registry', icon: DollarSign },
          { id: 'receipts', label: 'Receipt Scanner', icon: Camera }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {})
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'receipts' && (
        <div style={styles.tabContent}>
          <ReceiptScanner token={token} onRefresh={fetchData} />
        </div>
      )}

      {activeTab === 'income' && (
        <div style={styles.tabContent}>
          <IncomeLogger incomes={incomes} token={token} onRefresh={fetchData} />
        </div>
      )}

      {activeTab === 'expenses' && (
        <div style={styles.expenseContent}>
          {/* Stats Summary */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Total Expenses</span>
              <span style={{...styles.statValue, color: COLORS.danger}}>
                CFA {totalExpenses.toLocaleString()}
              </span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Average Expense</span>
              <span style={styles.statValue}>
                CFA {avgExpense.toLocaleString()}
              </span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Categories Used</span>
              <span style={styles.statValue}>{uniqueCategories}</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>Total Transactions</span>
              <span style={styles.statValue}>{filteredExpenses.length}</span>
            </div>
          </div>

          {/* Filters */}
          <div style={styles.filtersContainer}>
            <div style={styles.searchWrapper}>
              <Search size={18} style={styles.searchIcon} />
              <input
                type="text"
                style={styles.searchInput}
                placeholder="Search by description or category..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div style={styles.filterGroup}>
              <select 
                style={styles.filterSelect}
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                {categories.map(c => (
                  <option key={c} value={c} style={{ background: COLORS.gray[900] }}>
                    {c === 'All' ? 'All Categories' : c}
                  </option>
                ))}
              </select>

              <select 
                style={styles.filterSelect}
                value={accountFilter}
                onChange={e => setAccountFilter(e.target.value)}
              >
                {accounts.map(a => (
                  <option key={a} value={a} style={{ background: COLORS.gray[900] }}>
                    {a === 'All' ? 'All Accounts' : a}
                  </option>
                ))}
              </select>

              <select 
                style={styles.filterSelect}
                value={`${sortBy}-${sortOrder}`}
                onChange={e => {
                  const [by, order] = e.target.value.split('-');
                  setSortBy(by);
                  setSortOrder(order);
                }}
              >
                <option value="date-desc" style={{ background: COLORS.gray[900] }}>Newest First</option>
                <option value="date-asc" style={{ background: COLORS.gray[900] }}>Oldest First</option>
                <option value="amount-desc" style={{ background: COLORS.gray[900] }}>Highest Amount</option>
                <option value="amount-asc" style={{ background: COLORS.gray[900] }}>Lowest Amount</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedExpenses.length > 0 && (
            <div style={styles.bulkActions}>
              <span style={styles.bulkCount}>
                {selectedExpenses.length} transactions selected
              </span>
              <div style={styles.bulkActionsGroup}>
                <button style={styles.bulkActionBtn}>
                  <Copy size={14} />
                  Duplicate
                </button>
                <button style={styles.bulkActionBtn}>
                  <Printer size={14} />
                  Print
                </button>
                <button 
                  onClick={handleBulkDelete}
                  style={{...styles.bulkActionBtn, ...styles.bulkActionDanger}}
                >
                  <Trash2 size={14} />
                  Delete All
                </button>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <div style={styles.tableContainer}>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={{...styles.tableHeaderCell, width: '40px'}}>
                      <input
                        type="checkbox"
                        checked={selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0}
                        onChange={toggleSelectAll}
                        style={styles.checkbox}
                      />
                    </th>
                    <th style={styles.tableHeaderCell}>Date</th>
                    <th style={styles.tableHeaderCell}>Description</th>
                    <th style={styles.tableHeaderCell}>Category</th>
                    <th style={styles.tableHeaderCell}>Account</th>
                    <th style={{...styles.tableHeaderCell, textAlign: 'right'}}>Amount</th>
                    <th style={{...styles.tableHeaderCell, textAlign: 'center', width: '120px'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={styles.loadingState}>
                        <div style={styles.loadingSpinner}></div>
                        <span>Loading transactions...</span>
                      </td>
                    </tr>
                  ) : filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={styles.emptyState}>
                        <div style={styles.emptyStateIcon}>📭</div>
                        <p style={styles.emptyStateText}>No expense records found</p>
                        <span style={styles.emptyStateSub}>Try adjusting your filters</span>
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map(exp => (
                      <tr key={exp.id} style={styles.tableRow}>
                        <td style={styles.tableCell}>
                          <input
                            type="checkbox"
                            checked={selectedExpenses.includes(exp.id)}
                            onChange={() => toggleExpenseSelection(exp.id)}
                            style={styles.checkbox}
                          />
                        </td>
                        <td style={styles.tableCell}>
                          <div style={styles.dateCell}>
                            <Calendar size={14} style={{ color: COLORS.gray[400] }} />
                            <span>{new Date(exp.date).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td style={{...styles.tableCell, fontWeight: '600'}}>
                          <div style={styles.descriptionCell}>
                            {exp.description}
                            {exp.is_unusual && (
                              <span style={styles.unusualBadge}>
                                <AlertTriangle size={12} />
                                Unusual
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          <span style={styles.categoryBadge}>
                            <Tag size={12} style={{ marginRight: '4px' }} />
                            {exp.category}
                          </span>
                        </td>
                        <td style={{...styles.tableCell, color: COLORS.gray[400]}}>
                          <div style={styles.accountCell}>
                            <CreditCard size={14} style={{ marginRight: '6px', color: COLORS.gray[400] }} />
                            {exp.account || 'Main Account'}
                          </div>
                        </td>
                        <td style={{...styles.tableCell, textAlign: 'right'}}>
                          <span style={styles.amountCell}>
                            -CFA {parseFloat(exp.amount).toLocaleString()}
                          </span>
                        </td>
                        <td style={{...styles.tableCell, textAlign: 'center'}}>
                          <div style={styles.actionButtons}>
                            <button 
                              onClick={() => startEdit(exp)} 
                              style={styles.actionBtn}
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteExpense(exp.id)} 
                              style={{...styles.actionBtn, ...styles.actionBtnDanger}}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            {filteredExpenses.length > 0 && (
              <div style={styles.tableFooter}>
                <span style={styles.tableFooterText}>
                  Showing {filteredExpenses.length} of {expenses.length} expenses
                </span>
                <div style={styles.pagination}>
                  <button style={styles.pageBtn}>Previous</button>
                  <button style={{...styles.pageBtn, ...styles.pageBtnActive}}>1</button>
                  <button style={styles.pageBtn}>2</button>
                  <button style={styles.pageBtn}>3</button>
                  <button style={styles.pageBtn}>Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingExpense && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Expense Record</h3>
              <button 
                onClick={() => setEditingExpense(null)} 
                style={styles.modalClose}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateExpense} style={styles.modalForm}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Amount (CFA)</label>
                  <input
                    type="number"
                    style={styles.formInput}
                    value={editForm.amount}
                    onChange={e => setEditForm(p => ({...p, amount: e.target.value}))}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Category</label>
                  <select
                    style={styles.formInput}
                    value={editForm.category}
                    onChange={e => setEditForm(p => ({...p, category: e.target.value}))}
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c} style={{ background: COLORS.gray[900] }}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Date</label>
                  <input
                    type="date"
                    style={styles.formInput}
                    value={editForm.date}
                    onChange={e => setEditForm(p => ({...p, date: e.target.value}))}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Account</label>
                  <select
                    style={styles.formInput}
                    value={editForm.account}
                    onChange={e => setEditForm(p => ({...p, account: e.target.value}))}
                  >
                    {accounts.filter(a => a !== 'All').map(a => (
                      <option key={a} value={a} style={{ background: COLORS.gray[900] }}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Description</label>
                <input
                  type="text"
                  style={styles.formInput}
                  value={editForm.description}
                  onChange={e => setEditForm(p => ({...p, description: e.target.value}))}
                  required
                />
              </div>

              <div style={styles.modalActions}>
                <button 
                  type="button" 
                  onClick={() => setEditingExpense(null)} 
                  style={styles.modalCancel}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.modalSubmit}>
                  Update Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
    background: COLORS.primaryLight,
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    margin: 0,
    fontSize: '28px',
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
    gap: '12px',
  },
  exportBtn: {
    padding: '10px 20px',
    background: 'white',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    color: COLORS.gray[700],
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  refreshBtn: {
    padding: '10px',
    background: 'white',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    color: COLORS.gray[600],
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  errorAlert: {
    padding: '12px 16px',
    background: COLORS.dangerLight,
    border: `1px solid ${COLORS.danger}`,
    borderRadius: '8px',
    color: COLORS.danger,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
  },
  successAlert: {
    padding: '12px 16px',
    background: COLORS.successLight,
    border: `1px solid ${COLORS.success}`,
    borderRadius: '8px',
    color: COLORS.success,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '20px',
  },
  tabsContainer: {
    display: 'flex',
    gap: '4px',
    background: 'white',
    borderRadius: '12px',
    padding: '4px',
    marginBottom: '24px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  tab: {
    flex: 1,
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    background: 'transparent',
    color: COLORS.gray[600],
    fontWeight: '600',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: COLORS.primary,
    color: 'white',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
  },
  tabContent: {
    marginTop: '10px',
  },
  expenseContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  filtersContainer: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchWrapper: {
    flex: '1 1 280px',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: COLORS.gray[400],
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px 10px 40px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.gray[200]}`,
    fontSize: '14px',
    background: COLORS.gray[50],
    color: COLORS.gray[900],
    transition: 'all 0.2s',
    outline: 'none',
  },
  filterGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  filterSelect: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.gray[200]}`,
    fontSize: '14px',
    background: COLORS.gray[50],
    color: COLORS.gray[900],
    minWidth: '150px',
    cursor: 'pointer',
    outline: 'none',
  },
  bulkActions: {
    background: COLORS.primaryLight,
    padding: '12px 20px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    border: `1px solid ${COLORS.primary}`,
  },
  bulkCount: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  bulkActionsGroup: {
    display: 'flex',
    gap: '8px',
  },
  bulkActionBtn: {
    padding: '6px 14px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '6px',
    background: 'white',
    color: COLORS.gray[700],
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s',
  },
  bulkActionDanger: {
    borderColor: COLORS.danger,
    color: COLORS.danger,
  },
  tableContainer: {
    background: 'white',
    borderRadius: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
    overflow: 'hidden',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    borderBottom: `2px solid ${COLORS.gray[200]}`,
    background: COLORS.gray[50],
  },
  tableHeaderCell: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: COLORS.gray[500],
    whiteSpace: 'nowrap',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: COLORS.primary,
  },
  tableRow: {
    borderBottom: `1px solid ${COLORS.gray[100]}`,
    transition: 'background 0.2s',
  },
  tableCell: {
    padding: '12px 16px',
    fontSize: '13px',
    color: COLORS.gray[700],
  },
  dateCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: COLORS.gray[600],
  },
  descriptionCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  unusualBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 8px',
    background: COLORS.warningLight,
    color: COLORS.warning,
    borderRadius: '12px',
  },
  categoryBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    background: COLORS.purpleLight,
    color: COLORS.purple,
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  accountCell: {
    display: 'flex',
    alignItems: 'center',
  },
  amountCell: {
    fontWeight: '700',
    color: COLORS.danger,
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
  },
  actionBtn: {
    padding: '6px 10px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '6px',
    background: 'white',
    color: COLORS.gray[600],
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
  },
  actionBtnDanger: {
    borderColor: COLORS.dangerLight,
    color: COLORS.danger,
  },
  tableFooter: {
    padding: '16px 20px',
    borderTop: `1px solid ${COLORS.gray[200]}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  tableFooterText: {
    fontSize: '13px',
    color: COLORS.gray[500],
  },
  pagination: {
    display: 'flex',
    gap: '6px',
  },
  pageBtn: {
    padding: '6px 14px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '6px',
    background: 'white',
    color: COLORS.gray[600],
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  pageBtnActive: {
    background: COLORS.primary,
    color: 'white',
    borderColor: COLORS.primary,
  },
  loadingState: {
    padding: '60px 0',
    textAlign: 'center',
    color: COLORS.gray[500],
  },
  loadingSpinner: {
    width: '32px',
    height: '32px',
    border: `3px solid ${COLORS.gray[200]}`,
    borderTop: `3px solid ${COLORS.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 12px',
  },
  emptyState: {
    padding: '60px 0',
    textAlign: 'center',
  },
  emptyStateIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  emptyStateText: {
    fontSize: '16px',
    fontWeight: '500',
    color: COLORS.gray[700],
    margin: 0,
  },
  emptyStateSub: {
    fontSize: '13px',
    color: COLORS.gray[400],
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '100%',
    maxWidth: '560px',
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  modalClose: {
    padding: '8px',
    border: 'none',
    background: COLORS.gray[100],
    borderRadius: '8px',
    color: COLORS.gray[500],
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  formInput: {
    padding: '10px 12px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    fontSize: '14px',
    background: COLORS.gray[50],
    color: COLORS.gray[900],
    outline: 'none',
    transition: 'all 0.2s',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  modalCancel: {
    flex: 1,
    padding: '12px',
    border: `1px solid ${COLORS.gray[200]}`,
    borderRadius: '8px',
    background: 'white',
    color: COLORS.gray[600],
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  modalSubmit: {
    flex: 2,
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    background: COLORS.primary,
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

// Add keyframes and hover styles
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .export-btn:hover, .refresh-btn:hover {
    background: ${COLORS.gray[50]};
    transform: translateY(-1px);
  }
  
  .tab:hover {
    background: ${COLORS.gray[50]};
  }
  
  .tab-active:hover {
    background: ${COLORS.primary};
  }
  
  .search-input:focus {
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 3px ${COLORS.primaryLight};
  }
  
  .filter-select:focus {
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 3px ${COLORS.primaryLight};
  }
  
  .table-row:hover {
    background: ${COLORS.gray[50]};
  }
  
  .action-btn:hover {
    background: ${COLORS.gray[100]};
    transform: scale(1.05);
  }
  
  .action-btn-danger:hover {
    background: ${COLORS.dangerLight};
    border-color: ${COLORS.danger};
  }
  
  .page-btn:hover {
    background: ${COLORS.gray[100]};
  }
  
  .page-btn-active:hover {
    background: ${COLORS.primary};
  }
  
  .bulk-action-btn:hover {
    background: ${COLORS.gray[50]};
    border-color: ${COLORS.gray[300]};
  }
  
  .bulk-action-danger:hover {
    background: ${COLORS.dangerLight};
    border-color: ${COLORS.danger};
  }
  
  .modal-close:hover {
    background: ${COLORS.gray[200]};
  }
  
  .form-input:focus {
    border-color: ${COLORS.primary};
    box-shadow: 0 0 0 3px ${COLORS.primaryLight};
  }
  
  .modal-cancel:hover {
    background: ${COLORS.gray[50]};
  }
  
  .modal-submit:hover {
    background: ${COLORS.secondary};
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }
`;
document.head.appendChild(styleSheet);