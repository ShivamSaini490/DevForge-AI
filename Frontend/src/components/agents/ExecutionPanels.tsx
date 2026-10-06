import { useId, type ReactNode } from 'react'
import type { ExecutionData } from '../../types/execution'
import AgentTimeline from './AgentTimeline'
import AgentLog from './AgentLog'

function Panel({ title, loading, children }: { title: string; loading?: boolean; children?: ReactNode }) {
  const id = useId()
  return <section className="panel execution-panel" aria-labelledby={id} aria-busy={loading}>
    <div className="panel-heading"><h2 id={id}>{title}</h2></div>
    <div className="execution-panel-body">{loading ? <div className="execution-panel-loading" role="status" aria-label={`Loading ${title}`}><span className="skeleton skeleton-title" /><span className="skeleton skeleton-line" /></div> : children}</div>
  </section>
}
export default function ExecutionPanels({ data, loading = false }: { data?: ExecutionData; loading?: boolean }) {
  return <div className="execution-grid">
    <div className="execution-column">
      <Panel title="AI Plan" loading={loading}>{data?.plan.length ? <ol className="execution-plan">{data.plan.map((step, index) => <li key={index}>{step}</li>)}</ol> : <p className="execution-empty">The plan will appear when the planner breaks down your request.</p>}</Panel>
      <Panel title="Agent Timeline" loading={loading}>{data && <AgentTimeline agents={data.agents} />}</Panel>
      <Panel title="Live Logs" loading={loading}>{data && <AgentLog logs={data.logs} />}</Panel>
    </div>
    <div className="execution-column">
      <Panel title="Changed Files" loading={loading}>{data?.files.length ? <ul className="execution-file-list">{data.files.map((file) => <li key={file.path}><code>{file.path}</code><span>{file.status}</span></li>)}</ul> : <p className="execution-empty">No file changes have been reported.</p>}</Panel>
      <Panel title="Tests" loading={loading}>{data?.tests ? <div className="execution-tests"><p>Test status: <strong>{data.tests.status.replace('_', ' ')}</strong></p><p>{data.tests.passed} passed · {data.tests.failed} failed</p>{data.tests.output && <pre>{data.tests.output}</pre>}</div> : <p className="execution-empty">No test results have been reported.</p>}</Panel>
      <Panel title="Approval Queue" loading={loading}>{data?.approvals.length ? <><ul className="execution-approvals">{data.approvals.map((approval) => <li key={approval.id}>{approval.description}</li>)}</ul><p className="execution-empty">Approval decisions are not available in this view yet.</p></> : <p className="execution-empty">No pending approvals have been reported.</p>}</Panel>
      <Panel title="Final Summary" loading={loading}><p className="execution-empty preserve-lines">{data?.summary ?? 'A summary will appear when the task finishes and reports its result.'}</p></Panel>
    </div>
  </div>
}
