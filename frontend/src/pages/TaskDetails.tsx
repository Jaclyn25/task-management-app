import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { api, json } from '../api'
import { statuses, type Dashboard, type Task } from '../types'
import { Confirm, Due, ErrorState, Loading, Priority, Status, dateLabel } from '../ui'
import { useFeedback, useProfile } from '../App'
export default function TaskDetails() {
  const { id } = useParams(); const client = useQueryClient(); const navigate = useNavigate(); const feedback = useFeedback(); const profile = useProfile()
  const q = useQuery({ queryKey: ['task', id], queryFn: () => api<Task>(`/tasks/${id}`) })
  const d = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/dashboard') })
  const status = useMutation({ mutationFn: (value: number) => api<Task>(`/tasks/${id}`, json('PUT', { ...q.data!, status: value })), onSuccess: async () => { await client.invalidateQueries(); feedback('Task status updated.') } })
  const remove = useMutation({ mutationFn: () => api(`/tasks/${id}?version=${q.data!.version}`, { method: 'DELETE' }), onSuccess: async () => { await client.invalidateQueries(); feedback('Task deleted.'); navigate('/tasks') } })
  if (q.isPending || d.isPending) return <Loading/>; if (q.error || d.error) return <ErrorState error={(q.error || d.error)!} retry={() => { q.refetch(); d.refetch() }}/>
  const t = q.data
  const stamp = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: profile.timeZone }).format(new Date(value))
  return <><Link className="back-link" to="/tasks"><ArrowLeft size={16}/>All tasks</Link><div className="page-heading"><div><span className="eyebrow">TASK DETAILS</span><h1>{t.title}</h1><div className="inline-meta"><Status value={t.status}/><Priority value={t.priority}/><span>{t.categoryName || 'Uncategorized'}</span></div></div><Link className="button secondary" to={`/tasks/${id}/edit`}><Pencil size={16}/>Edit task</Link></div>{(status.error || remove.error) && <ErrorState error={(status.error || remove.error)!}/>}<div className="detail-layout"><section className="panel detail-body"><h2>The plan</h2><p className="description">{t.description || 'No description yet. Edit this task to add context.'}</p><div className="detail-dates"><div><span>START DATE</span><strong>{t.startDate ? dateLabel(t.startDate) : 'Not set'}</strong></div><div><span>DEADLINE</span><Due task={t} today={d.data!.today}/></div></div><div className="detail-history"><h3>Task record</h3><p>Created {stamp(t.createdAt)}</p><p>Last updated {stamp(t.updatedAt)}</p>{t.completedAt && <p>Completed {stamp(t.completedAt)}</p>}<small>Times shown in {profile.timeZone}</small><code>{t.id}</code></div></section><aside className="panel task-controls"><h2>Move it forward</h2><label>Status<select aria-label="Task status" value={t.status} disabled={status.isPending} onChange={e => status.mutate(Number(e.target.value))}>{statuses.map((s, i) => <option key={s} value={i}>{s}</option>)}</select></label><p className="hint">Completing records the finish time. Reopening clears it.</p><hr/><Confirm title="Delete this task?" description="This permanently removes the task. This action cannot be undone." onConfirm={() => remove.mutate()} busy={remove.isPending}><Trash2 size={16}/>Delete task</Confirm></aside></div></>
}
