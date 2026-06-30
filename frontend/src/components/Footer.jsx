import { Github, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-8">
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col items-center gap-1.5 text-center">
        <p className="text-sm text-gray-600">
          Developed &amp; maintained by{' '}
          <span className="font-semibold text-brand-800">Shanu Prakash</span>
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap justify-center">
          <a
            href="mailto:shanu_24a03res171@iitp.ac.in"
            className="flex items-center gap-1 hover:text-brand-700 transition-colors"
          >
            <Mail size={11} />
            shanu_24a03res171@iitp.ac.in
          </a>
          <span className="text-gray-200">|</span>
          <a
            href="mailto:shanuprakash1612@gmail.com"
            className="flex items-center gap-1 hover:text-brand-700 transition-colors"
          >
            <Mail size={11} />
            shanuprakash1612@gmail.com
          </a>
        </div>
        <p className="text-[11px] text-gray-300 mt-0.5">
          © {new Date().getFullYear()} IITP Referral Portal · IIT Patna Alumni Network
        </p>
      </div>
    </footer>
  )
}
