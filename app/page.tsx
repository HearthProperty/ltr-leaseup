import LeaseUpForm from './components/LeaseUpForm';

export default function HomePage() {
  return (
    <main>
      {/* ===== NAV ===== */}
      <nav className="nav">
        <div className="container nav__inner">
          <a href="/" className="nav__logo">
            <span className="nav__logo-mark">H</span>
            <span className="nav__logo-text">Hearth</span>
          </a>
          <a href="#audit-form" className="btn btn--primary nav__cta">
            Unlock Your Free Audit
          </a>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero section">
        <div className="container">
          <div className="hero__content animate-fade-in-up">
            <div className="hero__badge">Free Lease-Up Audit</div>
            <h1 className="hero__title">
              Your Rental Is Sitting Vacant.
              <br />
              <span className="gradient-text">Find Out What It&apos;s Costing You.</span>
            </h1>
            <p className="hero__subtitle">
              Get an instant analysis of your vacancy cost, leasing urgency score,
              and a professional recommendation — in 60 seconds. No login required.
            </p>
            <a href="#audit-form" className="btn btn--primary btn--large hero__cta">
              Unlock Your Audit →
            </a>
          </div>

          {/* Trust signals */}
          <div className="hero__proof animate-fade-in-up animate-delay-2">
            <div className="proof-item">
              <div className="proof-item__icon">⚡</div>
              <div>
                <strong>60-Second Results</strong>
                <p>Instant vacancy analysis — no waiting</p>
              </div>
            </div>
            <div className="proof-item">
              <div className="proof-item__icon">🔒</div>
              <div>
                <strong>No Login Required</strong>
                <p>No account, no credit card, no strings</p>
              </div>
            </div>
            <div className="proof-item">
              <div className="proof-item__icon">📊</div>
              <div>
                <strong>Professional Audit</strong>
                <p>Real insights, not generic advice</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== WHY SECTION ===== */}
      <section className="why section">
        <div className="container container--narrow">
          <h2 className="why__title animate-fade-in-up">
            Every Day Your Property Sits Empty
            <br />
            <span className="gradient-text">Is Money You&apos;re Not Getting Back</span>
          </h2>
          <div className="why__grid">
            <div className="why__card glass-card animate-fade-in-up animate-delay-1">
              <div className="why__card-number">01</div>
              <h3>Vacancy Bleeds Cash</h3>
              <p>A $2,000/mo property vacant for 45 days costs you $3,000 — plus maintenance, utilities, and missed momentum.</p>
            </div>
            <div className="why__card glass-card animate-fade-in-up animate-delay-2">
              <div className="why__card-number">02</div>
              <h3>Stale Listings Repel Tenants</h3>
              <p>The longer your listing sits, the worse it performs. Prospective tenants see high days-on-market as a red flag.</p>
            </div>
            <div className="why__card glass-card animate-fade-in-up animate-delay-3">
              <div className="why__card-number">03</div>
              <h3>The Fix Is Usually Simple</h3>
              <p>Pricing, photos, marketing reach, or showing availability — most leasing problems have fast, actionable solutions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FORM SECTION ===== */}
      <section className="form-section section" id="audit-section">
        <div className="container container--narrow">
          <div className="form-section__header animate-fade-in-up">
            <h2>
              Get Your <span className="gradient-text">Free Lease-Up Audit</span>
            </h2>
            <p>
              Tell us about your property and we&apos;ll generate an instant analysis
              with your urgency score, vacancy cost estimate, and a professional recommendation.
            </p>
          </div>
          <div className="form-section__card glass-card animate-fade-in-up animate-delay-1">
            <LeaseUpForm />
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
