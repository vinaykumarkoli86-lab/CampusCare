export type UserRole = 'student' | 'admin';

export type ComplaintStatus =
  | 'Pending'
  | 'Under Review'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type ComplaintCategory =
  | 'Infrastructure'
  | 'IT & Wi-Fi'
  | 'Hostel & Mess'
  | 'Electrical'
  | 'Sanitation'
  | 'Security & Safety'
  | 'Academic Facilities';

export type DepartmentName =
  | 'Unassigned'
  | 'Facilities & Maintenance'
  | 'Campus IT Services'
  | 'Hostel Administration'
  | 'Electrical Engineering'
  | 'Sanitation & Grounds'
  | 'Campus Security'
  | 'Academic Operations';

export const COMPLAINT_STATUSES: ComplaintStatus[] = [
  'Pending',
  'Under Review',
  'In Progress',
  'Resolved',
  'Rejected',
];

export const COMPLAINT_PRIORITIES: ComplaintPriority[] = [
  'Low',
  'Medium',
  'High',
  'Urgent',
];

export const COMPLAINT_CATEGORIES: ComplaintCategory[] = [
  'Infrastructure',
  'IT & Wi-Fi',
  'Hostel & Mess',
  'Electrical',
  'Sanitation',
  'Security & Safety',
  'Academic Facilities',
];

export const DEPARTMENTS: DepartmentName[] = [
  'Unassigned',
  'Facilities & Maintenance',
  'Campus IT Services',
  'Hostel Administration',
  'Electrical Engineering',
  'Sanitation & Grounds',
  'Campus Security',
  'Academic Operations',
];

export interface CampusZoneMeta {
  name: string;
  code: string;
  x: number;
  y: number;
  sector: string;
}

export const CAMPUS_LOCATIONS: CampusZoneMeta[] = [
  { name: 'North Hostel Block A', code: 'NH-A', x: 20, y: 20, sector: 'Residential North' },
  { name: 'North Hostel Block B', code: 'NH-B', x: 34, y: 17, sector: 'Residential North' },
  { name: 'Engineering Block C', code: 'ENG-C', x: 24, y: 50, sector: 'Academic West' },
  { name: 'Central Library', code: 'LIB-01', x: 52, y: 48, sector: 'Central Quad' },
  { name: 'Science Lab Wing', code: 'SCI-W', x: 68, y: 42, sector: 'Research East' },
  { name: 'Main Auditorium', code: 'AUD-M', x: 74, y: 58, sector: 'Cultural Ring' },
  { name: 'Sports Complex', code: 'SPT-X', x: 22, y: 80, sector: 'Athletics South' },
  { name: 'Student Canteen', code: 'CNT-02', x: 43, y: 74, sector: 'Commons South' },
];

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentIdNumber?: string;
  department?: string;
  createdAt: string;
}

export interface StatusHistoryEntry {
  id: string;
  status: ComplaintStatus;
  comment: string;
  updatedBy: string;
  updatedByRole: UserRole;
  department: DepartmentName;
  timestamp: string;
}

export interface Complaint {
  id: string;
  complaintCode: string;
  title: string;
  category: ComplaintCategory;
  description: string;
  location: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  department: DepartmentName;
  isAnonymous: boolean;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentRollNumber?: string;
  imageUrl?: string;
  adminComment?: string;
  upvotes: number;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  complaintId: string;
  complaintCode: string;
  title: string;
  message: string;
  status: ComplaintStatus;
  isRead: boolean;
  createdAt: string;
}

export interface DuplicateMatch {
  id: string;
  complaintCode: string;
  title: string;
  category: ComplaintCategory;
  location: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  similarity: number;
  createdAt: string;
}

export interface HeatmapZoneStat {
  location: string;
  code: string;
  sector: string;
  x: number;
  y: number;
  totalCount: number;
  openCount: number;
  urgentCount: number;
  resolvedCount: number;
  intensity: number; // 0 to 100
  topCategory: string;
}

export interface DepartmentMetric {
  department: DepartmentName;
  totalAssigned: number;
  resolvedCount: number;
  activeCount: number;
  urgentCount: number;
  avgResolutionHours: number;
  resolutionRate: number;
}

export interface OverviewStats {
  totalComplaints: number;
  resolvedComplaints: number;
  inProgressComplaints: number;
  urgentOpenComplaints: number;
  avgResolutionHours: number;
  resolutionRate: number;
  heatmap: HeatmapZoneStat[];
  departments: DepartmentMetric[];
  categoryBreakdown: { category: ComplaintCategory; count: number; openCount: number }[];
  statusBreakdown: { status: ComplaintStatus; count: number }[];
}
