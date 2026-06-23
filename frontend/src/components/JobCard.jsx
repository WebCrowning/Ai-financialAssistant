import React from 'react';

export default function JobCard({ job, onApply, isAdmin = false, onEdit, onDelete }) {
  // Map job types to modern design styles
  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'Full-Time': return 'bg-badge-fulltime';
      case 'Part-Time': return 'bg-badge-parttime';
      case 'Remote': return 'bg-badge-remote';
      case 'Contract': return 'bg-badge-contract';
      default: return 'bg-badge-parttime';
    }
  };

  const jobType = job.type || 'Full-Time';

  return (
    <div className="job-card-pro">
      {/* Admin Action Buttons */}
      {isAdmin && (
        <div className="admin-badge-row">
          <button 
            className="admin-action-btn edit" 
            onClick={() => onEdit && onEdit(job)} 
            title="Edit Job"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button 
            className="admin-action-btn delete" 
            onClick={() => onDelete && onDelete(job.id)} 
            title="Delete Job"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Top Meta info */}
      <div className="jcp-top-meta">
        <div className="jcp-logo-wrapper">
          {job.image ? (
            <img src={job.image} alt={`${job.company} logo`} className="jcp-logo-image" />
          ) : (
            <div className="jcp-logo-initials">
              {job.company ? job.company.charAt(0).toUpperCase() : 'J'}
            </div>
          )}
        </div>
        <span className={`jcp-type-badge ${getTypeBadgeClass(jobType)}`}>
          {jobType}
        </span>
      </div>

      {/* Content */}
      <div className="jcp-content">
        <div className="jcp-company">{job.company || 'Unknown Company'}</div>
        <h3 className="jcp-title">{job.title || 'Job Title'}</h3>
        <p className="jcp-desc">{job.description || 'No description provided.'}</p>
      </div>

      {/* Location and Category Row */}
      <div className="jcp-details-row">
        <span className="jcp-detail-item" title="Location">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {job.location || 'Cameroon'}
        </span>
        
        {job.category && (
          <span className="jcp-detail-item" title="Category">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {job.category}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="jcp-footer">
        <span className="jcp-salary" title="Salary">
          {job.salary || 'Negotiable'}
        </span>
        {!isAdmin && (
          <button className="jcp-apply-btn" onClick={() => onApply && onApply(job)}>
            Apply Now
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
