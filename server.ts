import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import {
  hashPassword,
  requireAdmin,
  requireAuth,
  signAuthToken,
  verifyPassword,
  type AuthenticatedRequest,
} from './server/auth.ts';
import {
  computeOverviewStats,
  ensureConfiguredAdmin,
  findDuplicateComplaints,
  getUploadsDir,
  loadDatabase,
  sanitizeComplaintForViewer,
  sanitizeUser,
  saveBase64Image,
  saveDatabase,
} from './server/db.ts';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  DEPARTMENTS,
  type Complaint,
  type ComplaintCategory,
  type ComplaintPriority,
  type ComplaintStatus,
  type DepartmentName,
} from './src/types.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize DB and sync configured environment admin on boot
loadDatabase();
ensureConfiguredAdmin();

// Safe uploaded image serving
app.get('/uploads/:filename', (req, res) => {
  const safeName = path.basename(req.params.filename);
  const fullPath = path.join(getUploadsDir(), safeName);
  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: 'Attachment not found.' });
    return;
  }
  res.sendFile(fullPath);
});

// Public aggregate overview (no PII)
app.get('/api/public/overview', (_req, res) => {
  const db = loadDatabase();
  res.json(computeOverviewStats(db));
});

// Auth: Register Student
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, studentIdNumber, department } = req.body ?? {};
  if (
    typeof name !== 'string' ||
    name.trim().length < 2 ||
    typeof email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof password !== 'string' ||
    password.length < 6
  ) {
    res.status(400).json({
      error: 'Please provide a valid full name, university email, and password (min 6 chars).',
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = loadDatabase();
  if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const newUser = {
    id: `usr_${crypto.randomBytes(6).toString('hex')}`,
    name: name.trim().slice(0, 80),
    email: normalizedEmail,
    role: 'student' as const, // Strict RBAC: self-registration is strictly student
    studentIdNumber:
      typeof studentIdNumber === 'string' && studentIdNumber.trim()
        ? studentIdNumber.trim().slice(0, 32)
        : `STU-${Math.floor(1000 + Math.random() * 9000)}`,
    department:
      typeof department === 'string' && department.trim()
        ? department.trim().slice(0, 64)
        : 'Undergraduate Studies',
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password),
  };

  db.users.push(newUser);
  saveDatabase(db);

  const token = signAuthToken({
    sub: newUser.id,
    role: newUser.role,
    email: newUser.email,
  });

  res.status(201).json({
    token,
    user: sanitizeUser(newUser),
  });
});

// Auth: Student Login (keeps student login strictly separate from admin portal)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = loadDatabase();
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (user.role === 'admin') {
    res.status(403).json({
      error: 'Administrator accounts must sign in through the dedicated Admin Login page.',
    });
    return;
  }

  const token = signAuthToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });

  res.json({
    token,
    user: sanitizeUser(user),
  });
});

// Auth: Dedicated Admin Login (Strictly requires admin role & verifies ADMIN_EMAIL/ADMIN_PASSWORD or stored admin hash)
app.post('/api/auth/admin/login', (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Administrator email and password are required.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const envAdminEmail = (process.env.ADMIN_EMAIL || 'campuscare.admin@campus.edu')
    .trim()
    .toLowerCase();
  const envAdminPass = process.env.ADMIN_PASSWORD;

  const db = loadDatabase();
  let user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  // Reject student accounts immediately before any password bypass
  if (user && user.role !== 'admin') {
    res.status(403).json({
      error: 'Access denied: Student credentials cannot be used for administrator login.',
    });
    return;
  }

  // Verify against configured ADMIN_EMAIL + ADMIN_PASSWORD if matching
  let authenticatedViaEnv = false;
  if (
    envAdminEmail &&
    envAdminPass &&
    envAdminPass.length >= 6 &&
    normalizedEmail === envAdminEmail
  ) {
    const a = Buffer.from(password, 'utf-8');
    const b = Buffer.from(envAdminPass, 'utf-8');
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      authenticatedViaEnv = true;
      if (!user) {
        ensureConfiguredAdmin();
        user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
      }
    }
  }

  if (!user) {
    res.status(401).json({ error: 'Invalid administrator email or password.' });
    return;
  }

  const authenticatedViaHash = verifyPassword(password, user.passwordHash);
  if (!authenticatedViaEnv && !authenticatedViaHash) {
    res.status(401).json({ error: 'Invalid administrator email or password.' });
    return;
  }

  const token = signAuthToken({
    sub: user.id,
    role: 'admin',
    email: user.email,
  });

  res.json({
    token,
    user: sanitizeUser(user),
  });
});

// Auth: Current User
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = loadDatabase();
  const user = db.users.find((u) => u.id === req.auth!.sub);
  if (!user) {
    res.status(404).json({ error: 'User profile not found.' });
    return;
  }
  res.json({ user: sanitizeUser(user) });
});

// Duplicate Check
app.post('/api/complaints/check-duplicates', requireAuth, (req, res) => {
  const { title, description, category, location } = req.body ?? {};
  if (typeof title !== 'string' || title.trim().length < 4) {
    res.json({ matches: [] });
    return;
  }
  const db = loadDatabase();
  const matches = findDuplicateComplaints(db, {
    title: title.trim(),
    description: typeof description === 'string' ? description : '',
    category: typeof category === 'string' ? category : undefined,
    location: typeof location === 'string' ? location : undefined,
  });
  res.json({ matches });
});

// List Complaints (RBAC enforced: student sees own only, admin sees all)
app.get('/api/complaints', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = loadDatabase();
  const isAdmin = req.auth!.role === 'admin';
  let list = isAdmin
    ? db.complaints
    : db.complaints.filter((c) => c.studentId === req.auth!.sub);

  const { status, category, priority, department, location, search, urgentOnly } = req.query;

  if (typeof status === 'string' && status !== 'All') {
    list = list.filter((c) => c.status === status);
  }
  if (typeof category === 'string' && category !== 'All') {
    list = list.filter((c) => c.category === category);
  }
  if (typeof priority === 'string' && priority !== 'All') {
    list = list.filter((c) => c.priority === priority);
  }
  if (typeof department === 'string' && department !== 'All') {
    list = list.filter((c) => c.department === department);
  }
  if (typeof location === 'string' && location !== 'All') {
    list = list.filter((c) => c.location === location);
  }
  if (urgentOnly === 'true') {
    list = list.filter(
      (c) => c.priority === 'Urgent' && c.status !== 'Resolved' && c.status !== 'Rejected'
    );
  }
  if (typeof search === 'string' && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (c) =>
        c.complaintCode.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }

  const sorted = [...list]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((c) => sanitizeComplaintForViewer(c, req.auth!.role, req.auth!.sub));

  res.json({ complaints: sorted });
});

// Get single complaint
app.get('/api/complaints/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = loadDatabase();
  const complaint = db.complaints.find((c) => c.id === req.params.id);
  if (!complaint) {
    res.status(404).json({ error: 'Complaint not found.' });
    return;
  }
  if (req.auth!.role !== 'admin' && complaint.studentId !== req.auth!.sub) {
    res.status(403).json({ error: 'Forbidden: You can only access your own complaints.' });
    return;
  }
  res.json({
    complaint: sanitizeComplaintForViewer(complaint, req.auth!.role, req.auth!.sub),
  });
});

// Create Complaint
app.post('/api/complaints', requireAuth, (req: AuthenticatedRequest, res) => {
  const { title, category, description, location, priority, isAnonymous, imageDataUrl } =
    req.body ?? {};

  if (typeof title !== 'string' || title.trim().length < 5 || title.trim().length > 140) {
    res.status(400).json({ error: 'Title must be between 5 and 140 characters.' });
    return;
  }
  if (!COMPLAINT_CATEGORIES.includes(category as ComplaintCategory)) {
    res.status(400).json({ error: 'Please select a valid complaint category.' });
    return;
  }
  if (typeof description !== 'string' || description.trim().length < 15 || description.trim().length > 2000) {
    res.status(400).json({ error: 'Description must be between 15 and 2000 characters.' });
    return;
  }
  if (typeof location !== 'string' || location.trim().length < 2) {
    res.status(400).json({ error: 'Please select a valid campus location.' });
    return;
  }
  if (!COMPLAINT_PRIORITIES.includes(priority as ComplaintPriority)) {
    res.status(400).json({ error: 'Please select a valid priority level.' });
    return;
  }

  const db = loadDatabase();
  const user = db.users.find((u) => u.id === req.auth!.sub);
  if (!user) {
    res.status(401).json({ error: 'User record not found.' });
    return;
  }

  let imageUrl: string | undefined;
  if (typeof imageDataUrl === 'string' && imageDataUrl.trim().length > 0) {
    try {
      imageUrl = saveBase64Image(imageDataUrl.trim());
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid image upload.' });
      return;
    }
  }

  const seq = db.nextComplaintSequence++;
  const complaintCode = `CC-2026-${String(seq).padStart(4, '0')}`;
  const now = new Date().toISOString();
  const anon = Boolean(isAnonymous);

  const newComplaint: Complaint = {
    id: `cmp_${crypto.randomBytes(6).toString('hex')}`,
    complaintCode,
    title: title.trim(),
    category: category as ComplaintCategory,
    description: description.trim(),
    location: location.trim(),
    priority: priority as ComplaintPriority,
    status: 'Pending',
    department: 'Unassigned',
    isAnonymous: anon,
    studentId: user.id,
    studentName: user.name,
    studentEmail: user.email,
    studentRollNumber: user.studentIdNumber,
    imageUrl,
    upvotes: 1,
    createdAt: now,
    updatedAt: now,
    statusHistory: [
      {
        id: `sh_${crypto.randomBytes(5).toString('hex')}`,
        status: 'Pending',
        comment: anon
          ? 'Anonymous complaint registered in CAMPUSCARE queue.'
          : 'Complaint submitted and awaiting initial triage.',
        updatedBy: anon ? 'Anonymous Student' : user.name,
        updatedByRole: user.role,
        department: 'Unassigned',
        timestamp: now,
      },
    ],
  };

  db.complaints.unshift(newComplaint);

  // Create confirmation notification for student
  db.notifications.unshift({
    id: `ntf_${crypto.randomBytes(5).toString('hex')}`,
    userId: user.id,
    complaintId: newComplaint.id,
    complaintCode: newComplaint.complaintCode,
    title: 'Complaint Registered',
    message: `Ticket ${newComplaint.complaintCode} ("${newComplaint.title.slice(0, 48)}") has been logged for review.`,
    status: 'Pending',
    isRead: false,
    createdAt: now,
  });

  saveDatabase(db);

  res.status(201).json({
    complaint: sanitizeComplaintForViewer(newComplaint, req.auth!.role, req.auth!.sub),
  });
});

// Admin: Update Complaint Status / Department / Comment / Priority
app.patch('/api/complaints/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { status, department, adminComment, priority } = req.body ?? {};
  const db = loadDatabase();
  const idx = db.complaints.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Complaint not found.' });
    return;
  }

  const adminUser = db.users.find((u) => u.id === req.auth!.sub);
  const complaint = db.complaints[idx];
  const now = new Date().toISOString();

  const nextStatus: ComplaintStatus =
    typeof status === 'string' && COMPLAINT_STATUSES.includes(status as ComplaintStatus)
      ? (status as ComplaintStatus)
      : complaint.status;

  const nextDepartment: DepartmentName =
    typeof department === 'string' && DEPARTMENTS.includes(department as DepartmentName)
      ? (department as DepartmentName)
      : complaint.department;

  const nextPriority: ComplaintPriority =
    typeof priority === 'string' && COMPLAINT_PRIORITIES.includes(priority as ComplaintPriority)
      ? (priority as ComplaintPriority)
      : complaint.priority;

  const cleanComment =
    typeof adminComment === 'string' && adminComment.trim().length > 0
      ? adminComment.trim().slice(0, 1000)
      : '';

  const hasChanged =
    nextStatus !== complaint.status ||
    nextDepartment !== complaint.department ||
    nextPriority !== complaint.priority ||
    cleanComment.length > 0;

  if (!hasChanged) {
    res.status(400).json({ error: 'No changes detected to update.' });
    return;
  }

  const summaryParts: string[] = [];
  if (nextStatus !== complaint.status) summaryParts.push(`Status changed to ${nextStatus}`);
  if (nextDepartment !== complaint.department) summaryParts.push(`Assigned to ${nextDepartment}`);
  if (nextPriority !== complaint.priority) summaryParts.push(`Priority adjusted to ${nextPriority}`);
  const historyNote = cleanComment || summaryParts.join(' · ') || 'Administrative update recorded.';

  const updated: Complaint = {
    ...complaint,
    status: nextStatus,
    department: nextDepartment,
    priority: nextPriority,
    adminComment: cleanComment || complaint.adminComment,
    updatedAt: now,
    resolvedAt:
      nextStatus === 'Resolved'
        ? complaint.resolvedAt || now
        : nextStatus === 'Pending' || nextStatus === 'Under Review' || nextStatus === 'In Progress'
        ? undefined
        : complaint.resolvedAt,
    statusHistory: [
      ...complaint.statusHistory,
      {
        id: `sh_${crypto.randomBytes(5).toString('hex')}`,
        status: nextStatus,
        comment: historyNote,
        updatedBy: adminUser?.name || 'Campus Administrator',
        updatedByRole: 'admin',
        department: nextDepartment,
        timestamp: now,
      },
    ],
  };

  db.complaints[idx] = updated;

  // Persistent notification to the complaint owner
  db.notifications.unshift({
    id: `ntf_${crypto.randomBytes(5).toString('hex')}`,
    userId: complaint.studentId,
    complaintId: complaint.id,
    complaintCode: complaint.complaintCode,
    title: `Ticket ${complaint.complaintCode}: ${nextStatus}`,
    message: historyNote,
    status: nextStatus,
    isRead: false,
    createdAt: now,
  });

  saveDatabase(db);

  res.json({
    complaint: sanitizeComplaintForViewer(updated, req.auth!.role, req.auth!.sub),
  });
});

// Admin: Analytics endpoint
app.get('/api/analytics', requireAuth, requireAdmin, (_req, res) => {
  const db = loadDatabase();
  res.json(computeOverviewStats(db));
});

// Student/User Notifications
app.get('/api/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = loadDatabase();
  const list = db.notifications
    .filter((n) => n.userId === req.auth!.sub)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ notifications: list });
});

app.patch('/api/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = loadDatabase();
  const notification = db.notifications.find((n) => n.id === req.params.id);
  if (!notification) {
    res.status(404).json({ error: 'Notification not found.' });
    return;
  }
  if (notification.userId !== req.auth!.sub) {
    res.status(403).json({ error: 'Forbidden.' });
    return;
  }
  notification.isRead = true;
  saveDatabase(db);
  res.json({ notification });
});

app.post('/api/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res) => {
  const db = loadDatabase();
  for (const n of db.notifications) {
    if (n.userId === req.auth!.sub) {
      n.isRead = true;
    }
  }
  saveDatabase(db);
  res.json({ ok: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CAMPUSCARE server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
