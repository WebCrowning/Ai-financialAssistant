import React, { useState, useEffect } from 'react';
import '../styles/Jobs.css';
import JobCard from '../components/JobCard';
import jobsData from '../data/jobs.json';
import cameroonCities from '../data/cameroonCities.json';

export default function LocalJobs() {
  const [jobs, setJobs] = useState([]);
  const [filterCity, setFilterCity] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Application modal state
  const [applyingJob, setApplyingJob] = useState(null);
  const [applicantInfo, setApplicantInfo] = useState({ name: '', email: '', phone: '', note: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/jobs', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          // Map backend image_url to frontend image field for compatibility with JobCard
          const mappedData = data.map(job => ({...job, image: job.image_url}));
          setJobs(mappedData);
        } else {
          setJobs(jobsData); // Fallback to static data if API fails
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setJobs(jobsData);
      }
    };
    fetchJobs();
  }, []);

  // Format phone number
  const formatPhone = (val) => {
    return val.replace(/\D/g, '').substring(0, 9);
  };

  // Get categories from active jobs list
  const categories = ['All', ...new Set(jobs.map(j => j.category).filter(Boolean))];

  // Filter logic
  const filteredJobs = jobs.filter(job => {
    const matchesCity = filterCity === 'All' || job.location === filterCity;
    const matchesCategory = filterCategory === 'All' || job.category === filterCategory;
    const matchesSearch = 
      searchTerm.trim() === '' || 
      (job.title && job.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.company && job.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (job.description && job.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCity && matchesCategory && matchesSearch;
  });

  const handleApplyClick = (job) => {
    setApplyingJob(job);
    setIsSubmitted(false);
    setApplicantInfo({ name: '', email: '', phone: '', note: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicantInfo(prev => ({
      ...prev,
      [name]: name === 'phone' ? formatPhone(value) : value
    }));
  };

  const handleApplySubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API request delay
    setTimeout(() => {
      // Save application details in localStorage to represent persistence
      const storedApps = localStorage.getItem('job_applications') || '[]';
      const parsedApps = JSON.parse(storedApps);
      parsedApps.push({
        id: Date.now(),
        jobId: applyingJob.id,
        jobTitle: applyingJob.title,
        company: applyingJob.company,
        ...applicantInfo,
        appliedAt: new Date().toISOString()
      });
      localStorage.setItem('job_applications', JSON.stringify(parsedApps));
      
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1200);
  };

  // Quick select cities to showcase in pills
  const featuredCities = ['All', 'Douala', 'Yaoundé', 'Buea', 'Bamenda', 'Garoua', 'Limbe', 'Bafoussam'];

  return (
    <div className="local-jobs-page animate-slide-in">
      {/* Hero Banner */}
      <div className="jobs-hero">
        <h1 className="jobs-hero-title">Local Job Opportunities</h1>
        <p className="jobs-hero-sub">
          Explore verify-listed employment and internship opportunities near you in Cameroon. Connect directly with employers and improve your financial resilience.
        </p>
      </div>

      {/* Filter and Search Section */}
      <div className="jobs-filter-container">
        <div className="jobs-search-row">
          <div className="jobs-search-input-wrapper">
            <svg className="jobs-search-icon" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              className="jobs-search-input" 
              placeholder="Search by job title, company, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="jobs-select-input"
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            title="Filter by category"
          >
            <option value="All">All Categories</option>
            {categories.filter(c => c !== 'All').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Cameroon Cities Quick Pills */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>Filter by City:</label>
          <div className="cities-pills-row">
            {featuredCities.map(city => (
              <button
                key={city}
                className={`city-pill ${filterCity === city ? 'active' : ''}`}
                onClick={() => setFilterCity(city)}
              >
                {city === 'All' ? '🌍 All Cities' : city}
              </button>
            ))}
            
            {/* Fallback Selector for other cities not in featured list */}
            {!featuredCities.includes(filterCity) && (
              <button className="city-pill active">
                📍 {filterCity}
              </button>
            )}
            
            <select
              style={{
                background: 'transparent',
                border: 'none',
                color: '#3b82f6',
                fontWeight: '600',
                fontSize: '0.85rem',
                cursor: 'pointer',
                outline: 'none',
                padding: '0 8px'
              }}
              value={featuredCities.includes(filterCity) ? 'More' : filterCity}
              onChange={(e) => {
                if (e.target.value !== 'More') {
                  setFilterCity(e.target.value);
                }
              }}
              title="Select more locations"
            >
              <option value="More" disabled>More Cities...</option>
              {cameroonCities.filter(c => !featuredCities.includes(c)).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Jobs Listings Grid */}
      <div className="jobs-grid">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <JobCard key={job.id} job={job} onApply={handleApplyClick} />
          ))
        ) : (
          <div className="jobs-empty-state">
            <div className="jobs-empty-icon">📂</div>
            <h4 className="jobs-empty-title">No jobs found matching your criteria</h4>
            <p className="jobs-empty-subtitle">Try adjusting your filters, city pills, or search keywords.</p>
          </div>
        )}
      </div>

      {/* Application Modal Popup */}
      {applyingJob && (
        <div className="jobs-modal-overlay animate-fade-in" onClick={() => setApplyingJob(null)}>
          <div className="jobs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="jobs-modal-header">
              <h3 className="jobs-modal-title">Apply for Job</h3>
              <button className="jobs-modal-close" onClick={() => setApplyingJob(null)} title="Close Modal">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleApplySubmit}>
                <div className="jobs-modal-body">
                  <div className="jobs-modal-job-summary">
                    <h4 className="jobs-modal-job-title">{applyingJob.title}</h4>
                    <p className="jobs-modal-job-comp">{applyingJob.company} • {applyingJob.location}</p>
                  </div>

                  <div className="form-field">
                    <label>Full Name *</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={applicantInfo.name} 
                      onChange={handleInputChange} 
                      placeholder="e.g. Marie Eyenga" 
                      required 
                    />
                  </div>

                  <div className="form-field">
                    <label>Email Address *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={applicantInfo.email} 
                      onChange={handleInputChange} 
                      placeholder="e.g. marie@gmail.com" 
                      required 
                    />
                  </div>

                  <div className="form-field">
                    <label>Phone Number (MTN / Orange) *</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        background: '#e2e8f0',
                        border: '1px solid #cbd5e1',
                        borderRight: 'none',
                        padding: '10px 12px',
                        borderTopLeftRadius: '8px',
                        borderBottomLeftRadius: '8px',
                        fontSize: '0.9rem',
                        color: '#475569'
                      }}>+237</span>
                      <input 
                        type="tel" 
                        name="phone" 
                        value={applicantInfo.phone} 
                        onChange={handleInputChange} 
                        placeholder="6XX XXX XXX" 
                        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label>Cover Note / Short Pitch *</label>
                    <textarea 
                      name="note" 
                      value={applicantInfo.note} 
                      onChange={handleInputChange} 
                      placeholder="Explain why you are a good fit for this role..." 
                      rows={3} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="job-form-footer" style={{ background: '#f8fafc' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setApplyingJob(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ padding: '10px 24px' }}>
                    {isSubmitting ? 'Sending...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="jobs-modal-success animate-scale-up">
                <div className="jobs-success-icon-wrapper">
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="jobs-success-title">Application Submitted!</h3>
                <p className="jobs-success-text">
                  Your application for the <strong>{applyingJob.title}</strong> role has been successfully transmitted to <strong>{applyingJob.company}</strong>. They will contact you shortly via email or phone.
                </p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setApplyingJob(null)} 
                  style={{ marginTop: '24px', padding: '10px 32px' }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
