'use client';

import { useEffect, useState } from 'react';
import ScoreGauge from '../components/ScoreGauge';
import ResultCard from '../components/ResultCard';
import type { FormInput, ZillowData, ScoreResult } from '@/lib/types';

interface ResultData {
  input: FormInput;
  property: ZillowData;
  score: ScoreResult;
}

export default function ResultsPage() {
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('leaseUpResults');
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        setData(null);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="results-loading container container--narrow section">
        <div className="spinner" style={{ width: 48, height: 48 }} />
        <p>Loading your results…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="results-empty container container--narrow section">
        <h1>No Results Found</h1>
        <p>It looks like you haven&apos;t submitted an audit yet.</p>
        <a href="/#audit-form" className="btn btn--primary btn--large">
          Unlock Your Audit →
        </a>
      </div>
    );
  }

  const { input, property, score } = data;
  const displayAddress = property.address || 'Your Property';
  const displayLocation = property.city && property.state
    ? `${property.city}, ${property.state}`
    : '';

  return (
    <main className="results">
      {/* ===== NAV ===== */}
      <nav className="nav">
        <div className="container nav__inner">
          <a href="/" className="nav__logo">
            <img src="/logo.svg" alt="Hearth Property" className="nav__logo-img" />
          </a>
          <a href="/#audit-form" className="btn btn--secondary">
            New Audit
          </a>
        </div>
      </nav>

      {/* ===== RESULTS HEADER ===== */}
      <section className="results-header section">
        <div className="container container--narrow">
          <div className="results-header__top animate-fade-in-up">
            <div className="results-header__badge">Lease-Up Audit Report</div>
            <h1>
              Audit Results for{' '}
              <span className="gradient-text">{displayAddress}</span>
            </h1>
            <p className="results-header__meta">
              {displayLocation && `${displayLocation} · `}
              {property.bedrooms && `${property.bedrooms}bd/${property.bathrooms || '?'}ba · `}
              {property.sqft && `${property.sqft.toLocaleString()} sqft · `}
              ${input.askingRent.toLocaleString()}/mo
            </p>
            <a
              href={input.zillowUrl}
              className="results-header__zillow-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Zillow →
            </a>
          </div>
        </div>
      </section>

      {/* ===== SCORE + COST ===== */}
      <section className="results-score section">
        <div className="container container--narrow">
          <div className="results-score__grid">
            <div className="results-score__gauge-wrap glass-card animate-fade-in-up">
              <h3>Leasing Urgency</h3>
              <ScoreGauge score={score.urgencyScore} label={score.urgencyLabel} />
            </div>
            <div className="results-score__cost-wrap animate-fade-in-up animate-delay-1">
              <div className="cost-card glass-card">
                <span className="cost-card__label">Estimated Monthly Loss</span>
                <span className="cost-card__value cost-card__value--monthly">
                  ${score.estimatedMonthlyLoss.toLocaleString()}
                </span>
                <span className="cost-card__sub">per month of vacancy</span>
              </div>
              <div className="cost-card glass-card">
                <span className="cost-card__label">Projected Annual Impact</span>
                <span className="cost-card__value cost-card__value--annual">
                  ${score.estimatedAnnualLoss.toLocaleString()}
                </span>
                <span className="cost-card__sub">if vacancy continues</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINDINGS ===== */}
      <section className="results-findings section">
        <div className="container container--narrow">
          <h2 className="animate-fade-in-up">
            Key <span className="gradient-text">Findings</span>
          </h2>
          <div className="results-findings__list">
            {score.findings.map((finding, i) => (
              <ResultCard key={i} finding={finding} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== RECOMMENDATION ===== */}
      <section className="results-recommendation section">
        <div className="container container--narrow">
          <div className="recommendation-card glass-card animate-fade-in-up">
            <h3>Our Recommendation</h3>
            <p className="recommendation-card__text">{score.recommendation}</p>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="results-cta section">
        <div className="container container--narrow">
          <div className="cta-block animate-fade-in-up">
            <h2>Ready to Fix Your Vacancy?</h2>
            <p>Hearth&apos;s lease-up team can typically place a qualified tenant within 2–3 weeks. Let&apos;s talk.</p>
            <div className="cta-block__buttons">
              <a
                href="https://calendly.com/hearthproperty/30min"
                className="btn btn--primary btn--large"
                id="cta-book-call"
                target="_blank"
                rel="noopener noreferrer"
              >
                Book a Strategy Call
              </a>
              <a
                href="https://app.hearthproperty.com/onboarding"
                className="btn btn--secondary btn--large"
                id="cta-onboarding"
                target="_blank"
                rel="noopener noreferrer"
              >
                Start Onboarding
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="container footer__inner">
          <p>&copy; {new Date().getFullYear()} Hearth Property. All rights reserved.</p>
          <p className="footer__tagline">Hands-free property management for serious owners.</p>
        </div>
      </footer>
    </main>
  );
}
