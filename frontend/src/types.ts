export const priorities = ['Low', 'Medium', 'High', 'Urgent'] as const;
export const statuses = ['To Do', 'In Progress', 'Completed'] as const;
export interface Profile {
  id: string;
  email: string;
  displayName: string;
  timeZone: string;
}
export interface Category {
  id: string;
  name: string;
  version: string;
  taskCount: number;
}
export interface Task {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  priority: number;
  status: number;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  version: string;
}
export interface TaskInput {
  title: string;
  description: string;
  categoryId: string | null;
  priority: number;
  status: number;
  startDate: string | null;
  dueDate: string | null;
  version?: string;
}
export interface PageResult {
  items: Task[];
  total: number;
  page: number;
  pageSize: number;
}
export interface Dashboard {
  total: number;
  toDo: number;
  inProgress: number;
  completed: number;
  overdue: number;
  upcoming: number;
  completionPercentage: number;
  today: string;
  timeZone: string;
  priorities: { name: string; count: number }[];
  statuses: { name: string; count: number }[];
  progress: { day: string; completed: number }[];
  recentTasks: Task[];
  deadlines: Task[];
}
