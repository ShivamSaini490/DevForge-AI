import { projectService } from '../services/projectService'
import { useListResource } from './useListResource'

export const useProjects = () => useListResource(projectService.list)
