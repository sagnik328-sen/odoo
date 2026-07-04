import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileChartColumn,
  Palmtree,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'

import Footer from '../../components/Footer.jsx'
import Navbar from '../../components/Navbar.jsx'

const capabilities = [
  { icon: UsersRound, title: 'People directory', text: 'One dependable source for every employee profile and document.' },
  { icon: Clock3, title: 'Time & attendance', text: 'Clear check-ins, work hours, and attendance patterns without spreadsheets.' },
  { icon: Palmtree, title: 'Leave workflows', text: 'Simple requests, visible balances, and approvals that keep moving.' },
  { icon: CircleDollarSign, title: 'Payroll clarity', text: 'Accurate monthly records and payslips your people can access anytime.' },
  { icon: FileChartColumn, title: 'Actionable reports', text: 'Turn workforce data into useful decisions with export-ready reports.' },
  { icon: ShieldCheck, title: 'Built for trust', text: 'Role-based access and audit-ready workflows protect sensitive HR data.' },
]

export default function LandingPage() {
  return (
    <div id="top" className="app-shell">
      <Navbar />

      <main>
        <section className="hero">
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="shell hero-grid">
            <div className="hero-copy">
              <p className="eyebrow"><span /> Human resources, reimagined</p>
              <h1>Make work feel<br /><em>more human.</em></h1>
              <p className="hero-description">
                Bring your people, time, leave, and payroll into one calm workspace—so HR can focus on culture, not busywork.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#platform">Discover PeopleFlow <ArrowRight size={17} /></a>
                <a className="text-link" href="#workflow">See how it works <span>↓</span></a>
              </div>
              <div className="trust-row">
                <span><CheckCircle2 size={16} /> Clear by design</span>
                <span><CheckCircle2 size={16} /> Ready to scale</span>
                <span><CheckCircle2 size={16} /> Secure at every layer</span>
              </div>
            </div>

            <div className="hero-visual" aria-label="PeopleFlow dashboard preview">
              <div className="dashboard-card">
                <div className="dash-topline">
                  <div><span className="dash-kicker">GOOD MORNING</span><strong>Welcome back, Maya</strong></div>
                  <div className="avatar">MK</div>
                </div>
                <div className="metric-grid">
                  <article className="metric metric-dark"><CalendarCheck size={20} /><span>Today</span><strong>Checked in</strong><small>09:04 AM</small></article>
                  <article className="metric"><span>Leave balance</span><strong>14 <small>days</small></strong><div className="mini-progress"><i /></div></article>
                  <article className="metric metric-wide"><span>This month</span><strong>96.4%</strong><small>attendance</small><div className="bars"><i /><i /><i /><i /><i /><i /><i /></div></article>
                </div>
                <div className="activity-card">
                  <div><span className="activity-icon"><Palmtree size={16} /></span><p><strong>Leave approved</strong><small>July 18–19 · Casual leave</small></p></div>
                  <span className="status-pill">Approved</span>
                </div>
              </div>
              <div className="floating-note"><span>12</span><p><strong>People present</strong><small>Across your team today</small></p></div>
            </div>
          </div>
        </section>

        <section id="platform" className="capabilities section">
          <div className="shell">
            <div className="section-heading">
              <p className="eyebrow"><span /> One connected platform</p>
              <h2>Everything your people team needs.<br /><em>Nothing they don’t.</em></h2>
            </div>
            <div className="capability-grid">
              {capabilities.map(({ icon: Icon, title, text }, index) => (
                <article className="capability" key={title}>
                  <span className="capability-number">0{index + 1}</span>
                  <Icon size={25} strokeWidth={1.7} />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="why-us" className="statement section">
          <div className="shell statement-inner">
            <p>Built for ambitious teams</p>
            <h2>Less administration.<br /><em>More momentum.</em></h2>
            <p className="statement-copy">PeopleFlow creates room for better conversations, thoughtful decisions, and the work that actually grows a company.</p>
          </div>
        </section>

        <section id="workflow" className="workflow section">
          <div className="shell workflow-grid">
            <div>
              <p className="eyebrow"><span /> Designed to flow</p>
              <h2>One place.<br /><em>Every workday.</em></h2>
            </div>
            <ol>
              <li><span>01</span><div><strong>Start with your people</strong><p>Build a clean, secure employee record that grows with every team member.</p></div></li>
              <li><span>02</span><div><strong>Connect daily operations</strong><p>Attendance, leave, documents, and payroll stay together and in context.</p></div></li>
              <li><span>03</span><div><strong>See the bigger picture</strong><p>Dashboards and reports turn routine activity into confident decisions.</p></div></li>
            </ol>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

