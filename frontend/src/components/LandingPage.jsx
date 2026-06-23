import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowRight, Brain, CreditCard, Shield, ChevronDown,
  Check, Sparkles, Zap, Lock, ShoppingBag,
  BarChart3, Star, Play
} from 'lucide-react';
import '../styles/landing.css';
import logoImage from '../assets/logo.png';

// Constants
const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80&auto=format&fit=crop',
  aiDashboard: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80&auto=format&fit=crop',
  virtualCard: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&q=80&auto=format&fit=crop',
  security: 'https://images.unsplash.com/photo-1573497019236-17f8177b81e8?w=600&q=80&auto=format&fit=crop',
  store: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80&auto=format&fit=crop',
};

// Data
const FAQ_DATA = [
  {
    id: 0,
    question: 'How does the Financial AI Assistant work?',
    answer: 'FinVision uses AI pipelines to analyze your transactions, categorize spending, and generate predictive forecasts. Ask questions in natural language or upload bank statements for instant insights.'
  },
  {
    id: 1,
    question: 'Are the Virtual Cards real credit cards?',
    answer: 'No. FinVision is a financial simulation sandbox for educational and spend-management testing. The virtual cards generate realistic credentials for testing without using real money.'
  },
  {
    id: 2,
    question: 'What is the Sentinel Guardian Mode?',
    answer: 'Guardian Mode is an automated protection system that monitors transactions in real-time. It detects unusual patterns or values exceeding your budget caps, triggering automatic blocks to prevent overspending.'
  },
  {
    id: 3,
    question: 'Can I test checkout flows with the Simulation Store?',
    answer: 'Yes! Our mock storefront contains 35+ electronics products. Add items to your cart and check out using Virtual Cards. Approved purchases reduce card limits and sync to your transaction ledger instantly.'
  },
  {
    id: 4,
    question: 'Is my data secure on the platform?',
    answer: 'Since FinVision is a simulation environment, no real financial data is processed. All data stays within your local deployment and can be reset at any time. The platform is designed for learning and testing.'
  }
];

const TESTIMONIALS = [
  {
    id: 0,
    text: "FinVision completely changed how I understand personal finance. The AI advisor gives incredibly detailed breakdowns of my spending patterns.",
    name: "Sarah Chen",
    role: "Finance Student",
    avatarColor: '#dbeafe',
    textColor: '#2563eb'
  },
  {
    id: 1,
    text: "The virtual card system feels so real. I used it to teach my team about e-commerce checkout flows and fraud detection without any risk.",
    name: "Marcus Johnson",
    role: "Product Manager",
    avatarColor: '#ede9fe',
    textColor: '#7c3aed'
  },
  {
    id: 2,
    text: "Guardian Mode caught spending patterns I never would have noticed. The budget alerts and automated blocking are game-changers for self-discipline.",
    name: "Aisha Patel",
    role: "MBA Candidate",
    avatarColor: '#d1fae5',
    textColor: '#10b981'
  }
];

const STATS = [
  { value: '99.8%', label: 'Fraud Detection Rate' },
  { value: '35+', label: 'Store Products' },
  { value: '<100ms', label: 'Response Time' },
  { value: '$0', label: 'Real Money at Risk' }
];

const FEATURES = [
  {
    id: 0,
    title: 'AI Financial Advisor',
    description: 'Get intelligent spending analysis, predictive forecasts, and personalized budget recommendations powered by advanced AI models. Upload statements for instant insights.',
    image: IMAGES.aiDashboard,
    icon: Brain,
    iconColor: '#3b82f6',
    iconBg: 'rgba(59, 130, 246, 0.08)'
  },
  {
    id: 1,
    title: 'Virtual Card Studio',
    description: 'Generate sandbox Visa and Mastercards instantly. Customize designs, set spending limits, manage billing details, and flip cards to reveal CVV in real time.',
    image: IMAGES.virtualCard,
    icon: CreditCard,
    iconColor: '#7c3aed',
    iconBg: 'rgba(124, 58, 237, 0.08)'
  },
  {
    id: 2,
    title: 'Sentinel Protection',
    description: 'Activate Guardian Mode for real-time transaction monitoring. Automatic blocking of over-limit purchases, duplicate payments, and suspicious activity patterns.',
    image: IMAGES.security,
    icon: Shield,
    iconColor: '#10b981',
    iconBg: 'rgba(16, 185, 129, 0.08)'
  }
];

const SENTINEL_FEATURES = [
  {
    id: 0,
    icon: Zap,
    title: 'Real-Time Monitoring',
    description: 'Live activity logs track every checkout and authorization event as it happens.',
    color: '#3b82f6',
    bg: 'rgba(96, 165, 250, 0.1)'
  },
  {
    id: 1,
    icon: Lock,
    title: 'Smart Rules Engine',
    description: 'Define blocking policies and budget thresholds that activate automatically.',
    color: '#7c3aed',
    bg: 'rgba(167, 139, 250, 0.1)'
  },
  {
    id: 2,
    icon: BarChart3,
    title: 'ML Risk Scoring',
    description: 'Simulated machine learning classifiers assign risk scores to every transaction.',
    color: '#10b981',
    bg: 'rgba(52, 211, 153, 0.1)'
  }
];

// Sub-components
const SectionHeader = ({ tag, title, subtitle }) => (
  <div className="lp-section-title-wrapper">
    <span className="lp-section-tag">{tag}</span>
    <h2 className="lp-section-title">{title}</h2>
    {subtitle && <p className="lp-section-subtitle">{subtitle}</p>}
  </div>
);

const FeatureCard = ({ title, description, image, icon: Icon, iconColor, iconBg }) => (
  <div className="lp-pillar-card">
    <img src={image} alt={title} className="lp-pillar-image" loading="lazy" />
    <div className="lp-pillar-icon-wrapper" style={{ background: iconBg, color: iconColor }}>
      <Icon size={24} />
    </div>
    <h3 className="lp-pillar-title">{title}</h3>
    <p className="lp-pillar-desc">{description}</p>
  </div>
);

const FeatureItem = ({ icon: Icon, title, description, color, bg }) => (
  <div className="lp-feature-item">
    <div className="lp-feature-icon-wrap" style={{ background: bg, color }}>
      <Icon size={22} />
    </div>
    <div>
      <h4 className="lp-feature-title">{title}</h4>
      <p className="lp-feature-desc">{description}</p>
    </div>
  </div>
);

const TestimonialCard = ({ text, name, role, avatarColor, textColor }) => (
  <div className="lp-testimonial-card">
    <div className="lp-testimonial-stars">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={16} fill="#f59e0b" stroke="#f59e0b" />
      ))}
    </div>
    <p className="lp-testimonial-text">"{text}"</p>
    <div className="lp-testimonial-author">
      <div className="lp-testimonial-avatar" style={{
        background: avatarColor,
        color: textColor,
        fontWeight: 700,
        fontSize: '16px'
      }}>
        {name[0]}
      </div>
      <div>
        <div className="lp-testimonial-name">{name}</div>
        <div className="lp-testimonial-role">{role}</div>
      </div>
    </div>
  </div>
);

const FAQItem = ({ question, answer, isOpen, onToggle }) => (
  <div className="lp-faq-item">
    <button className="lp-faq-trigger" onClick={onToggle} aria-expanded={isOpen}>
      <span>{question}</span>
      <ChevronDown
        size={18}
        style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.25s ease',
          color: 'var(--lp-text-light)',
          flexShrink: 0
        }}
      />
    </button>
    {isOpen && <div className="lp-faq-content">{answer}</div>}
  </div>
);

// Main Component
export default function LandingPage({ onNavigateLogin, onNavigateRegister }) {
  const [openFaqId, setOpenFaqId] = useState(null);
  const [visibleStats, setVisibleStats] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisibleStats(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const toggleFaq = useCallback((id) => {
    setOpenFaqId(prev => prev === id ? null : id);
  }, []);

  const handleScroll = useCallback((e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const navLinks = useMemo(() => [
    { id: 'features', label: 'Features' },
    { id: 'sentinel', label: 'Sentinel' },
    { id: 'sandbox', label: 'Store' },
    { id: 'testimonials', label: 'Reviews' },
    { id: 'faq', label: 'FAQ' }
  ], []);

  return (
    <div className="landing-page">
      {/* Background decorations */}
      <div className="lp-glow-1" aria-hidden="true" />
      <div className="lp-glow-2" aria-hidden="true" />

      {/* Header */}
      <header className="lp-header" role="banner">
        <div className="lp-logo">
          <img src={logoImage} alt="FinVision Logo" className="lp-logo-img" />
          <span className="lp-logo-text">FinVision</span>
        </div>

        <nav className="lp-nav" role="navigation" aria-label="Main navigation">
          {navLinks.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="lp-nav-link"
              onClick={(e) => handleScroll(e, id)}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="lp-header-actions">
          <button onClick={onNavigateLogin} className="lp-btn-login" aria-label="Sign in to your account">
            Sign In
          </button>
          <button onClick={onNavigateRegister} className="lp-btn-signup" aria-label="Create a new account">
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="lp-hero" aria-label="Hero">
        <div className="lp-hero-content">
          <span className="lp-hero-tag">
            <Sparkles size={14} aria-hidden="true" />
            AI-Powered Financial Platform
          </span>
          <h1 className="lp-hero-title">
            Smart Money Management with{' '}
            <span>AI Intelligence</span>
          </h1>
          <p className="lp-hero-desc">
            Plan budgets, provision virtual cards, detect fraud patterns, and test spending scenarios — all in one powerful simulation platform.
          </p>

          <div className="lp-hero-actions">
            <button onClick={onNavigateRegister} className="lp-btn-primary">
              Start Free Today
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <a href="#features" style={{ textDecoration: 'none' }}>
              <button className="lp-btn-secondary">
                <Play size={16} aria-hidden="true" style={{ marginRight: '6px' }} />
                Explore Features
              </button>
            </a>
          </div>
        </div>

        <div className="lp-hero-image">
          <img
            src={IMAGES.hero}
            alt="FinVision Dashboard Analytics"
            loading="eager"
            width={800}
            height={600}
          />
        </div>
      </section>

      {/* Stats */}
      <section className="lp-stats" style={{ opacity: visibleStats ? 1 : 0, transition: 'opacity 0.8s ease' }}>
        {STATS.map(({ value, label }) => (
          <div key={label} className="lp-stat-item">
            <span className="lp-stat-number">{value}</span>
            <span className="lp-stat-label">{label}</span>
          </div>
        ))}
      </section>

      {/* Features Section */}
      <section id="features" className="lp-section" style={{ background: '#f8fafc' }}>
        <div className="lp-container">
          <SectionHeader
            tag="Core Features"
            title="Everything You Need for Smart Finance"
            subtitle="Powerful tools that simulate real-world financial management with AI-driven insights"
          />

          <div className="lp-pillars-grid">
            {FEATURES.map(feature => (
              <FeatureCard key={feature.id} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Simulation Store Section */}
      <section id="sandbox" className="lp-section">
        <div className="lp-split">
          <div className="lp-split-content">
            <span className="lp-section-tag">Simulation Sandbox</span>
            <h2 className="lp-section-title" style={{ textAlign: 'left', marginBottom: '20px' }}>
              Test Your Cards in a Real Store
            </h2>
            <p style={{ color: 'var(--lp-text-muted)', lineHeight: 1.7, fontSize: '16px', margin: 0 }}>
              Our built-in e-commerce store features 35+ products including laptops, phones, and accessories.
              Use your virtual cards to make purchases and see transactions flow through your entire financial dashboard in real time.
            </p>

            <div className="lp-check-list">
              {[
                'Instant card verification & checkout',
                'Real-time spending limit deductions',
                'Transactions synced to your ledger',
                'Guardian Mode budget enforcement'
              ].map(text => (
                <div key={text} className="lp-check-item">
                  <div className="lp-check-icon"><Check size={16} aria-hidden="true" /></div>
                  <span className="lp-check-text">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <img
            src={IMAGES.store}
            alt="Simulation Store Interface"
            className="lp-split-image"
            loading="lazy"
            width={600}
            height={400}
          />
        </div>
      </section>

      {/* Sentinel Section */}
      <section id="sentinel" className="lp-section" style={{ background: '#f8fafc' }}>
        <div className="lp-container">
          <div className="lp-split lp-split-reverse">
            <div className="lp-demo-wrapper">
              <div className="lp-demo-header">
                <div className="lp-demo-dot" />
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lp-text-muted)' }}>
                  AI Financial Advisor — Live Preview
                </span>
              </div>
              <div className="lp-demo-body">
                <div className="lp-chat-msg">
                  <div className="lp-chat-avatar lp-chat-avatar-user" aria-hidden="true">👤</div>
                  <div className="lp-chat-bubble lp-chat-bubble-user">
                    What are my top spending categories this month?
                  </div>
                </div>

                <div className="lp-chat-msg lp-chat-msg-bot">
                  <div className="lp-chat-avatar lp-chat-avatar-bot" aria-hidden="true">🤖</div>
                  <div className="lp-chat-bubble lp-chat-bubble-bot">
                    Your top categories this month: <strong>Food ($1,200)</strong>, <strong>Shopping ($890)</strong>, and <strong>Transport ($340)</strong>.
                    <br /><br />
                    ⚠️ Your Shopping budget is at <strong>89% capacity</strong>. Guardian Mode will block purchases if you exceed the $1,000 threshold. Consider freezing your "Daily Expenses" card to stay on track.
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-split-content">
              <span className="lp-section-tag">Intelligent Protection</span>
              <h2 className="lp-section-title" style={{ textAlign: 'left', marginBottom: '20px' }}>
                AI That Guards Your Budget
              </h2>
              <p style={{ color: 'var(--lp-text-muted)', lineHeight: 1.7, fontSize: '16px', margin: '0 0 32px 0' }}>
                The Sentinel system combines ML-powered risk scoring with configurable rules to automatically detect and prevent over-spending. Get natural language insights about your financial health.
              </p>

              <div className="lp-features-grid" style={{ gridTemplateColumns: '1fr' }}>
                {SENTINEL_FEATURES.map(feature => (
                  <FeatureItem key={feature.id} {...feature} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="lp-section">
        <SectionHeader
          tag="What Users Say"
          title="Trusted by Finance Enthusiasts"
          subtitle="See how FinVision helps students, professionals, and teams master financial management"
        />

        <div className="lp-testimonials-grid">
          {TESTIMONIALS.map(testimonial => (
            <TestimonialCard key={testimonial.id} {...testimonial} />
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="lp-section" style={{ background: '#f8fafc' }}>
        <div className="lp-container">
          <SectionHeader
            tag="Support"
            title="Frequently Asked Questions"
          />

          <div className="lp-faq-container">
            {FAQ_DATA.map(({ id, question, answer }) => (
              <FAQItem
                key={id}
                question={question}
                answer={answer}
                isOpen={openFaqId === id}
                onToggle={() => toggleFaq(id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="lp-cta-section" aria-label="Call to action">
        <h2 className="lp-cta-title">Ready to Master Your Finances?</h2>
        <p className="lp-cta-desc">
          Create a free account and start exploring AI-powered budgeting, virtual cards, and spending simulations today.
        </p>
        <button onClick={onNavigateRegister} className="lp-btn-primary" style={{ margin: '0 auto' }}>
          Get Started Free
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </section>

      {/* Footer */}
      <footer className="lp-footer" role="contentinfo">
        <div className="lp-footer-grid">
          <div className="lp-footer-col">
            <div className="lp-logo" style={{ marginBottom: '4px' }}>
              <img src={logoImage} alt="FinVision Logo" className="lp-logo-img" />
              <span className="lp-logo-text">FinVision</span>
            </div>
            <p style={{ color: 'var(--lp-text-muted)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              AI-driven financial simulation platform. Master budgeting, card management, and fraud detection in a risk-free sandbox environment.
            </p>
          </div>

          <div className="lp-footer-col">
            <h4 className="lp-footer-title">Platform</h4>
            {navLinks.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="lp-footer-link"
                onClick={(e) => handleScroll(e, id)}
              >
                {label}
              </a>
            ))}
          </div>

          <div className="lp-footer-col">
            <h4 className="lp-footer-title">Resources</h4>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="lp-footer-link">GitHub</a>
            <a href="https://vite.dev" target="_blank" rel="noopener noreferrer" className="lp-footer-link">Vite</a>
            <a href="https://react.dev" target="_blank" rel="noopener noreferrer" className="lp-footer-link">React</a>
          </div>

          <div className="lp-footer-col">
            <h4 className="lp-footer-title">Legal</h4>
            <a href="#faq" className="lp-footer-link" onClick={(e) => handleScroll(e, 'faq')}>Privacy Policy</a>
            <a href="#faq" className="lp-footer-link" onClick={(e) => handleScroll(e, 'faq')}>Terms of Service</a>
            <a href="#faq" className="lp-footer-link" onClick={(e) => handleScroll(e, 'faq')}>Cookie Policy</a>
          </div>
        </div>

        <div className="lp-copyright">
          © {new Date().getFullYear()} FinVision. All rights reserved. Built for educational financial simulation.
        </div>
      </footer>
    </div>
  );
}