import { Menu, Sparkles } from 'lucide-react'

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

        <a className="nav-cta" href="#platform">Explore platform <span>↗</span></a>
        <button className="menu-button" type="button" aria-label="Open navigation">
          <Menu size={22} />
        </button>
      </nav>
    </header>
  )
}

