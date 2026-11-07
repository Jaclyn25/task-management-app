import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, json } from '../api';
import { statuses, type Dashboard, type PageResult, type Task } from '../types';
import { Due, ErrorState, Loading, Priority } from '../ui';
import { useFeedback } from '../App';
export default function Board() {
  const d = useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/dashboard') });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR BOARD</span>
          <h1>A clear path from plan to done.</h1>
          <p>Move tasks at your own pace. Every small step counts.</p>
        </div>
        <Link className="button primary" to="/tasks/new">
          <Plus size={17} />
          Create task
        </Link>
      </div>
      <p className="board-hint">
        Use each card’s status menu to move it between columns. Changes save immediately.
      </p>
      {d.isPending ? (
        <Loading />
      ) : d.error ? (
        <ErrorState error={d.error} retry={() => d.refetch()} />
      ) : (
        <div className="board">
          {statuses.map((s, i) => (
            <Column key={s} status={i} today={d.data.today} />
          ))}
        </div>
      )}
    </>
  );
}
function Column({ status, today }: { status: number; today: string }) {
  const [page, setPage] = useState(1);
  const client = useQueryClient();
  const feedback = useFeedback();
  const q = useQuery({
    queryKey: ['tasks', 'board', status, page],
    queryFn: () =>
      api<PageResult>(`/tasks?status=${status}&sort=priority&pageSize=12&page=${page}`),
  });
  const move = useMutation({
    mutationFn: ({ task, value }: { task: Task; value: number }) =>
      api(`/tasks/${task.id}`, json('PUT', { ...task, status: value })),
    onSuccess: async () => {
      await client.invalidateQueries();
      feedback('Task moved.');
    },
    onError: async () => {
      await client.invalidateQueries();
    },
  });
  return (
    <section className={`board-column column-${status}`} aria-labelledby={`column-${status}`}>
      <header>
        <h2 id={`column-${status}`}>
          <span aria-hidden="true">{['○', '◐', '✓'][status]}</span>
          {statuses[status]}
        </h2>
        <span className="column-count">{q.data?.total ?? '…'}</span>
      </header>
      {move.error && <ErrorState error={move.error} />}
      <div className="board-cards">
        {q.isPending ? (
          <Loading />
        ) : q.error ? (
          <ErrorState error={q.error} retry={() => q.refetch()} />
        ) : q.data.items.length ? (
          q.data.items.map((t) => (
            <article className="board-card" key={t.id}>
              <div>
                <Priority value={t.priority} />
                <small>{t.categoryName || 'Uncategorized'}</small>
              </div>
              <Link to={`/tasks/${t.id}`}>
                <h3>{t.title}</h3>
              </Link>
              {t.description && (
                <p>
                  {t.description.slice(0, 100)}
                  {t.description.length > 100 ? '…' : ''}
                </p>
              )}
              <Due task={t} today={today} />
              <label>
                <span className="sr-only">Move {t.title}</span>
                <select
                  aria-label={`Move ${t.title}`}
                  disabled={move.isPending}
                  value={t.status}
                  onChange={(e) => move.mutate({ task: t, value: Number(e.target.value) })}
                >
                  {statuses.map((s, i) => (
                    <option value={i} key={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </article>
          ))
        ) : (
          <div className="column-empty">
            {page > 1
              ? 'No tasks on this page. Go back to see earlier tasks.'
              : status === 2
                ? 'Finished tasks will find a home here.'
                : 'A little space for your next step.'}
          </div>
        )}
      </div>
      {q.data && (q.data.total > 12 || page > 1) && (
        <div className="pagination">
          <button
            aria-label={`Previous ${statuses[status]} page`}
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>Page {page}</span>
          <button
            aria-label={`Next ${statuses[status]} page`}
            disabled={page * 12 >= q.data.total}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
