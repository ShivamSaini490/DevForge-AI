import type { AgentProgress } from '../../types/execution'
import AgentStep from './AgentStep'

export default function AgentTimeline({ agents }: { agents: AgentProgress[] }) {
  return <ol className="agent-timeline" aria-label="AI team progress">{agents.map((agent) => <AgentStep key={agent.id} agent={agent} />)}</ol>
}
