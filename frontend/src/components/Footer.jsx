export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-8">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-400">
        <span>© {new Date().getFullYear()} IITP Referral Portal</span>
        <span className="text-gray-200">·</span>
        <span>Developed by <span className="font-medium text-gray-600">Shanu Prakash</span></span>
        <span className="text-gray-200">·</span>
        <a href="mailto:shanu_24a03res171@iitp.ac.in" className="hover:text-brand-700 transition-colors">shanu_24a03res171@iitp.ac.in</a>
        <span className="text-gray-200">·</span>
        <a href="mailto:spprakashshanu@gmail.com" className="hover:text-brand-700 transition-colors">spprakashshanu@gmail.com</a>
      </div>
    </footer>
  )
}
