import { taskService } from '../services/taskService'
import { useListResource } from './useListResource'

export const useTasks = () => useListResource(taskService.list)
