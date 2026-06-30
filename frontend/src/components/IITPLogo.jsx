export default function IITPLogo({ size = 40, className = '' }) {
  return (
    <img
      src="/iitp-logo.png"
      alt="IIT Patna"
      width={size}
      height={size}
      className={className}
      onError={e => {
        e.target.style.display = 'none'
        e.target.nextSibling.style.display = 'flex'
      }}
    />
  )
}
