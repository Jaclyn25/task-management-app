import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check } from 'lucide-react';
import { api, json } from '../api';
import { priorities, statuses, type Category, type Task, type TaskInput } from '../types';
import { ErrorState, Loading } from '../ui';
import { useFeedback } from '../App';
const schema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Give your task a title.')
      .max(160, 'Keep the title under 160 characters.'),
    description: z.string().max(5000),
    categoryId: z.string(),
    priority: z.string(),
    status: z.string(),
    startDate: z.string(),
    dueDate: z.string(),
  })
  .refine((v) => !v.startDate || !v.dueDate || v.dueDate >= v.startDate, {
    path: ['dueDate'],
    message: 'Due date must be on or after the start date.',
  });
type Fields = z.infer<typeof schema>;
export default function TaskEditor() {
  const { id } = useParams();
  const q = useQuery({
    queryKey: ['task', id],
    queryFn: () => api<Task>(`/tasks/${id}`),
    enabled: !!id,
  });
  const cats = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/categories'),
  });
  if ((id && q.isPending) || cats.isPending) return <Loading />;
  if (q.error || cats.error)
    return (
      <ErrorState
        error={(q.error || cats.error)!}
        retry={() => {
          q.refetch();
          cats.refetch();
        }}
      />
    );
  return <Editor key={q.data?.version || 'new'} task={q.data} categories={cats.data!} />;
}
function Editor({ task, categories }: { task?: Task; categories: Category[] }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const feedback = useFeedback();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      categoryId: task?.categoryId || '',
      priority: String(task?.priority ?? 1),
      status: String(task?.status ?? 0),
      startDate: task?.startDate || '',
      dueDate: task?.dueDate || '',
    },
  });
  const titleValue = watch('title') || '';
  const descValue = watch('description') || '';
  const save = useMutation({
    mutationFn: (v: Fields) =>
      api<Task>(
        task ? `/tasks/${task.id}` : '/tasks',
        json(task ? 'PUT' : 'POST', {
          ...v,
          categoryId: v.categoryId || null,
          startDate: v.startDate || null,
          dueDate: v.dueDate || null,
          priority: Number(v.priority),
          status: Number(v.status),
          version: task?.version,
        } satisfies TaskInput),
      ),
    onSuccess: async (t) => {
      await client.invalidateQueries();
      feedback(task ? 'Task updated.' : 'Task created. Your next step is ready.');
      navigate(`/tasks/${t.id}`);
    },
  });
  return (
    <>
      <Link className="back-link" to={task ? `/tasks/${task.id}` : '/tasks'}>
        <ArrowLeft size={16} />
        Back to {task ? 'task' : 'all tasks'}
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{task ? 'EDIT TASK' : 'A FRESH START'}</span>
          <h1>{task ? 'Refine the plan.' : 'What’s your next step?'}</h1>
          <p>A clear task makes it easier to get started.</p>
        </div>
      </div>
      <div className="editor-layout">
        <form className="panel editor" onSubmit={handleSubmit((v) => save.mutate(v))} noValidate>
          <label>
            <span className="label-text">
              <span>
                Task title{' '}
                <span className="required" aria-hidden="true">
                  *
                </span>
              </span>
              <small className="field-counter">{titleValue.length}/160</small>
            </span>
            <input
              autoFocus
              placeholder="e.g. Prepare the project proposal"
              {...register('title')}
              aria-invalid={!!errors.title}
            />
            {errors.title && <small className="field-error">{errors.title.message}</small>}
          </label>
          <label>
            <span className="label-text">
              Description
              <small className="field-counter">{descValue.length}/5000</small>
            </span>
            <textarea
              rows={5}
              placeholder="Add context, notes or a small checklist…"
              {...register('description')}
            />
            {errors.description && (
              <small className="field-error">{errors.description.message}</small>
            )}
          </label>
          <div className="form-grid">
            <label>
              Category
              <select {...register('categoryId')}>
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select {...register('priority')}>
                {priorities.map((p, i) => (
                  <option key={p} value={i}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-grid-full">
              Status
              <select {...register('status')}>
                {statuses.map((s, i) => (
                  <option key={s} value={i}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Start date
              <input type="date" {...register('startDate')} />
            </label>
            <label>
              Due date
              <input type="date" {...register('dueDate')} aria-invalid={!!errors.dueDate} />
              {errors.dueDate && <small className="field-error">{errors.dueDate.message}</small>}
            </label>
          </div>
          {save.error && <ErrorState error={save.error} />}
          <div className="form-footer">
            <span className="hint">
              {isDirty ? 'Unsaved changes' : 'Make it manageable. Make it yours.'}
            </span>
            <div className="actions">
              <Link className="button secondary" to={task ? `/tasks/${task.id}` : '/tasks'}>
                Cancel
              </Link>
              <button className="button primary" disabled={save.isPending}>
                <Check size={17} />
                {save.isPending ? 'Saving…' : task ? 'Save changes' : 'Create task'}
              </button>
            </div>
          </div>
        </form>
        <aside className="editor-aside">
          <span className="eyebrow">A GOOD TASK IS A SMALL STEP</span>
          <h2>Clarity over complexity.</h2>
          <p>Start with a verb. Keep it specific. Give yourself a finish line you can recognize.</p>
          <hr />
          <strong>A note on deadlines</strong>
          <p>
            Dates run through the end of the day in your account timezone. Completed tasks are never
            marked overdue.
          </p>
          <Link to="/account">Manage your timezone →</Link>
        </aside>
      </div>
    </>
  );
}
