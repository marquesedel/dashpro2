import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Expense } from '@/types'

function invalidateProjectQueries(queryClient: ReturnType<typeof useQueryClient>, projectId: string) {
  queryClient.invalidateQueries({ queryKey: ['expenses', projectId] })
  queryClient.invalidateQueries({ queryKey: ['projects'] })
  queryClient.invalidateQueries({ queryKey: ['project', projectId] })
}

export function useExpenses(projectId: string) {
  return useQuery({
    queryKey: ['expenses', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', projectId)
        .order('expense_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Expense[]
    },
    enabled: !!projectId,
  })
}

export function useCreateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('expenses').insert(expense).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      invalidateProjectQueries(queryClient, variables.project_id)
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, project_id, ...updates }: Partial<Expense> & { id: string; project_id: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      invalidateProjectQueries(queryClient, variables.project_id)
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      return { id, project_id }
    },
    onSuccess: (variables) => {
      invalidateProjectQueries(queryClient, variables.project_id)
    },
  })
}
