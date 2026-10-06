import type { ExecutionLog } from '../../types/execution'

export default function AgentLog({ logs }: { logs: ExecutionLog[] }) {
  return logs.length ? <ol className="execution-logs" aria-label="Recent agent messages">{logs.map((log) => <li key={log.id}>
    <time dateTime={log.timestamp}>{new Date(log.timestamp).toLocaleTimeString()}</time><span>{log.message}</span>
  </li>)}</ol> : <p className="execution-empty">Messages will appear here when the agents report progress.</p>
}
