import React, { useState, useEffect } from 'react';
import cameroonCities from '../data/cameroonCities.json';

const JOB_CATEGORIES = [
  'Technology & IT',
  'Finance & Banking',
  'Customer Support',
  'Administration & HR',
  'Retail & Sales',
  'Healthcare',
  'Education',
  'Marketing & Media',
  'Construction & Real Estate',
  'Logistics & Transport',
  'General Services'
];

const JOB_TYPES = [
  'Full-Time',
  'Part-Time',
  'Remote',
  'Contract'
];

export default function JobForm({ initialJob = {}, onSubmit, onCancel }) {
  const [job, setJob] = useState({
    id: initialJob.id || null,
    title: initialJob.title || '',
    company: initialJob.company || '',
    location: initialJob.location || cameroonCities[0] || 'Douala',
    salary: initialJob.salary || '',
    description: initialJob.description || '',
    type: initialJob.type || 'Full-Time',
    category: initialJob.category || 'Technology & IT',
    image: initialJob.image || ''
  });

  const [imageSource, setImageSource] = useState(
    initialJob.image && !initialJob.image.startsWith('data:') ? 'url' : 'upload'
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJob(prev => ({ ...prev, [name]: value }));
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File is too large. Please select an image under 5MB.');
        return;
      }
      
      try {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${initialJob.token || localStorage.getItem('token')}` // fallback
          },
          body: formData
        });
        
        if (res.ok) {
          const data = await res.json();
          setJob(prev => ({ ...prev, image: data.url, image_url: data.url }));
        } else {
          alert('Failed to upload image.');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Error uploading image.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...job,
      id: job.id || Date.now()
    });
  };

  return (
    <div className="job-form-overlay">
      <div className="job-form-card">
        <div className="job-form-header">
          <h3 className="job-form-title">{initialJob.id ? 'Edit Job Posting' : 'Post a New Job'}</h3>
          <button className="job-form-close" onClick={onCancel} title="Close Form">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="job-form-body">
            {/* Title & Company */}
            <div className="form-grid-2">
              <div className="form-field">
                <label>Job Title *</label>
                <input 
                  type="text" 
                  name="title" 
                  value={job.title} 
                  onChange={handleChange} 
                  placeholder="e.g. Senior Accountant" 
                  required 
                />
              </div>
              <div className="form-field">
                <label>Company Name *</label>
                <input 
                  type="text" 
                  name="company" 
                  value={job.company} 
                  onChange={handleChange} 
                  placeholder="e.g. FinVision Corp" 
                  required 
                />
              </div>
            </div>

            {/* Category & Type */}
            <div className="form-grid-2">
              <div className="form-field">
                <label>Category *</label>
                <select name="category" value={job.category} onChange={handleChange}>
                  {JOB_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Job Type *</label>
                <select name="type" value={job.type} onChange={handleChange}>
                  {JOB_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location & Salary */}
            <div className="form-grid-2">
              <div className="form-field">
                <label>City (Location) *</label>
                <select name="location" value={job.location} onChange={handleChange}>
                  {cameroonCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Salary (e.g. CFA 150,000 / month) *</label>
                <input 
                  type="text" 
                  name="salary" 
                  value={job.salary} 
                  onChange={handleChange} 
                  placeholder="e.g. CFA 120,000 / month" 
                  required 
                />
              </div>
            </div>

            {/* Image Selection / Preview */}
            <div className="form-field">
              <label>Company Logo / Image</label>
              
              <div className="image-upload-tabs">
                <button 
                  type="button" 
                  className={`image-tab-btn ${imageSource === 'upload' ? 'active' : ''}`}
                  onClick={() => setImageSource('upload')}
                >
                  Upload File
                </button>
                <button 
                  type="button" 
                  className={`image-tab-btn ${imageSource === 'url' ? 'active' : ''}`}
                  onClick={() => setImageSource('url')}
                >
                  Image URL
                </button>
              </div>

              {imageSource === 'upload' ? (
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  style={{ padding: '8px' }}
                />
              ) : (
                <input 
                  type="text" 
                  name="image" 
                  value={job.image.startsWith('data:') ? '' : job.image} 
                  onChange={handleChange} 
                  placeholder="Paste direct URL (e.g. https://example.com/logo.png)" 
                />
              )}

              {/* Image Preview Window */}
              <div className="job-form-preview-row">
                <div className="job-form-preview-thumb">
                  {job.image ? (
                    <img src={job.image} alt="Preview" className="job-form-preview-img" />
                  ) : (
                    <span className="job-form-preview-placeholder">🏢</span>
                  )}
                </div>
                <div className="job-form-preview-details">
                  <strong>Live Preview</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                    {job.image ? 'Custom image loaded' : 'No image attached (will use default initial)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="form-field">
              <label>Job Description *</label>
              <textarea 
                name="description" 
                value={job.description} 
                onChange={handleChange} 
                rows={4} 
                placeholder="Outline duties, qualifications, and benefits..." 
                required 
              />
            </div>
          </div>

          <div className="job-form-footer">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
              {initialJob.id ? 'Save Changes' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
