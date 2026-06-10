import type { SupabaseClient } from '@supabase/supabase-js'

interface ChangePayload {
  companyId: string
  userId: string
  documentId: string
  documentTitle: string
  actionType: string
  summary: string
}

export async function recordChange(supabase: SupabaseClient, payload: ChangePayload) {
  await supabase.from('audit_logs').insert({
    company_id: payload.companyId,
    user_id: payload.userId,
    entity: 'document',
    entity_id: payload.documentId,
    action_type: payload.actionType,
    summary: payload.summary,
  })
}
