import "./portfolio.css";
import PortfolioInteractivity from "@/components/PortfolioInteractivity";

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Ben Akoka",
  url: "https://benakoka.com",
  jobTitle: "Data Analyst & Researcher",
  email: "mailto:benakoka1@gmail.com",
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "University of California, Santa Barbara",
  },
  sameAs: ["https://www.linkedin.com/in/benakoka"],
};

export default function Home() {
  return (
    <div className="portfolio-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <nav>
        <div className="wrap">
          <div className="nav-brand">Ben Akoka</div>
          <ul className="nav-links" id="navLinks">
            <li><a href="#about">About</a></li>
            <li><a href="#projects">Projects</a></li>
            <li><a href="#skills">Skills</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          <button className="nav-toggle" id="navToggle" aria-label="Toggle navigation" aria-expanded="false" aria-controls="navLinks">
            <span></span>
          </button>
        </div>
      </nav>

      <header className="hero wrap">
        <div>
          <h1>Hi, I&apos;m&nbsp;<span className="hl">Ben.</span></h1>
          <p className="lede">I&apos;m a Statistics &amp; Data Science student at UC Santa Barbara who likes turning messy datasets into clear answers.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#projects">View my work →</a>
            <a className="btn btn-ghost" href="#contact">Get in touch</a>
          </div>
        </div>

        <div className="terminal-card">
          <div className="terminal-bar">
            <span className="t-dot t-red"></span>
            <span className="t-dot t-yellow"></span>
            <span className="t-dot t-green"></span>
            <span className="terminal-title">ben@portfolio — zsh</span>
          </div>
          <div className="terminal-body" id="terminal"></div>
        </div>
      </header>

      <section id="about">
        <div className="wrap about-grid">
          <div className="sec-head" style={{ marginBottom: 20 }}>
            <span className="tag">01</span>
            <h2>About</h2>
          </div>
          <div className="about-body">
            <div className="about-photo"><img src="/assets/ben-photo.jpg" alt="Photo of Ben Akoka" loading="lazy" /></div>
            <div className="about-text">
              <div>
                <p><strong>I&apos;m an undergraduate studying Statistics and Data Science at UC Santa Barbara</strong>, where I&apos;m fascinated by turning messy, real-world data into meaningful insights. My interests span machine learning, artificial intelligence, and statistical modeling, and I enjoy solving problems that sit at the intersection of data, technology, and decision-making.</p>
                <p>Whether I&apos;m building models in Python or exploring new research ideas, I&apos;m always looking for opportunities to learn and create.</p>
              </div>
              <div>
                <p>Previously, I worked as a Data Analytics &amp; SEO Strategy Intern at <strong>Taboola</strong>, where I analyzed search performance, competitor trends, and large-scale web data to help guide strategic decisions. I&apos;m currently an <strong>AI Research Assistant</strong> at UCSB&apos;s Center for AI &amp; Society, exploring applications of AI through research while continuing to expand my technical skills.</p>
                <p>Outside of academics, I work as a <strong>campus tour guide</strong>, helping prospective students experience everything UCSB has to offer.</p>
              </div>
            </div>
          </div>
          <ul className="fact-list">
            <li><span className="k">Based in</span><div className="v">Los Angeles, CA<br />Santa Barbara, CA</div></li>
            <li><span className="k">Studying</span><div className="v">Statistics &amp; Data Science, UC Santa Barbara</div></li>
            <li><span className="k">Research</span><div className="v">AI Research Assistant, Center for AI &amp; Society (Prof. David Lawson&apos;s Lab)</div></li>
          </ul>
        </div>
      </section>

      <section id="projects">
        <div className="wrap">
          <div className="sec-head">
            <span className="tag">02</span>
            <h2>Projects</h2>
          </div>
          <div className="projects">

            <a className="project-card" href="/projects/nba-career-longevity.html">
              <span className="status">● Completed</span>
              <h3>NBA Career Longevity</h3>
              <p>Analyzed career length across 4,486 NBA players using injury logs, box scores, and season stats. Modeled survival with Kaplan-Meier curves and Cox regression, compared against OLS and logistic regression, and used K-Means to cluster player archetypes. Built and delivered a presentation with a research partner.</p>
              <div className="chips">
                <span className="chip">Survival Analysis</span>
                <span className="chip">Cox Regression</span>
                <span className="chip">K-Means</span>
                <span className="chip">Python</span>
              </div>
            </a>

            <a className="project-card" href="/names">
              <span className="status">● Completed</span>
              <h3>What Does the Internet Think of Your Name?</h3>
              <p>An interactive tool that turns any first name into a data-driven profile: living-age distribution weighted by SSA actuarial survival tables, a full 1880–present popularity arc with trend-archetype classification, cosine-similarity &quot;name neighbors,&quot; and a US geographic over-index map. Built from real SSA national and state baby-name data.</p>
              <div className="chips">
                <span className="chip">Next.js</span>
                <span className="chip">Python</span>
                <span className="chip">SQLite</span>
                <span className="chip">Actuarial Analysis</span>
              </div>
            </a>

            <div className="project-card empty">
              <span className="status">○ In progress</span>
              <h3>Center for AI &amp; Society Research</h3>
              <p>Currently working as an AI Research Assistant in Professor David Lawson&apos;s lab. Write-up coming once the project reaches a shareable stage.</p>
            </div>

            <div className="project-card empty">
              <span className="status">○ Planned</span>
              <h3>Future Work</h3>
              <p>More projects coming soon.</p>
            </div>

          </div>
        </div>
      </section>

      <section id="skills">
        <div className="wrap">
          <div className="sec-head">
            <span className="tag">03</span>
            <h2>Skills</h2>
          </div>
          <div className="skills-grid">
            <div className="skill-col">
              <span className="k font-mono">LANGUAGES</span>
              <ul>
                <li>Python</li>
                <li>R</li>
                <li>SQL</li>
              </ul>
            </div>
            <div className="skill-col">
              <span className="k font-mono">METHODS</span>
              <ul>
                <li>Regression &amp; GLMs</li>
                <li>Survival analysis</li>
                <li>Clustering</li>
                <li>Hypothesis testing</li>
                <li>Data visualization</li>
              </ul>
            </div>
            <div className="skill-col">
              <span className="k font-mono">TOOLS</span>
              <ul>
                <li>pandas / numpy</li>
                <li>statsmodels</li>
                <li>scikit-learn</li>
                <li>matplotlib</li>
                <li>Excel / Google Sheets</li>
              </ul>
            </div>
            <div className="skill-col">
              <span className="k font-mono">SEO &amp; ANALYTICS</span>
              <ul>
                <li>Ahrefs</li>
                <li>Google Looker Studio</li>
                <li>Google Search Console</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="contact">
        <div className="wrap">
          <div className="contact-card">
            <div>
              <h2>Let&apos;s connect.</h2>
              <p>Open to internships, research collaborations, and graduate program conversations.</p>
            </div>
            <div className="contact-links">
              <a className="contact-link" href="mailto:benakoka1@gmail.com">
                <svg className="c-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
                <div className="c-body">
                  <span className="k">Email</span>
                  <span className="v">benakoka1@gmail.com</span>
                </div>
                <svg className="c-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M7 17L17 7M7 7h10v10" /></svg>
              </a>
              <a className="contact-link" href="tel:+18184892438">
                <svg className="c-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                <div className="c-body">
                  <span className="k">Phone</span>
                  <span className="v">(818) 489-2438</span>
                </div>
                <svg className="c-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M7 17L17 7M7 7h10v10" /></svg>
              </a>
              <a className="contact-link" href="https://www.linkedin.com/in/benakoka" target="_blank" rel="noopener noreferrer">
                <svg className="c-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" /></svg>
                <div className="c-body">
                  <span className="k">LinkedIn</span>
                  <span className="v">linkedin.com/in/benakoka</span>
                </div>
                <svg className="c-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M7 17L17 7M7 7h10v10" /></svg>
              </a>
              <a className="contact-link" href="/resume.pdf" target="_blank" rel="noopener noreferrer">
                <svg className="c-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15h6M9 11h6M9 19h3" /></svg>
                <div className="c-body">
                  <span className="k">Resume</span>
                  <span className="v">View / download PDF</span>
                </div>
                <svg className="c-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="M7 17L17 7M7 7h10v10" /></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="wrap">
        <span>© 2026 Ben Akoka. Built with data.</span>
        <span className="font-mono">v3.1.1</span>
      </footer>

      <PortfolioInteractivity />
    </div>
  );
}
