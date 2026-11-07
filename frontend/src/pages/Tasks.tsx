import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../api';
import { priorities, statuses, type Category, type Dashboard, type PageResult } from '../types';
import { Empty, ErrorState, Loading, TaskRows } from '../ui';
export default function Tasks({ mode = 'all' }: { mode?: 'all' | 'completed' | 'deadlines' }) {
  const [params, setParams] = useSearchParams();
  const values = new URLSearchParams(params);
  if (mode === 'completed') values.set('status', '2');
  if (mode === 'deadlines') {
    if (!values.has('deadline')) values.set('deadline', 'upcoming');
    if (!values.has('sort')) values.set('sort', 'due');
  }
  const q = useQuery({
    queryKey: ['tasks', mode, values.toString()],
    queryFn: () => api<PageResult>(`/tasks?${values}`),
  });
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<Category[]>('/categories'),
  });
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api<Dashboard>('/dashboard'),
  });
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next, { replace: true });
  }
  const heading =
    mode === 'completed'
      ? 'Finished, and moving forward.'
      : mode === 'deadlines'
        ? 'Keep your commitments in view.'
        : 'Everything you’re working toward.';
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{mode === 'all' ? 'ALL TASKS' : mode.toUpperCase()}</span>
          <h1>{heading}</h1>
          <p>
            {mode === 'deadlines'
              ? 'Date-only deadlines end at midnight in your account timezone.'
              : mode === 'completed'
                ? 'A record of the things you’ve made happen.'
                : 'A little organization goes a long way.'}
          </p>
        </div>
        <Link className="button primary" to="/tasks/new">
          <Plus size={17} />
          Create task
        </Link>
      </div>
      {mode === 'deadlines' && dashboard.data && (
        <div className="deadline-summary">
          <strong>{dashboard.data.overdue} overdue</strong>
          <span>{dashboard.data.upcoming} due within seven days</span>
          <span>
            Today: {dashboard.data.today} · {dashboard.data.timeZone}
          </span>
        </div>
      )}
      <section className="panel task-panel">
        <div className="filters">
          <label className="search">
            <Search size={18} />
            <span className="sr-only">Search tasks</span>
            <input
              type="search"
              placeholder="Search title or description…"
              value={params.get('search') || ''}
              onChange={(e) => change('search', e.target.value)}
            />
          </label>
          <span className="filter-label">
            <SlidersHorizontal size={16} />
            Filter
          </span>
          <label>
            <span className="sr-only">Category filter</span>
            <select
              aria-label="Category filter"
              value={params.get('categoryId') || ''}
              onChange={(e) => change('categoryId', e.target.value)}
            >
              <option value="">All categories</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Priority filter</span>
            <select
              aria-label="Priority filter"
              value={params.get('priority') || ''}
              onChange={(e) => change('priority', e.target.value)}
            >
              <option value="">All priorities</option>
              {priorities.map((p, i) => (
                <option key={p} value={i}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          {mode !== 'completed' && (
            <select
              aria-label="Status filter"
              value={params.get('status') || ''}
              onChange={(e) => change('status', e.target.value)}
            >
              <option value="">All statuses</option>
              {statuses.map((s, i) => (
                <option key={s} value={i}>
                  {s}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Deadline filter"
            value={values.get('deadline') || 'all'}
            onChange={(e) => change('deadline', e.target.value)}
          >
            <option value="all">All deadlines</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due today</option>
            <option value="upcoming">Next 7 days</option>
            <option value="none">No deadline</option>
          </select>
          <select
            aria-label="Sort tasks"
            value={values.get('sort') || 'updated'}
            onChange={(e) => change('sort', e.target.value)}
          >
            <option value="updated">Recently updated</option>
            <option value="created">Newest first</option>
            <option value="title">Title A to Z</option>
            <option value="priority">Highest priority</option>
            <option value="due">Earliest deadline</option>
          </select>
          {params.size > 0 && (
            <button className="text-button" onClick={() => setParams({})}>
              Reset filters
            </button>
          )}
        </div>
        {categories.error && (
          <ErrorState error={categories.error} retry={() => categories.refetch()} />
        )}
        <div className="list-caption">
          <strong>{q.data?.total ?? '…'} tasks</strong>
          <span>Select a task to view or edit</span>
        </div>
        {q.isPending || dashboard.isPending ? (
          <Loading />
        ) : q.error || dashboard.error ? (
          <ErrorState
            error={(q.error || dashboard.error)!}
            retry={() => {
              q.refetch();
              dashboard.refetch();
            }}
          />
        ) : q.data.items.length ? (
          <TaskRows tasks={q.data.items} today={dashboard.data!.today} />
        ) : (
          <Empty
            title="A clear space"
            body="No tasks match this view. Try another filter or create something new."
          />
        )}
        {q.data && q.data.total > 0 && (
          <div className="pagination">
            <span>
              Page {q.data.page} of {Math.ceil(q.data.total / q.data.pageSize)}
            </span>
            <div>
              <button
                aria-label="Previous page"
                disabled={q.data.page <= 1}
                onClick={() => {
                  const n = new URLSearchParams(params);
                  n.set('page', String(q.data.page - 1));
                  setParams(n);
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                aria-label="Next page"
                disabled={q.data.page * q.data.pageSize >= q.data.total}
                onClick={() => {
                  const n = new URLSearchParams(params);
                  n.set('page', String(q.data.page + 1));
                  setParams(n);
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
