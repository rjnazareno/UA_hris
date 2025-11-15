import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="logo">
            <h1>Nova<span>HR</span></h1>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <button onClick={() => navigate('/login')} className="login-btn">
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Welcome to <span className="brand-name">NovaHR</span>
            </h1>
            <p className="hero-subtitle">
              Your Complete Human Resource Information System
            </p>
            <p className="hero-description">
              Streamline your HR operations with NovaHR - the modern, intuitive HRIS 
              designed to simplify employee management, payroll, and workforce analytics.
            </p>
            <div className="hero-cta">
              <button onClick={() => navigate('/login')} className="cta-primary">
                Get Started
              </button>
              <button className="cta-secondary">
                Learn More
              </button>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-illustration">
              <div className="illustration-card card-1">
                <span className="card-icon">👥</span>
                <span className="card-text">Employee Management</span>
              </div>
              <div className="illustration-card card-2">
                <span className="card-icon">💼</span>
                <span className="card-text">Payroll Processing</span>
              </div>
              <div className="illustration-card card-3">
                <span className="card-icon">📊</span>
                <span className="card-text">Analytics & Reports</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2>Powerful Features</h2>
            <p>Everything you need to manage your workforce efficiently</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Employee Management</h3>
              <p>
                Centralize all employee information, track organizational structure, 
                and manage personnel records with ease.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏰</div>
              <h3>Time & Attendance</h3>
              <p>
                Automated time tracking, attendance monitoring, and leave management 
                to boost productivity.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Payroll Management</h3>
              <p>
                Process payroll accurately, manage compensation packages, and generate 
                detailed pay slips automatically.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Performance Tracking</h3>
              <p>
                Set goals, conduct evaluations, and track employee performance 
                throughout the year.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Recruitment</h3>
              <p>
                Streamline your hiring process from job posting to candidate 
                selection and onboarding.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics & Reports</h3>
              <p>
                Make data-driven decisions with comprehensive reports and 
                real-time workforce analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="section-container">
          <div className="benefits-content">
            <div className="benefits-text">
              <h2>Why Choose NovaHR?</h2>
              <div className="benefit-item">
                <div className="benefit-icon">✨</div>
                <div className="benefit-text">
                  <h4>Intuitive Interface</h4>
                  <p>User-friendly design that requires minimal training</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🔒</div>
                <div className="benefit-text">
                  <h4>Secure & Compliant</h4>
                  <p>Enterprise-grade security with data privacy compliance</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">⚡</div>
                <div className="benefit-text">
                  <h4>Fast & Reliable</h4>
                  <p>Lightning-fast performance with 99.9% uptime</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🌐</div>
                <div className="benefit-text">
                  <h4>Cloud-Based</h4>
                  <p>Access your data anytime, anywhere from any device</p>
                </div>
              </div>
            </div>
            <div className="benefits-visual">
              <div className="stats-showcase">
                <div className="stat-item">
                  <h3>10,000+</h3>
                  <p>Active Users</p>
                </div>
                <div className="stat-item">
                  <h3>99.9%</h3>
                  <p>Uptime</p>
                </div>
                <div className="stat-item">
                  <h3>24/7</h3>
                  <p>Support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="section-container">
          <div className="section-header">
            <h2>About NovaHR HRIS</h2>
            <p>
              NovaHR is a comprehensive Human Resource Information System designed to 
              modernize and streamline your HR operations. Built with the latest 
              technologies and best practices, NovaHR empowers organizations to manage 
              their most valuable asset - their people.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Transform Your HR Operations?</h2>
          <p>Join thousands of companies already using NovaHR to streamline their HR processes</p>
          <button onClick={() => navigate('/login')} className="cta-button">
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="landing-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <h3>Nova<span style={{color: '#FF6B35'}}>HR</span> HRIS</h3>
              </div>
              <p>Modern HR management for modern businesses</p>
            </div>
            <div className="footer-section">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#pricing">Pricing</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Company</h4>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li><a href="#help">Help Center</a></li>
                <li><a href="#docs">Documentation</a></li>
                <li><a href="#contact">Contact Support</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 NovaHR HRIS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
