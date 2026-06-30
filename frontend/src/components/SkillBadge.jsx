export default function SkillBadge({ skill }) {
  return (
    <span className="inline-block px-2 py-0.5 bg-blue-50 text-brand-800 text-xs font-medium rounded-full border border-blue-100 capitalize">
      {skill}
    </span>
  )
}
