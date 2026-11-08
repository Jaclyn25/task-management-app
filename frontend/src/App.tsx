import { useEffect, useState, createContext, useContext } from 'react';
import { NavLink, Link, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ListTodo,
  Columns3,
  CalendarDays,
  CheckCircle2,
  Tags,
  UserRound,
  LogOut,
  Plus,
  Menu,
  Sun,
  Moon,
  AlertCircle,
} from 'lucide-react';
import { api, ApiError } from './api';
import type { Profile } from './types';
import { Loading, ErrorState } from './ui';
import Auth from './pages/Auth';
import DashboardPage from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskEditor from './pages/TaskEditor';
import TaskDetails from './pages/TaskDetails';
import Categories from './pages/Categories';
import Account from './pages/Account';
import Board from './pages/Board';

const UserContext = createContext<Profile | null>(null);
const FeedbackContext = createContext<(message: string) => void>(() => {});
export const useProfile = () => useContext(UserContext)!;
export const useFeedback = () => useContext(FeedbackContext);
const nav = [
  ['/', 'Overview', LayoutDashboard],
  ['/tasks', 'All tasks', ListTodo],
  ['/board', 'Board', Columns3],
  ['/deadlines', 'Deadlines', CalendarDays],
  ['/completed', 'Completed', CheckCircle2],
  ['/categories', 'Categories', Tags],
] as const;
function Shell({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('daymark-theme') as 'light' | 'dark' | null;
    return (
      saved ||
      (typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light')
    );
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('daymark-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const client = useQueryClient();
  const navigate = useNavigate();
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(timer);
  }, [message]);
  async function logout() {
    try {
      await api('/account/logout', { method: 'POST' });
      client.clear();
      navigate('/login');
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <UserContext.Provider value={profile}>
      <FeedbackContext.Provider value={setMessage}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="workspace">
          <aside className={`sidebar ${open ? 'open' : ''}`}>
            <Link to="/" className="brand" onClick={() => setOpen(false)}>
              <span className="brand-mark">
                <Sun size={23} />
              </span>
              daymark<span className="brand-dot">.</span>
            </Link>
            <div className="workspace-label">PERSONAL WORKSPACE</div>
            <nav aria-label="Main navigation">
              {nav.map(([to, label, Icon]) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/' || to === '/tasks'}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={19} />
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="sidebar-note">
              <span className="eyebrow">A LITTLE DIRECTION</span>
              <p>
                Small steps.
                <br />
                Meaningful progress.
              </p>
              <span>Make today count.</span>
            </div>
            <div className="sidebar-bottom">
              <NavLink to="/account" onClick={() => setOpen(false)}>
                <span className="avatar">{profile.displayName[0]?.toUpperCase()}</span>
                <span>
                  <strong>{profile.displayName}</strong>
                  <small>Personal account</small>
                </span>
                <UserRound size={16} />
              </NavLink>
              <button type="button" onClick={logout}>
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </aside>
          {open && (
            <button
              type="button"
              className="scrim"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            />
          )}
          <div className="main-shell">
            <header className="topbar">
              <button
                type="button"
                className="icon-button mobile-menu"
                aria-label="Toggle navigation"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
              >
                <Menu size={22} />
              </button>
              <span className="topbar-label">Your day, with direction</span>
              <span className="topbar-right">
                <button
                  type="button"
                  className="icon-button"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <span className="private-label">Private workspace</span>
                <Link className="button primary compact" to="/tasks/new">
                  <Plus size={17} />
                  New task
                </Link>
              </span>
            </header>
            <main id="main" tabIndex={-1}>
              <Outlet />
            </main>
            <footer>
              Daymark <span>Plan with intention. Finish with clarity.</span>
            </footer>
          </div>
        </div>
        <div role="status" aria-live="polite" className={message ? 'toast' : 'sr-only'}>
          {message}
        </div>
      </FeedbackContext.Provider>
    </UserContext.Provider>
  );
}
export default function App() {
  const client = useQueryClient();
  const user = useQuery({
    queryKey: ['profile'],
    queryFn: () => api<Profile>('/account/profile'),
    retry: false,
  });
  useEffect(() => {
    const expired = () => {
      client.clear();
      window.location.assign('/login');
    };
    window.addEventListener('session-expired', expired);
    return () => window.removeEventListener('session-expired', expired);
  }, [client]);
  if (user.isPending) return <Loading />;
  if (user.error && !(user.error instanceof ApiError && user.error.status === 401))
    return <ErrorState error={user.error} retry={() => user.refetch()} />;
  return (
    <Routes>
      <Route path="/login" element={user.data ? <Navigate to="/" replace /> : <Auth />} />
      <Route
        path="/register"
        element={user.data ? <Navigate to="/" replace /> : <Auth register />}
      />
      {user.data ? (
        <Route element={<Shell profile={user.data} />}>
          <Route index element={<DashboardPage />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/new" element={<TaskEditor />} />
          <Route path="tasks/:id" element={<TaskDetails />} />
          <Route path="tasks/:id/edit" element={<TaskEditor />} />
          <Route path="categories" element={<Categories />} />
          <Route path="board" element={<Board />} />
          <Route path="deadlines" element={<Tasks mode="deadlines" />} />
          <Route path="completed" element={<Tasks mode="completed" />} />
          <Route path="account" element={<Account />} />
          <Route
            path="*"
            element={
              <div className="empty panel" style={{ maxWidth: 540, margin: '48px auto' }}>
                <div className="empty-icon-box" aria-hidden="true">
                  <AlertCircle size={28} />
                </div>
                <h3>Page not found</h3>
                <p>The page or task you are looking for does not exist or may have been moved.</p>
                <Link className="button primary" to="/">
                  Return to overview
                </Link>
              </div>
            }
          />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
