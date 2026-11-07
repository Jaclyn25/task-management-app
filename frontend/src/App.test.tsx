import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { vi, test, expect, beforeEach } from 'vitest'
import App from './App'
import { api, ApiError } from './api'
import type { Dashboard, Task } from './types'
vi.mock('./api', async original => ({ ...await original<typeof import('./api')>(), api: vi.fn() }))
const task: Task = { id: 'task-1', title: 'Prepare proposal', description: 'Some useful context', categoryId: null, categoryName: null, priority: 2, status: 0, startDate: null, dueDate: '2026-11-06', createdAt: '2026-11-07T08:00:00Z', updatedAt: '2026-11-07T08:00:00Z', completedAt: null, version: 'version-1' }
const dashboard: Dashboard = { total: 1, toDo: 1, inProgress: 0, completed: 0, overdue: 1, upcoming: 0, completionPercentage: 0, today: '2026-11-07', timeZone: 'UTC', priorities: ['Low','Medium','High','Urgent'].map(name => ({name, count: name === 'High' ? 1 : 0})), statuses: [{name:'To Do',count:1},{name:'In Progress',count:0},{name:'Completed',count:0}], progress: [{day:'2026-11-07',completed:0}], recentTasks:[task],deadlines:[task] }
beforeEach(() => { vi.mocked(api).mockReset(); vi.mocked(api).mockImplementation(async path => {
  if (path === '/account/profile') return { id: 'u', displayName: 'Alex Fiction', email:'alex@example.test',timeZone:'UTC' }
  if (path === '/categories') return [{id:'cat-1', name:'Work',version:'v',taskCount:1}]
  if (path === '/dashboard') return dashboard
  if (path.startsWith('/tasks?')) return {items:[task],total:1,page:1,pageSize:20}
  if (path === '/tasks/task-1') return task
  return task
}) })
function mount(path: string) { const client = new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}}); return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><App/></MemoryRouter></QueryClientProvider>) }
test('task form shows field validation and sends normalized dates and priority', async () => {
  const user = userEvent.setup(); mount('/tasks/new')
  await user.click(await screen.findByRole('button',{name:'Create task'})); expect(await screen.findByText('Give your task a title.')).toBeInTheDocument()
  await user.type(screen.getByLabelText(/Task title/), 'Write a report'); await user.selectOptions(screen.getByLabelText('Priority'),'3')
  await user.click(screen.getByRole('button',{name:'Create task'}))
  await waitFor(() => expect(api).toHaveBeenCalledWith('/tasks', expect.objectContaining({method:'POST',body:expect.stringContaining('"priority":3')})))
})
test('task form rejects a deadline before the start date', async () => {
  const user = userEvent.setup(); mount('/tasks/new'); await user.type(await screen.findByLabelText(/Task title/),'Plan')
  await user.type(screen.getByLabelText('Start date'),'2026-11-10'); await user.type(screen.getByLabelText('Due date'),'2026-11-09')
  await user.click(screen.getByRole('button',{name:'Create task'})); expect(await screen.findByText('Due date must be on or after the start date.')).toBeInTheDocument()
})
test('editing loads task values and sends its concurrency version', async () => {
  const user = userEvent.setup(); mount('/tasks/task-1/edit')
  const title = await screen.findByLabelText(/Task title/); expect(title).toHaveValue(task.title); await user.clear(title); await user.type(title,'Revised proposal')
  await user.click(screen.getByRole('button',{name:'Save changes'})); await waitFor(() => expect(api).toHaveBeenCalledWith('/tasks/task-1',expect.objectContaining({method:'PUT',body:expect.stringContaining('version-1')})))
})
test('filters update server query for category and priority', async () => {
  const user = userEvent.setup(); mount('/tasks'); await screen.findByText('Prepare proposal')
  await user.selectOptions(screen.getByLabelText('Category filter'),'cat-1'); await user.selectOptions(screen.getByLabelText('Priority filter'),'3')
  await waitFor(() => expect(api).toHaveBeenCalledWith(expect.stringContaining('categoryId=cat-1&priority=3')))
})
test('detail status update persists and deadline says overdue', async () => {
  const user = userEvent.setup(); mount('/tasks/task-1'); expect(await screen.findByText(/Overdue ·/)).toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText('Task status'),'2'); await waitFor(() => expect(api).toHaveBeenCalledWith('/tasks/task-1',expect.objectContaining({method:'PUT',body:expect.stringContaining('"status":2')})))
})
test('deleting a task requires confirmation', async () => {
  const user = userEvent.setup(); mount('/tasks/task-1'); await user.click(await screen.findByRole('button',{name:'Delete task'}))
  expect(screen.getByRole('dialog')).toBeVisible(); expect(api).not.toHaveBeenCalledWith(expect.anything(),expect.objectContaining({method:'DELETE'}))
  await user.click(screen.getByRole('button',{name:/^Delete$/})); await waitFor(() => expect(api).toHaveBeenCalledWith('/tasks/task-1?version=version-1',{method:'DELETE'}))
})
test('dashboard renders real metrics and useful links', async () => { mount('/'); expect(await screen.findByText('0 due in the next seven days · 1 overdue')).toBeInTheDocument(); expect(screen.getByRole('heading',{name:'Your progress, this week'})).toBeInTheDocument() })
test('empty tasks explain how to begin', async () => { vi.mocked(api).mockImplementation(async p => p === '/account/profile' ? {displayName:'Alex',timeZone:'UTC'} : p === '/categories' ? [] : p === '/dashboard' ? dashboard : {items:[],total:0,page:1,pageSize:20}); mount('/tasks'); expect(await screen.findByText('A clear space')).toBeInTheDocument() })
test('API errors provide a retry action', async () => { const base = vi.mocked(api).getMockImplementation()!; vi.mocked(api).mockImplementation(async p => { if(p.startsWith('/tasks?')) throw new ApiError('Unable to load tasks.',503); return base(p) }); mount('/tasks'); expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load tasks.'); expect(screen.getByRole('button',{name:'Try again'})).toBeInTheDocument() })
test('sign-in form validates email and password', async () => { vi.mocked(api).mockRejectedValue(new ApiError('Sign in',401)); const user = userEvent.setup(); mount('/login'); await user.click(await screen.findByRole('button',{name:'Sign in'})); expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument(); expect(screen.getByText('Enter your password.')).toBeInTheDocument() })
test('board status controls persist a versioned change', async () => {
  const base = vi.mocked(api).getMockImplementation()!
  vi.mocked(api).mockImplementation(async (p, init) => p.startsWith('/tasks?status=') && !p.includes('status=0') ? {items:[],total:0,page:1,pageSize:12} : base(p,init))
  const user=userEvent.setup(); mount('/board'); await user.selectOptions(await screen.findByLabelText('Move Prepare proposal'),'1')
  await waitFor(()=>expect(api).toHaveBeenCalledWith('/tasks/task-1',expect.objectContaining({method:'PUT',body:expect.stringContaining('"status":1')})))
})

