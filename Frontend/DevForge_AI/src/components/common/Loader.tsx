export default function Loader({ label = 'Loading…' }: { label?: string }) {
  return <span className="loader" role="status"><span className="spinner" aria-hidden="true" /><span>{label}</span></span>
}
