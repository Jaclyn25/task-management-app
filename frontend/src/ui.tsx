import { useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, ArrowUpRight, AlertCircle } from 'lucide-react';
import { priorities, statuses, type Task } from './types';
import { api, json } from './api';

export function Loading() {
  return (
    <div aria-label="Loading workspace" role="status" className="skeleton">
      <span />
      <span />
      <span />
    </div>
  );
}

export function ErrorState({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <div className="error" role="alert">
      <AlertCircle size={18} />
      <span>{error.message}</span>
      {retry && (
        <button type="button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Empty({
  title = 'Make room for your next idea',
  body = 'Create a task to start turning plans into progress.',
  actionLabel = 'Create a task',
  actionTo = '/tasks/new',
}: {
  title?: string;
  body?: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="empty">
      <div className="empty-icon-box" aria-hidden="true">
        <Check size={28} />
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
      <Link className="button primary" to={actionTo}>
        {actionLabel}
      </Link>
    </div>
  );
}

export function Priority({ value }: { value: number }) {
  return (
    <span className={`badge priority p${value}`}>
      <span className="badge-glyph" aria-hidden="true">
        {['↓', '−', '↑', '!!'][value]}
      </span>{' '}
      {priorities[value]}
    </span>
  );
}

export function Status({ value }: { value: number }) {
  return (
    <span className={`badge status s${value}`}>
      <span className="badge-glyph" aria-hidden="true">
        {['○', '◐', '✓'][value]}
      </span>{' '}
      {statuses[value]}
    </span>
  );
}

export function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`));
}

export function Due({ task, today }: { task: Task; today: string }) {
  const overdue = task.status !== 2 && !!task.dueDate && task.dueDate < today;
  return (
    <span className={`due ${overdue ? 'late' : ''}`}>
      <CalendarDays size={14} />
      {task.dueDate
        ? `${overdue ? 'Overdue · ' : task.dueDate === today && task.status !== 2 ? 'Today · ' : ''}${dateLabel(task.dueDate)}`
        : 'No deadline'}
    </span>
  );
}

export function TaskRows({ tasks, today }: { tasks: Task[]; today: string }) {
  const client = useQueryClient();
  const toggle = useMutation({
    mutationFn: (t: Task) => {
      const nextStatus = t.status === 2 ? 0 : 2;
      return api<Task>(`/tasks/${t.id}`, json('PUT', { ...t, status: nextStatus }));
    },
    onSuccess: async () => {
      await client.invalidateQueries();
    },
  });

  return (
    <div className="task-rows">
      {tasks.map((t) => (
        <div className="task-row" key={t.id}>
          <button
            type="button"
            className={`task-check ${t.status === 2 ? 'done' : ''}`}
            aria-label={
              t.status === 2 ? `Mark "${t.title}" as incomplete` : `Mark "${t.title}" as complete`
            }
            disabled={toggle.isPending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle.mutate(t);
            }}
          >
            {t.status === 2 ? <Check size={12} strokeWidth={2.8} /> : null}
          </button>
          <Link className="task-row-link" to={`/tasks/${t.id}`}>
            <span className="task-name">
              <strong>{t.title}</strong>
              <small>{t.categoryName || 'Uncategorized'}</small>
            </span>
            <Priority value={t.priority} />
            <Status value={t.status} />
            <Due task={t} today={today} />
            <ArrowUpRight size={16} className="row-arrow" />
          </Link>
        </div>
      ))}
    </div>
  );
}

export function Confirm({
  title,
  description,
  onConfirm,
  busy = false,
  children,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  busy?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return (
    <>
      <button
        type="button"
        className="button danger ghost"
        onClick={() => ref.current?.showModal()}
      >
        {children}
      </button>
      <dialog ref={ref} aria-labelledby={titleId}>
        <h2 id={titleId}>{title}</h2>
        <p>{description}</p>
        <div className="actions">
          <button type="button" className="button secondary" onClick={() => ref.current?.close()}>
            Cancel
          </button>
          <button
            type="button"
            className="button danger"
            disabled={busy}
            onClick={() => {
              onConfirm();
              ref.current?.close();
            }}
          >
            Delete
          </button>
        </div>
      </dialog>
    </>
  );
}
