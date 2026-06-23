import React, { useState, useEffect } from 'react';
import '../styles/Jobs.css';
import JobCard from './JobCard';
import JobForm from './JobForm';

export default function AdminLocalJobs({ token }) {
  const [jobs, setJobs] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchJobs();
  }, [token]);

  const handleAdd = () => {
    setEditingJob(null);
    setShowForm(true);
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job listing?')) {
      try {
        const res = await fetch(`/api/jobs/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          fetchJobs();
        } else {
          alert('Failed to delete job.');
        }
      } catch (error) {
        console.error('Error deleting job:', error);
      }
    }
  };

  const handleSubmit = async (job) => {
    try {
      const url = job.id ? `/api/jobs/${job.id}` : '/api/jobs';
      const method = job.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(job)
      });
      
      if (res.ok) {
        fetchJobs();
        setShowForm(false);
        setEditingJob(null);
      } else {
        alert('Failed to save job.');
      }
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingJob(null);
  };

  return (
    <div className="admin-jobs-page animate-slide-in">
      {/* Admin Panel Header */}
      <div className="admin-jobs-header-row">
        <div>
          <h2 style={{ color: '#1e293b', margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>
            Manage Local Job Listings
          </h2>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Add, update, or remove job listings shown to users. Currently hosting{' '}
            <strong style={{ color: '#3b82f6' }}>{jobs.length}</strong> active positions.
          </p>
        </div>
        <button className="admin-add-job-btn btn" onClick={handleAdd}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Job
        </button>
      </div>

      {/* Form Dialog Overlay */}
      {showForm && (
        <JobForm
          initialJob={editingJob || {}}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          token={token}
        />
      )}

      {/* Admin Listings Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading jobs...</div>
      ) : (
        <div className="jobs-grid">
          {jobs.length > 0 ? (
            jobs.map(job => (
              <JobCard
                key={job.id}
                job={{...job, image: job.image_url}} 
                isAdmin={true}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="jobs-empty-state" style={{ padding: '60px 24px' }}>
              <div className="jobs-empty-icon">📁</div>
              <h4 className="jobs-empty-title" style={{ color: '#475569' }}>No job listings created</h4>
              <p className="jobs-empty-subtitle" style={{ color: '#64748b' }}>
                Click the "Add New Job" button above to publish your first job listing.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
