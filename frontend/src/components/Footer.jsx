import { Sparkles } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <a className="brand brand-light" href="#top">
          <span className="brand-mark"><Sparkles size={17} /></span>
          <span>PeopleFlow</span>
        </a>
        <p>People operations, made beautifully simple.</p>
        <p>© {new Date().getFullYear()} PeopleFlow HRMS</p>
      </div>
    </footer>
  )
}

