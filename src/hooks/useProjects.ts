import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Project, Action, Risk } from '@/types'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, owner:profiles!projects_owner_id_fkey(id, full_name, role), manager:profiles!projects_manager_id_fkey(id, full_name, role)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Project[]
    },
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, owner:profiles!projects_owner_id_fkey(id, full_name, role), manager:profiles!projects_manager_id_fkey(id, full_name, role)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data as Project
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'spent' | 'progress' | 'owner' | 'manager'>) => {
      const { data, error } = await supabase.from('projects').insert(project).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] })
    },
  })
}

export function useActions(projectId: string) {
  return useQuery({
    queryKey: ['actions', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('actions')
        .select('*, user:profiles(id, full_name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Action[]
    },
    enabled: !!projectId,
  })
}

export function useCreateAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (action: Omit<Action, 'id' | 'created_at' | 'completed_at' | 'user'>) => {
      const { data, error } = await supabase.from('actions').insert(action).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['actions', variables.project_id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', variables.project_id] })
    },
  })
}

export function useUpdateAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, project_id, ...updates }: Partial<Action> & { id: string; project_id: string }) => {
      const payload: Record<string, unknown> = { ...updates }
      if (updates.status === 'concluida' && !updates.completed_at) {
        payload.completed_at = new Date().toISOString()
      }
      const { data, error } = await supabase
        .from('actions')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['actions', variables.project_id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', variables.project_id] })
    },
  })
}

export function useDeleteAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase.from('actions').delete().eq('id', id)
      if (error) throw error
      return { id, project_id }
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ['actions', variables.project_id] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', variables.project_id] })
    },
  })
}

export function useRisks(projectId: string) {
  return useQuery({
    queryKey: ['risks', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('risks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Risk[]
    },
    enabled: !!projectId,
  })
}

export function useCreateRisk() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (risk: Omit<Risk, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('risks').insert(risk).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['risks', variables.project_id] })
    },
  })
}

export function useUpdateRisk() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, project_id, ...updates }: Partial<Risk> & { id: string; project_id: string }) => {
      const { data, error } = await supabase.from('risks').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['risks', variables.project_id] })
    },
  })
}

export function useDeleteRisk() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase.from('risks').delete().eq('id', id)
      if (error) throw error
      return { id, project_id }
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ['risks', variables.project_id] })
    },
  })
}

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('full_name')
      if (error) throw error
      return data
    },
  })
}
