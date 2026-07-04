import { Menu, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const links = [
  { label: 'Platform', href: '#platform' },
  { label: 'Why PeopleFlow', href: '#why-us' },
  { label: 'Workflow', href: '#workflow' },
]

export default function Navbar() {
  return (
    <header className="site-header">
      <nav className="shell navbar" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="PeopleFlow home">
          <span className="brand-mark"><Sparkles size={17} strokeWidth={2.2} /></span>
          <span>PeopleFlow</span>
        </a>

        <div className="nav-links">
          {links.map((link) => (
            <a key={link.href} href={link.href}>{link.label}</a>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <Link className="text-slate-300 hover:text-white text-sm font-semibold transition" to="/login">Sign In</Link>
          <Link className="nav-cta hover:border-white transition" to="/register">Get Started <span>↗</span></Link>
        </div>
      </nav>
    </header>
  )
}


