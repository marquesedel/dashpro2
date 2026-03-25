import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Report, ReportType } from '@/types'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

export function useReports(projectId: string) {
  return useQuery({
    queryKey: ['reports', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*, generator:profiles(id, full_name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Report[]
    },
    enabled: !!projectId,
  })
}

export function useSaveReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (report: { project_id: string; generated_by: string; content: string; type: ReportType }) => {
      const { data, error } = await supabase.from('reports').insert(report).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports', variables.project_id] })
    },
  })
}

export function useGenerateReport() {
  return useMutation({
    mutationFn: async (payload: {
      type: ReportType
      project_name: string
      status: string
      progress: number
      start_date: string | null
      end_date: string | null
      budget: number | null
      spent: number
      actions: { title: string; status: string }[]
      risks: { title: string; probability: string; impact: string; status: string }[]
    }) => {
      const headers = await getAuthHeaders()
      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: payload,
        headers,
      })
      if (error) throw error
      return data as { content: string }
    },
  })
}
