import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { hashPassword, verifyPassword } from './auth.ts';
import {
  CAMPUS_LOCATIONS,
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  DEPARTMENTS,
  type Complaint,
  type ComplaintCategory,
  type ComplaintPriority,
  type ComplaintStatus,
  type DepartmentMetric,
  type DepartmentName,
  type DuplicateMatch,
  type HeatmapZoneStat,
  type NotificationItem,
  type OverviewStats,
  type UserPublic,
  type UserRole,
} from '../src/types.ts';

export interface StoredUser extends UserPublic {
  passwordHash: string;
}

export interface DatabaseSchema {
  nextComplaintSequence: number;
  users: StoredUser[];
  complaints: Complaint[];
  notifications: NotificationItem[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'campuscare.json');

function ensureStorageDirs(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}

function createSeedDatabase(): DatabaseSchema {
  const adminId = 'usr_admin_01';
  const adminUserId2 = 'usr_admin_02';
  const student1Id = 'usr_stu_01';
  const student2Id = 'usr_stu_02';
  const student3Id = 'usr_stu_03';
  const bootstrapAdminPassword =
    process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 6
      ? process.env.ADMIN_PASSWORD
      : crypto.randomBytes(16).toString('hex');

  const users: StoredUser[] = [
    {
      id: adminId,
      name: 'Dr. Vikramaditya Rao',
      email: 'admin@campuscare.edu',
      role: 'admin',
      department: 'Dean of Campus Operations',
      createdAt: hoursAgo(720),
      passwordHash: hashPassword(bootstrapAdminPassword),
    },
    {
      id: adminUserId2,
      name: 'Vinay Kumar Koli',
      email: 'vinaykumarkoli86@gmail.com',
      role: 'admin',
      department: 'Campus Command Administration',
      createdAt: hoursAgo(720),
      passwordHash: hashPassword(bootstrapAdminPassword),
    },
    {
      id: student1Id,
      name: 'Aarav Sharma',
      email: 'aarav.sharma@campus.edu',
      role: 'student',
      studentIdNumber: 'CS2024-118',
      department: 'Computer Science & Engineering',
      createdAt: hoursAgo(600),
      passwordHash: hashPassword('student123'),
    },
    {
      id: student2Id,
      name: 'Meera Patel',
      email: 'meera.patel@campus.edu',
      role: 'student',
      studentIdNumber: 'EC2024-042',
      department: 'Electronics & Communication',
      createdAt: hoursAgo(500),
      passwordHash: hashPassword('student123'),
    },
    {
      id: student3Id,
      name: 'Rohan Nair',
      email: 'rohan.nair@campus.edu',
      role: 'student',
      studentIdNumber: 'ME2023-209',
      department: 'Mechanical Engineering',
      createdAt: hoursAgo(450),
      passwordHash: hashPassword('student123'),
    },
  ];

  const complaints: Complaint[] = [
    {
      id: 'cmp_1001',
      complaintCode: 'CC-2026-0101',
      title: 'Main electrical distribution panel sparking on 3rd floor corridor',
      category: 'Electrical',
      description:
        'Circuit breaker cabinet outside Room 304 is emitting intermittent sparks and a burnt insulation smell whenever the lab HVAC compressors cycle.',
      location: 'Engineering Block C',
      priority: 'Urgent',
      status: 'In Progress',
      department: 'Electrical Engineering',
      isAnonymous: false,
      studentId: student1Id,
      studentName: 'Aarav Sharma',
      studentEmail: 'aarav.sharma@campus.edu',
      studentRollNumber: 'CS2024-118',
      adminComment:
        'High-voltage maintenance crew dispatched. Corridor sub-panel isolated on backup feeder while relay module is replaced.',
      upvotes: 14,
      createdAt: hoursAgo(6),
      updatedAt: hoursAgo(2),
      statusHistory: [
        {
          id: 'sh_1001_1',
          status: 'Pending',
          comment: 'Complaint submitted by student and flagged as Urgent.',
          updatedBy: 'Aarav Sharma',
          updatedByRole: 'student',
          department: 'Unassigned',
          timestamp: hoursAgo(6),
        },
        {
          id: 'sh_1001_2',
          status: 'Under Review',
          comment: 'Escalated immediately to Electrical Engineering safety lead.',
          updatedBy: 'Dr. Vikramaditya Rao',
          updatedByRole: 'admin',
          department: 'Electrical Engineering',
          timestamp: hoursAgo(4.5),
        },
        {
          id: 'sh_1001_3',
          status: 'In Progress',
          comment:
            'High-voltage maintenance crew dispatched. Corridor sub-panel isolated on backup feeder while relay module is replaced.',
          updatedBy: 'Dr. Vikramaditya Rao',
          updatedByRole: 'admin',
          department: 'Electrical Engineering',
          timestamp: hoursAgo(2),
        },
      ],
    },
    {
      id: 'cmp_1002',
      complaintCode: 'CC-2026-0102',
      title: 'Campus Wi-Fi 6 access points dropping packets in Reading Hall 2',
      category: 'IT & Wi-Fi',
      description:
        'Students preparing for mid-semester assessments experience continuous DNS timeouts and 40% packet loss on EduNet-5GHz across the east wing desks.',
      location: 'Central Library',
      priority: 'High',
      status: 'In Progress',
      department: 'Campus IT Services',
      isAnonymous: false,
      studentId: student1Id,
      studentName: 'Aarav Sharma',
      studentEmail: 'aarav.sharma@campus.edu',
      studentRollNumber: 'CS2024-118',
      adminComment: 'Channel interference confirmed on AP-LIB-09 and AP-LIB-11. Firmware rollback and PoE switch replacement scheduled.',
      upvotes: 22,
      createdAt: hoursAgo(28),
      updatedAt: hoursAgo(8),
      statusHistory: [
        {
          id: 'sh_1002_1',
          status: 'Pending',
          comment: 'Ticket logged with packet loss diagnostics.',
          updatedBy: 'Aarav Sharma',
          updatedByRole: 'student',
          department: 'Unassigned',
          timestamp: hoursAgo(28),
        },
        {
          id: 'sh_1002_2',
          status: 'In Progress',
          comment: 'Channel interference confirmed on AP-LIB-09 and AP-LIB-11. Firmware rollback and PoE switch replacement scheduled.',
          updatedBy: 'Dr. Vikramaditya Rao',
          updatedByRole: 'admin',
          department: 'Campus IT Services',
          timestamp: hoursAgo(8),
        },
      ],
    },
    {
      id: 'cmp_1003',
      complaintCode: 'CC-2026-0103',
      title: 'Hot water boiler failure and low pressure on Floor 4 showers',
      category: 'Hostel & Mess',
      description:
        'Solar-electric hybrid water heater for North Wing Floor 4 has been offline since yesterday evening, leaving 48 residents without hot water.',
      location: 'North Hostel Block A',
      priority: 'High',
      status: 'Resolved',
      department: 'Hostel Administration',
      isAnonymous: false,
      studentId: student2Id,
      studentName: 'Meera Patel',
      studentEmail: 'meera.patel@campus.edu',
      studentRollNumber: 'EC2024-042',
      adminComment: 'Replaced thermostat valve and bled pressure manifold. Full thermal output verified at 58°C.',
      upvotes: 19,
      createdAt: hoursAgo(42),
      updatedAt: hoursAgo(26),
      resolvedAt: hoursAgo(26),
      statusHistory: [
        {
          id: 'sh_1003_1',
          status: 'Pending',
          comment: 'Reported outage affecting Floor 4 washrooms.',
          updatedBy: 'Meera Patel',
          updatedByRole: 'student',
          department: 'Unassigned',
          timestamp: hoursAgo(42),
        },
        {
          id: 'sh_1003_2',
          status: 'In Progress',
          comment: 'Plumbing technician inspecting heat exchanger valve.',
          updatedBy: 'Dr. Vikramaditya Rao',
          updatedByRole: 'admin',
          department: 'Hostel Administration',
          timestamp: hoursAgo(34),
        },
        {
          id: 'sh_1003_3',
          status: 'Resolved',
          comment: 'Replaced thermostat valve and bled pressure manifold. Full thermal output verified at 58°C.',
          updatedBy: 'Dr. Vikramaditya Rao',
          updatedByRole: 'admin',
          department: 'Hostel Administration',
          timestamp: hoursAgo(26),
        },
      ],
    },
    {
      id: 'cmp_1004',
      complaintCode: 'CC-2026-0104',
      title: 'Broken perimeter security floodlight near West Gate bicycle bay',
      category: 'Security & Safety',
      description:
        'Two LED mast floodlights along the walkway connecting Hostel Block A and Engineering Block C have completely failed, creating a dark blind spot after 7 PM.',
      location: 'North Hostel Block A',
      priority: 'Urgent',
      status: 'Under Review',
      department: 'Campus Security',
      isAnonymous: true,
      studentId: student1Id,
      studentName: 'Aarav Sharma',
      studentEmail: 'aarav.sharma@campus.edu',
      studentRollNumber: 'CS2024-118',
      adminComment: 'Temporary mobile security patrol assigned to West Gate path while mast lighting crew inspects underground conduit.',
      upvotes: 11,
      createdAt: hoursAgo(5),
      updatedAt: hoursAgo(3),
      statusHistory: [
        {
          id: 'sh_1004_1',
          status: 'Pending',
          comment: 'Anonymous safety report filed.',
          updatedBy: 'Anonymous Student',
          updatedByRole: 'student',
          department: 'Unassigned',
          timestamp: hoursAgo(5),
        },
        {
          id: 'sh_1004_2',
          status: 'Under Review',
          comment: 'Temporary mobile security patrol assigned to West Gate path while mast lighting crew inspects underground conduit.',
          updatedBy: 'Dr. Vikramaditya Rao',
          updatedByRole: 'admin',
          department: 'Campus Security',
          timestamp: hoursAgo(3),
        },
      ],
    },
    {
      id: 'cmp_1005',
      complaintCode: 'CC-2026-0105',
      title: 'Water seepage from ceiling duct in Chemistry Synthesis Lab 2B',
      category: 'Infrastructure',
      description:
        'Chilled-water HVAC condensation line above fume hood #3 is dripping onto the benchtop area. Bucket placed temporarily to protect analytical balances.',
      location: 'Science Lab Wing',
      priority: 'Urgent',
      status: 'Pending',
      department: 'Facilities & Maintenance',
      isAnonymous: false,
      studentId: student3Id,
      studentName: 'Rohan Nair',
      studentEmail: 'rohan.nair@campus.edu',
      studentRollNumber: 'ME2023-209',
      upvotes: 8,
      createdAt: hoursAgo(2.5),
      updatedAt: hoursAgo(2.5),
      statusHistory: [
        {
          id: 'sh_1005_1',
          status: 'Pending',
          comment: 'Urgent lab infrastructure report logged.',
          updatedBy: 'Rohan Nair',
          updatedByRole: 'student',
          department: 'Unassigned',
          timestamp: hoursAgo(2.5),
        },
      ],
    },
    {
      id: 'cmp_1006',
      complaintCode: 'CC-2026-0106',
      title: 'RO drinking water dispenser filter warning & metallic taste',
      category: 'Sanitation',
      description:
        'Ground floor hydration station near the Canteen billing counter shows red TDS warning indicator (380 ppm) and needs cartridge replacement.',
      location: 'Student Canteen',
      priority: 'High',
      status: 'Resolved',
      department: 'Sanitation & Grounds',
      isAnonymous: false,
      studentId: student2Id,
      studentName: 'Meera Patel',
      studentEmail: 'meera.patel@campus.edu',
      studentRollNumber: 'EC2024-042',
      adminComment: 'RO membrane and carbon pre-filter replaced. Post-flush TDS measured at 42 ppm.',
      upvotes: 16,
      createdAt: hoursAgo(72),
      updatedAt: hoursAgo(58),
      resolvedAt: hoursAgo(58),
      statusHistory: [
        {
          id: 'sh_1006_1',
          status: 'Pending',
          comment: 'Reported high TDS reading on Canteen RO unit.',
          updatedBy: 'Meera Patel',
          updatedByRole: 'student',
          department: 'Unassigned',
          timestamp: hoursAgo(72),
        },
        {
          id: 'sh_1006_2',
          status: 'Resolved',
          comment: 'RO membrane and carbon pre-filter replaced. Post-flush TDS measured at 42 ppm.',
          updatedBy: 'Dr. Vikramaditya Rao',
          updatedByRole: 'admin',
          department: 'Sanitation & Grounds',
          timestamp: hoursAgo(58),
        },
      ],
    },
    {
      id: 'cmp_1007',
      complaintCode: 'CC-2026-0107',
      title: '4K laser projector color wheel flickering in Seminar Hall A',
      category: 'Academic Facilities',
      description:
        'During morning algorithms lectures, the ceiling-mounted projector flickers magenta every 10 minutes and drops HDMI signal from the podium dock.',
      location: 'Engineering Block C',
      priority: 'Medium',
      status: 'Resolved',
      department: 'Academic Operations',
      isAnonymous: false,
      studentId: student1Id,
      studentName: 'Aarav Sharma',
      studentEmail: 'aarav.sharma@campus.edu',
      studentRollNumber: 'CS2024-118',
      adminComment: 'Replaced active optical HDMI repeater and cleaned laser phosphor intake filter. Tested 2-hour continuous projection.',
      upvotes: 9,
      createdAt: hoursAgo(96),
      updatedAt: hoursAgo(78),
      resolvedAt: hoursAgo(78),
      statusHistory: [
        {
          id: 'sh_1007_1',
          status: 'Pending',
          comment: 'Logged AV hardware issue for Seminar Hall A.',
          updatedBy: 'Aarav Sharma',
          updatedByRole: 'student',
          department: 'Unassigned',
          timestamp: hoursAgo(96),
        },
        {
          id: 'sh_1007_2',
          status: 'In Progress',
          comment: 'AV engineer inspecting ceiling mount and HDMI matrix.',
          updatedBy: 'Dr. Vikramaditya Rao',
          updatedByRole: 'admin',
          department: 'Academic Operations',
          timestamp: hoursAgo(86),
        },
        {
          id: 'sh_1007_3',
          status: 'Resolved',
          comment: 'Replaced active optical HDMI repeater and cleaned laser phosphor intake filter. Tested 2-hour continuous projection.',
          updatedBy: 'Dr. Vikramaditya Rao',
          updatedByRole: 'admin',
          department: 'Academic Operations',
          timestamp: hoursAgo(78),
        },
      ],
    },
    {
      id: 'cmp_1008',
      complaintCode: 'CC-2026-0108',
      title: 'Badminton court synthetic mat peeling near baseline',
      category: 'Infrastructure',
      description:
        'Court 2 PVC flooring seam has lifted by nearly 2cm near the north service line, creating a tripping hazard during evening intramural matches.',
      location: 'Sports Complex',
      priority: 'Medium',
      status: 'Under Review',
      department: 'Facilities & Maintenance',
      isAnonymous: false,
      studentId: student3Id,
      studentName: 'Rohan Nair',
      studentEmail: 'rohan.nair@campus.edu',
      studentRollNumber: 'ME2023-209',
      adminComment: 'Court 2 cordoned off. Flooring vendor scheduled for heat-weld seam repair tomorrow at 9 AM.',
      upvotes: 7,
      createdAt: hoursAgo(36),
      updatedAt: hoursAgo(20),
      statusHistory: [
        {
          id: 'sh_1008_1',
          status: 'Pending',
          comment: 'Safety hazard reported on Indoor Court 2.',
          updatedBy: 'Rohan Nair',
          updatedByRole: 'student',
          department: 'Unassigned',
          timestamp: hoursAgo(36),
        },
        {
          id: 'sh_1008_2',
          status: 'Under Review',
          comment: 'Court 2 cordoned off. Flooring vendor scheduled for heat-weld seam repair tomorrow at 9 AM.',
          updatedBy: 'Dr. Vikramaditya Rao',
          updatedByRole: 'admin',
          department: 'Facilities & Maintenance',
          timestamp: hoursAgo(20),
        },
      ],
    },
    {
      id: 'cmp_1009',
      complaintCode: 'CC-2026-0109',
      title: 'Acoustic echo & wireless mic dropouts in Main Auditorium balcony',
      category: 'Academic Facilities',
      description:
        'Rear balcony speakers have noticeable delay mismatch during symposium Q&A sessions and handheld mic #2 cuts out beyond row 12.',
      location: 'Main Auditorium',
      priority: 'Low',
      status: 'Resolved',
      department: 'Academic Operations',
      isAnonymous: false,
      studentId: student2Id,
      studentName: 'Meera Patel',
      studentEmail: 'meera.patel@campus.edu',
      studentRollNumber: 'EC2024-042',
      adminComment: 'Recalibrated DSP delay timing (18ms) and repositioned UHF diversity antenna.',
      upvotes: 5,
      createdAt: hoursAgo(120),
      updatedAt: hoursAgo(102),
      resolvedAt: hoursAgo(102),
      statusHistory: [
        {
          id: 'sh_1009_1',
          status: 'Pending',
          comment: 'Submitted auditorium acoustic calibration request.',
          updatedBy: 'Meera Patel',
          updatedByRole: 'student',
          department: 'Unassigned',
          timestamp: hoursAgo(120),
        },
        {
          id: 'sh_1009_2',
          status: 'Resolved',
          comment: 'Recalibrated DSP delay timing (18ms) and repositioned UHF diversity antenna.',
          updatedBy: 'Dr. Vikramaditya Rao',
          updatedByRole: 'admin',
          department: 'Academic Operations',
          timestamp: hoursAgo(102),
        },
      ],
    },
    {
      id: 'cmp_1010',
      complaintCode: 'CC-2026-0110',
      title: 'Overflowing recycling bins behind North Hostel Block B courtyard',
      category: 'Sanitation',
      description:
        'Waste collection skip near Block B east exit has not been cleared in two days and is attracting stray animals.',
      location: 'North Hostel Block B',
      priority: 'Medium',
      status: 'Resolved',
      department: 'Sanitation & Grounds',
      isAnonymous: false,
      studentId: student3Id,
      studentName: 'Rohan Nair',
      studentEmail: 'rohan.nair@campus.edu',
      studentRollNumber: 'ME2023-209',
      adminComment: 'Cleared all bins, sanitized pad, and added twice-daily pickup window for Block B.',
      upvotes: 6,
      createdAt: hoursAgo(50),
      updatedAt: hoursAgo(44),
      resolvedAt: hoursAgo(44),
      statusHistory: [
        {
          id: 'sh_1010_1',
          status: 'Pending',
          comment: 'Reported overflowing bins at Block B.',
          updatedBy: 'Rohan Nair',
          updatedByRole: 'student',
          department: 'Unassigned',
          timestamp: hoursAgo(50),
        },
        {
          id: 'sh_1010_2',
          status: 'Resolved',
          comment: 'Cleared all bins, sanitized pad, and added twice-daily pickup window for Block B.',
          updatedBy: 'Dr. Vikramaditya Rao',
          updatedByRole: 'admin',
          department: 'Sanitation & Grounds',
          timestamp: hoursAgo(44),
        },
      ],
    },
    {
      id: 'cmp_1011',
      complaintCode: 'CC-2026-0111',
      title: 'Card-reader turnstile jammed at Central Library east entrance',
      category: 'Security & Safety',
      description:
        'Student ID NFC reader on Gate 2 fails to unlock the barrier arm for valid cards, causing bottlenecks between 9 AM and 10 AM.',
      location: 'Central Library',
      priority: 'High',
      status: 'Resolved',
      department: 'Campus Security',
      isAnonymous: false,
      studentId: student1Id,
      studentName: 'Aarav Sharma',
      studentEmail: 'aarav.sharma@campus.edu',
      studentRollNumber: 'CS2024-118',
      adminComment: 'Replaced RFID antenna coil and lubricated solenoid latch.',
      upvotes: 12,
      createdAt: hoursAgo(68),
      updatedAt: hoursAgo(57),
      resolvedAt: hoursAgo(57),
      statusHistory: [
        {
          id: 'sh_1011_1',
          status: 'Pending',
          comment: 'Reported Gate 2 NFC turnstile malfunction.',
          updatedBy: 'Aarav Sharma',
          updatedByRole: 'student',
          department: 'Unassigned',
          timestamp: hoursAgo(68),
        },
        {
          id: 'sh_1011_2',
          status: 'Resolved',
          comment: 'Replaced RFID antenna coil and lubricated solenoid latch.',
          updatedBy: 'Dr. Vikramaditya Rao',
          updatedByRole: 'admin',
          department: 'Campus Security',
          timestamp: hoursAgo(57),
        },
      ],
    },
    {
      id: 'cmp_1012',
      complaintCode: 'CC-2026-0112',
      title: 'Request to convert study lounge into private gaming room',
      category: 'Academic Facilities',
      description:
        'Proposal to remove quiet study carrels on Library Mezzanine and install console gaming booths.',
      location: 'Central Library',
      priority: 'Low',
      status: 'Rejected',
      department: 'Academic Operations',
      isAnonymous: false,
      studentId: student3Id,
      studentName: 'Rohan Nair',
      studentEmail: 'rohan.nair@campus.edu',
      studentRollNumber: 'ME2023-209',
      adminComment: 'Library Mezzanine is designated as a silent academic zone per Student Senate Charter. Recreational lounges remain in the Student Center.',
      upvotes: 2,
      createdAt: hoursAgo(140),
      updatedAt: hoursAgo(130),
      statusHistory: [
        {
          id: 'sh_1012_1',
          status: 'Pending',
          comment: 'Submitted facility reallocation request.',
          updatedBy: 'Rohan Nair',
          updatedByRole: 'student',
          department: 'Unassigned',
          timestamp: hoursAgo(140),
        },
        {
          id: 'sh_1012_2',
          status: 'Rejected',
          comment: 'Library Mezzanine is designated as a silent academic zone per Student Senate Charter. Recreational lounges remain in the Student Center.',
          updatedBy: 'Dr. Vikramaditya Rao',
          updatedByRole: 'admin',
          department: 'Academic Operations',
          timestamp: hoursAgo(130),
        },
      ],
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'ntf_01',
      userId: student1Id,
      complaintId: 'cmp_1001',
      complaintCode: 'CC-2026-0101',
      title: 'Status Updated: In Progress',
      message: 'Electrical Engineering crew dispatched to Engineering Block C 3rd floor corridor.',
      status: 'In Progress',
      isRead: false,
      createdAt: hoursAgo(2),
    },
    {
      id: 'ntf_02',
      userId: student1Id,
      complaintId: 'cmp_1004',
      complaintCode: 'CC-2026-0104',
      title: 'Assigned to Campus Security',
      message: 'Your anonymous safety report at North Hostel Block A is now Under Review.',
      status: 'Under Review',
      isRead: false,
      createdAt: hoursAgo(3),
    },
    {
      id: 'ntf_03',
      userId: student1Id,
      complaintId: 'cmp_1002',
      complaintCode: 'CC-2026-0102',
      title: 'IT Diagnostics Underway',
      message: 'Campus IT Services confirmed AP interference in Reading Hall 2 and scheduled switch replacement.',
      status: 'In Progress',
      isRead: true,
      createdAt: hoursAgo(8),
    },
    {
      id: 'ntf_04',
      userId: student2Id,
      complaintId: 'cmp_1003',
      complaintCode: 'CC-2026-0103',
      title: 'Complaint Resolved',
      message: 'Boiler thermostat valve replaced in North Hostel Block A. Hot water restored.',
      status: 'Resolved',
      isRead: false,
      createdAt: hoursAgo(26),
    },
  ];

  return {
    nextComplaintSequence: 1013,
    users,
    complaints,
    notifications,
  };
}

let cachedDb: DatabaseSchema | null = null;

export function loadDatabase(): DatabaseSchema {
  ensureStorageDirs();
  if (cachedDb) return cachedDb;

  if (!fs.existsSync(DB_PATH)) {
    const seeded = createSeedDatabase();
    saveDatabase(seeded);
    cachedDb = seeded;
    return seeded;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    cachedDb = JSON.parse(raw) as DatabaseSchema;
    return cachedDb;
  } catch {
    const seeded = createSeedDatabase();
    saveDatabase(seeded);
    cachedDb = seeded;
    return seeded;
  }
}

export function ensureConfiguredAdmin(): void {
  const adminEmail = (process.env.ADMIN_EMAIL || 'campuscare.admin@campus.edu')
    .trim()
    .toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword || adminPassword.length < 6) {
    return;
  }

  const db = loadDatabase();
  const existing = db.users.find((u) => u.email.toLowerCase() === adminEmail);

  if (existing) {
    // Never elevate a student account to admin
    if (existing.role !== 'admin') {
      console.warn(
        `[CAMPUSCARE] ADMIN_EMAIL (${adminEmail}) matches an existing student account and will not be elevated.`
      );
      return;
    }
    if (!verifyPassword(adminPassword, existing.passwordHash)) {
      existing.passwordHash = hashPassword(adminPassword);
      saveDatabase(db);
    }
    return;
  }

  db.users.unshift({
    id: 'usr_admin_env',
    name: 'CampusCare Administrator',
    email: adminEmail,
    role: 'admin',
    department: 'Campus Command Administration',
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(adminPassword),
  });
  saveDatabase(db);
}

export function saveDatabase(db: DatabaseSchema): void {
  ensureStorageDirs();
  cachedDb = db;
  const tempPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_PATH);
}

export function sanitizeUser(user: StoredUser): UserPublic {
  const { passwordHash: _ignored, ...pub } = user;
  return pub;
}

export function sanitizeComplaintForViewer(complaint: Complaint, viewerRole: UserRole, viewerId: string): Complaint {
  if (complaint.isAnonymous && viewerRole === 'admin' && complaint.studentId !== viewerId) {
    return {
      ...complaint,
      studentName: 'Anonymous Student',
      studentEmail: 'Protected Identity',
      studentRollNumber: undefined,
    };
  }
  return complaint;
}

export function saveBase64Image(dataUrl: string): string | undefined {
  if (!dataUrl || typeof dataUrl !== 'string') return undefined;
  const match = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) {
    throw new Error('Invalid image format. Only PNG, JPEG, and WebP images are supported.');
  }
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Image exceeds the 5MB maximum file size.');
  }
  ensureStorageDirs();
  const filename = `evidence_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

export function getUploadsDir(): string {
  ensureStorageDirs();
  return UPLOADS_DIR;
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'near', 'into', 'have',
  'has', 'been', 'are', 'was', 'were', 'not', 'but', 'issue', 'problem', 'complaint',
  'broken', 'campus', 'block', 'floor', 'room', 'area',
]);

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  return new Set(words);
}

export function findDuplicateComplaints(
  db: DatabaseSchema,
  input: { title: string; description?: string; category?: string; location?: string }
): DuplicateMatch[] {
  const queryTokens = tokenize(`${input.title} ${input.description || ''}`);
  if (queryTokens.size === 0 && !input.location) return [];

  const matches: DuplicateMatch[] = [];

  for (const c of db.complaints) {
    if (c.status === 'Rejected') continue;

    const targetTokens = tokenize(`${c.title} ${c.description}`);
    let intersection = 0;
    for (const token of queryTokens) {
      if (targetTokens.has(token)) intersection++;
    }
    const union = new Set([...queryTokens, ...targetTokens]).size;
    const lexicalScore = union > 0 ? intersection / union : 0;

    const sameLocation = input.location && c.location === input.location ? 0.28 : 0;
    const sameCategory = input.category && c.category === input.category ? 0.2 : 0;

    // Require meaningful lexical overlap OR strong same location+category match
    const rawScore = lexicalScore * 0.65 + sameLocation + sameCategory;
    const percentage = Math.min(98, Math.round(rawScore * 100));

    if ((intersection >= 1 && percentage >= 32) || (sameLocation > 0 && sameCategory > 0 && lexicalScore > 0.08)) {
      matches.push({
        id: c.id,
        complaintCode: c.complaintCode,
        title: c.title,
        category: c.category,
        location: c.location,
        status: c.status,
        priority: c.priority,
        similarity: percentage,
        createdAt: c.createdAt,
      });
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 4);
}

export function computeOverviewStats(db: DatabaseSchema): OverviewStats {
  const complaints = db.complaints;
  const totalComplaints = complaints.length;
  const resolved = complaints.filter((c) => c.status === 'Resolved');
  const resolvedComplaints = resolved.length;
  const inProgressComplaints = complaints.filter(
    (c) => c.status === 'Pending' || c.status === 'Under Review' || c.status === 'In Progress'
  ).length;
  const urgentOpenComplaints = complaints.filter(
    (c) => c.priority === 'Urgent' && c.status !== 'Resolved' && c.status !== 'Rejected'
  ).length;

  const resolutionHoursList = resolved
    .filter((c) => c.resolvedAt)
    .map((c) => {
      const start = new Date(c.createdAt).getTime();
      const end = new Date(c.resolvedAt!).getTime();
      return Math.max(0.5, (end - start) / (1000 * 3600));
    });

  const avgResolutionHours =
    resolutionHoursList.length > 0
      ? Number((resolutionHoursList.reduce((a, b) => a + b, 0) / resolutionHoursList.length).toFixed(1))
      : 0;

  const actionableCount = complaints.filter((c) => c.status !== 'Rejected').length;
  const resolutionRate =
    actionableCount > 0 ? Math.round((resolvedComplaints / actionableCount) * 100) : 0;

  // Heatmap zones
  const heatmap: HeatmapZoneStat[] = CAMPUS_LOCATIONS.map((zone) => {
    const zoneComplaints = complaints.filter((c) => c.location === zone.name);
    const openCount = zoneComplaints.filter(
      (c) => c.status !== 'Resolved' && c.status !== 'Rejected'
    ).length;
    const urgentCount = zoneComplaints.filter(
      (c) => c.priority === 'Urgent' && c.status !== 'Resolved' && c.status !== 'Rejected'
    ).length;
    const resolvedCount = zoneComplaints.filter((c) => c.status === 'Resolved').length;

    const categoryCounts: Record<string, number> = {};
    for (const zc of zoneComplaints) {
      categoryCounts[zc.category] = (categoryCounts[zc.category] || 0) + 1;
    }
    const topCategory =
      Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Nominal';

    // Weighted intensity (0-100) driven by open & urgent issues + total volume
    const rawIntensity = openCount * 24 + urgentCount * 28 + zoneComplaints.length * 8;
    const intensity = Math.min(100, rawIntensity);

    return {
      location: zone.name,
      code: zone.code,
      sector: zone.sector,
      x: zone.x,
      y: zone.y,
      totalCount: zoneComplaints.length,
      openCount,
      urgentCount,
      resolvedCount,
      intensity,
      topCategory,
    };
  });

  // Department metrics
  const departments: DepartmentMetric[] = DEPARTMENTS.filter((d) => d !== 'Unassigned').map(
    (dept: DepartmentName) => {
      const deptComplaints = complaints.filter((c) => c.department === dept);
      const deptResolved = deptComplaints.filter((c) => c.status === 'Resolved');
      const deptActive = deptComplaints.filter(
        (c) => c.status !== 'Resolved' && c.status !== 'Rejected'
      );
      const deptUrgent = deptActive.filter((c) => c.priority === 'Urgent');

      const hrs = deptResolved
        .filter((c) => c.resolvedAt)
        .map((c) =>
          Math.max(
            0.5,
            (new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime()) / 3600000
          )
        );
      const deptAvgHrs =
        hrs.length > 0 ? Number((hrs.reduce((a, b) => a + b, 0) / hrs.length).toFixed(1)) : 0;
      const actionable = deptComplaints.filter((c) => c.status !== 'Rejected').length;
      const rate = actionable > 0 ? Math.round((deptResolved.length / actionable) * 100) : 0;

      return {
        department: dept,
        totalAssigned: deptComplaints.length,
        resolvedCount: deptResolved.length,
        activeCount: deptActive.length,
        urgentCount: deptUrgent.length,
        avgResolutionHours: deptAvgHrs,
        resolutionRate: rate,
      };
    }
  );

  const categoryBreakdown = COMPLAINT_CATEGORIES.map((category: ComplaintCategory) => {
    const items = complaints.filter((c) => c.category === category);
    return {
      category,
      count: items.length,
      openCount: items.filter((c) => c.status !== 'Resolved' && c.status !== 'Rejected').length,
    };
  });

  const statusBreakdown = COMPLAINT_STATUSES.map((status: ComplaintStatus) => ({
    status,
    count: complaints.filter((c) => c.status === status).length,
  }));

  return {
    totalComplaints,
    resolvedComplaints,
    inProgressComplaints,
    urgentOpenComplaints,
    avgResolutionHours,
    resolutionRate,
    heatmap,
    departments,
    categoryBreakdown,
    statusBreakdown,
  };
}
