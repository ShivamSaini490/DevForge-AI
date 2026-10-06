export const agentNames = {
  manager: { label: 'Manager', description: 'Coordinates the team and keeps the work aligned with your request.' },
  planner: { label: 'Planner', description: 'Breaks your request into clear, achievable steps.' },
  analyst: { label: 'Analyst', description: 'Studies the repository and identifies the code that needs attention.' },
  developer: { label: 'Developer', description: 'Implements the planned changes while following your constraints.' },
  tester: { label: 'Tester', description: 'Runs checks and tests to catch problems in the changes.' },
  reviewer: { label: 'Reviewer', description: 'Reviews the result for quality and summarizes the work.' },
} as const
export const agentOrder = Object.keys(agentNames)
export function agentInfo(id: string) {
  return Object.hasOwn(agentNames, id) ? agentNames[id as keyof typeof agentNames]
    : { label: id, description: 'An additional agent is helping with this task.' }
}
