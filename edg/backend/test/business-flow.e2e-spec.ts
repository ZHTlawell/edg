/**
 * Business Flow E2E Tests
 *
 * Covers end-to-end business logic chains:
 *   1. Auth: login, role-based password reset guard
 *   2. Course management: PATCH requires admin role
 *   3. Enrollment: create order → pay → asset account created + auto-class assigned
 *   4. Duplicate prevention: same course can't be ordered twice while PAID
 *   5. Refund: apply (status=PENDING, locks qty) → approve → wallet credited
 *   6. Refund: reject → unlocks qty, status=REJECTED
 *   7. Lesson progress: complete deducts remaining_qty; idempotent
 *   8. Access control: role-based endpoint guards
 *
 * Uses the real dev SQLite database; all test data uses `__TEST__` prefix.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

const PREFIX = '__TEST__';

async function loginAs(app: INestApplication, username: string, password: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ username, password })
    .expect(201);
  return res.body.access_token;
}

describe('Business Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let campusId: string;
  let adminUsername: string;
  let campusAdminUsername: string;
  let studentUsername: string;
  let teacherUsername: string;
  let courseId: string;
  let studentId: string;

  const PASSWORD = 'test1234';

  // ─── Setup ───────────────────────────────────────────────────────────────

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    const hash = await bcrypt.hash(PASSWORD, 10);
    const ts = Date.now();
    campusId = `${PREFIX}campus_${ts}`;

    adminUsername = `${PREFIX}admin_${ts}`;
    await prisma.sysUser.create({
      data: { username: adminUsername, password_hash: hash, role: 'ADMIN', status: 'ACTIVE' },
    });

    campusAdminUsername = `${PREFIX}cadmin_${ts}`;
    await prisma.sysUser.create({
      data: { username: campusAdminUsername, password_hash: hash, role: 'CAMPUS_ADMIN', campus_id: campusId, status: 'ACTIVE' },
    });

    teacherUsername = `${PREFIX}teacher_${ts}`;
    const teacherUser = await prisma.sysUser.create({
      data: { username: teacherUsername, password_hash: hash, role: 'TEACHER', campus_id: campusId, status: 'ACTIVE' },
    });
    await prisma.eduTeacher.create({ data: { name: `${PREFIX}老师_${ts}`, user_id: teacherUser.id } });

    studentUsername = `${PREFIX}student_${ts}`;
    const studentUser = await prisma.sysUser.create({
      data: { username: studentUsername, password_hash: hash, role: 'STUDENT', campus_id: campusId, status: 'ACTIVE' },
    });
    const student = await prisma.eduStudent.create({ data: { name: `${PREFIX}学员_${ts}`, user_id: studentUser.id } });
    studentId = student.id;

    const course = await prisma.edCourse.create({
      data: { name: `${PREFIX}课程_${ts}`, category: 'TEST', price: 800, total_lessons: 10, campus_id: campusId, status: 'ENABLED' },
    });
    courseId = course.id;
  });

  // ─── Teardown ─────────────────────────────────────────────────────────────

  afterAll(async () => {
    // Delete in dependency order
    const accounts = await prisma.finAssetAccount.findMany({ where: { student_id: studentId } });
    for (const acc of accounts) {
      await prisma.finAssetLedger.deleteMany({ where: { account_id: acc.id } });
      await prisma.finRefundRecord.deleteMany({ where: { account_id: acc.id } });
    }
    // Orphan refund records linked by order_id
    const orders = await prisma.finOrder.findMany({ where: { student_id: studentId } });
    for (const ord of orders) {
      await prisma.finRefundRecord.deleteMany({ where: { order_id: ord.id } });
      await prisma.finPaymentRecord.deleteMany({ where: { order_id: ord.id } });
    }
    await prisma.finAssetAccount.deleteMany({ where: { student_id: studentId } });
    await prisma.finOrder.deleteMany({ where: { student_id: studentId } });
    await prisma.studentLessonProgress.deleteMany({ where: { student_id: studentId } });
    await prisma.eduStudentInClass.deleteMany({ where: { student_id: studentId } });

    const testClasses = await prisma.edClass.findMany({ where: { name: { startsWith: PREFIX } } });
    for (const cls of testClasses) {
      await prisma.edLessonSchedule.deleteMany({ where: { assignment: { class_id: cls.id } } });
      await prisma.edClassAssignment.deleteMany({ where: { class_id: cls.id } });
      await prisma.eduStudentInClass.deleteMany({ where: { class_id: cls.id } });
      await prisma.edClass.delete({ where: { id: cls.id } });
    }

    await prisma.edCourse.delete({ where: { id: courseId } });
    await prisma.eduStudent.deleteMany({ where: { name: { startsWith: PREFIX } } });
    await prisma.eduTeacher.deleteMany({ where: { name: { startsWith: PREFIX } } });
    await prisma.sysUser.deleteMany({ where: { username: { startsWith: PREFIX } } });

    await app.close();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. AUTH
  // ═══════════════════════════════════════════════════════════════════════════

  describe('1. Auth', () => {
    it('1-1. 正确凭证登录 → 返回 access_token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: adminUsername, password: PASSWORD })
        .expect(201);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.user.role).toBe('ADMIN');
    });

    it('1-2. 错误密码 → 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: adminUsername, password: 'wrongpass' })
        .expect(401);
    });

    it('1-3. 未登录调用 reset-password → 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ username: studentUsername, newPassword: 'newpass' })
        .expect(401);
    });

    it('1-4. 学员 token 调用 reset-password → 401（权限不足）', async () => {
      const token = await loginAs(app, studentUsername, PASSWORD);
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: studentUsername, newPassword: 'newpass' })
        .expect(401);
    });

    it('1-5. ADMIN 可重置任意账号密码', async () => {
      const token = await loginAs(app, adminUsername, PASSWORD);
      const res = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: studentUsername, newPassword: PASSWORD })
        .expect(201);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. COURSE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  describe('2. 课程管理权限', () => {
    it('2-1. 未登录 PATCH 课程 → 401', async () => {
      await request(app.getHttpServer())
        .patch(`/academic/courses/${courseId}`)
        .send({ name: 'hacked' })
        .expect(401);
    });

    it('2-2. 学员 token PATCH 课程 → 401', async () => {
      const token = await loginAs(app, studentUsername, PASSWORD);
      await request(app.getHttpServer())
        .patch(`/academic/courses/${courseId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'hacked' })
        .expect(401);
    });

    it('2-3. CAMPUS_ADMIN 可修改课程名称', async () => {
      const token = await loginAs(app, campusAdminUsername, PASSWORD);
      const res = await request(app.getHttpServer())
        .patch(`/academic/courses/${courseId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `${PREFIX}课程_已更新` })
        .expect(200);
      expect(res.body.name).toBe(`${PREFIX}课程_已更新`);
      // Restore name
      await request(app.getHttpServer())
        .patch(`/academic/courses/${courseId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `${PREFIX}课程` });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. ENROLLMENT FLOW
  // ═══════════════════════════════════════════════════════════════════════════

  let orderId: string;
  let accountId: string;

  describe('3. 报名购课流程', () => {
    it('3-1. 管理员代学员创建订单 → PENDING_PAYMENT', async () => {
      const token = await loginAs(app, adminUsername, PASSWORD);
      const res = await request(app.getHttpServer())
        .post('/finance/order')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId, courseId, amount: 800, totalQty: 10 })
        .expect(201);
      expect(res.body.status).toBe('PENDING_PAYMENT');
      orderId = res.body.id;
    });

    it('3-2. 同课程重复下单（PENDING_PAYMENT 存在）→ 400', async () => {
      const token = await loginAs(app, adminUsername, PASSWORD);
      await request(app.getHttpServer())
        .post('/finance/order')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId, courseId, amount: 800, totalQty: 10 })
        .expect(400);
    });

    it('3-3. 支付订单 → 201，返回 accountId', async () => {
      const token = await loginAs(app, campusAdminUsername, PASSWORD);
      const res = await request(app.getHttpServer())
        .post('/finance/pay')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderId, amount: 800, channel: 'WECHAT', campusId })
        .expect(201);
      expect(res.body.accountId).toBeDefined();
      expect(res.body.lessons).toBe(10);
      accountId = res.body.accountId;
    });

    it('3-4. 支付后资产账户 remaining_qty=10, status=ACTIVE', async () => {
      const account = await prisma.finAssetAccount.findUnique({ where: { id: accountId } });
      expect(account).not.toBeNull();
      expect(account!.remaining_qty).toBe(10);
      expect(account!.status).toBe('ACTIVE');
    });

    it('3-5. 同课程重复下单（PAID 存在）→ 400', async () => {
      const token = await loginAs(app, adminUsername, PASSWORD);
      await request(app.getHttpServer())
        .post('/finance/order')
        .set('Authorization', `Bearer ${token}`)
        .send({ studentId, courseId, amount: 800, totalQty: 10 })
        .expect(400);
    });

    it('3-6. 学员可查看自己的订单列表', async () => {
      const token = await loginAs(app, studentUsername, PASSWORD);
      const res = await request(app.getHttpServer())
        .get('/finance/my-orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const found = res.body.find((o: any) => o.id === orderId);
      expect(found).toBeDefined();
      expect(found.status).toBe('PAID');
    });

    it('3-7. 学员可查看自己的资产账户', async () => {
      const token = await loginAs(app, studentUsername, PASSWORD);
      const res = await request(app.getHttpServer())
        .get('/finance/my-assets')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const acc = res.body.accounts.find((a: any) => a.id === accountId);
      expect(acc).toBeDefined();
      expect(acc.remaining_qty).toBe(10);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. 退费申请 → 审批通过
  // ═══════════════════════════════════════════════════════════════════════════

  let refundId: string;

  describe('4. 退费流程 — 审批通过', () => {
    it('4-1. 学员申请退费 → status=PENDING, estimated_amount=800', async () => {
      const token = await loginAs(app, studentUsername, PASSWORD);
      const res = await request(app.getHttpServer())
        .post('/finance/refund/apply')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderId, reason: '个人原因退课' })
        .expect(201);
      expect(res.body.status).toBe('PENDING');
      expect(Number(res.body.estimated_amount)).toBe(800);
      expect(Number(res.body.requested_qty)).toBe(10);
      refundId = res.body.id;
    });

    it('4-2. 申请后资产账户 locked_qty=10', async () => {
      const account = await prisma.finAssetAccount.findUnique({ where: { id: accountId } });
      expect(account!.locked_qty).toBe(10);
    });

    it('4-3. 重复申请退费 → 400（已有 PENDING）', async () => {
      const token = await loginAs(app, studentUsername, PASSWORD);
      await request(app.getHttpServer())
        .post('/finance/refund/apply')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderId, reason: '重复申请' })
        .expect(400);
    });

    it('4-4. 管理员可查看待审批列表', async () => {
      const token = await loginAs(app, adminUsername, PASSWORD);
      const res = await request(app.getHttpServer())
        .get('/finance/refund/pending')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.find((r: any) => r.id === refundId)).toBeDefined();
    });

    it('4-5. 学员无法访问 refund/pending → 401', async () => {
      const token = await loginAs(app, studentUsername, PASSWORD);
      await request(app.getHttpServer())
        .get('/finance/refund/pending')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('4-6. CAMPUS_ADMIN 审批通过 → success=true', async () => {
      const token = await loginAs(app, campusAdminUsername, PASSWORD);
      const res = await request(app.getHttpServer())
        .post('/finance/refund/approve')
        .set('Authorization', `Bearer ${token}`)
        .send({ refundId, isApproved: true })
        .expect(201);
      expect(res.body.success).toBe(true);
    });

    it('4-7. 审批后账户 status=REFUNDED, remaining_qty=0', async () => {
      const account = await prisma.finAssetAccount.findUnique({ where: { id: accountId } });
      expect(account!.status).toBe('REFUNDED');
      expect(account!.remaining_qty).toBe(0);
      expect(Number(account!.refunded_amount)).toBe(800);
    });

    it('4-8. 退费金额进入学员钱包 balance=800', async () => {
      const student = await prisma.eduStudent.findUnique({ where: { id: studentId } });
      expect(Number(student!.balance)).toBe(800);
    });

    it('4-9. 订单状态更新为 REFUNDED', async () => {
      const order = await prisma.finOrder.findUnique({ where: { id: orderId } });
      expect(order!.status).toBe('REFUNDED');
    });

    it('4-10. 退费申请记录中 amount = 800（审批时写入）', async () => {
      const rec = await prisma.finRefundRecord.findUnique({ where: { id: refundId } });
      expect(Number(rec!.amount)).toBe(800);
      expect(rec!.status).toBe('APPROVED');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. 退费申请 → 审批拒绝
  // ═══════════════════════════════════════════════════════════════════════════

  let rejectOrderId: string;
  let rejectAccountId: string;
  let rejectRefundId: string;

  describe('5. 退费流程 — 审批拒绝', () => {
    beforeAll(async () => {
      const adminToken = await loginAs(app, adminUsername, PASSWORD);
      const or = await request(app.getHttpServer())
        .post('/finance/order')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ studentId, courseId, amount: 800, totalQty: 10 })
        .expect(201);
      rejectOrderId = or.body.id;

      const cToken = await loginAs(app, campusAdminUsername, PASSWORD);
      const pr = await request(app.getHttpServer())
        .post('/finance/pay')
        .set('Authorization', `Bearer ${cToken}`)
        .send({ orderId: rejectOrderId, amount: 800, channel: 'CASH', campusId })
        .expect(201);
      rejectAccountId = pr.body.accountId;
    });

    it('5-1. 申请退费 → PENDING', async () => {
      const token = await loginAs(app, studentUsername, PASSWORD);
      const res = await request(app.getHttpServer())
        .post('/finance/refund/apply')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderId: rejectOrderId, reason: '测试拒绝' })
        .expect(201);
      expect(res.body.status).toBe('PENDING');
      rejectRefundId = res.body.id;
    });

    it('5-2. 审批拒绝 → REJECTED, locked_qty 归零', async () => {
      const token = await loginAs(app, campusAdminUsername, PASSWORD);
      await request(app.getHttpServer())
        .post('/finance/refund/approve')
        .set('Authorization', `Bearer ${token}`)
        .send({ refundId: rejectRefundId, isApproved: false, reviewNote: '不符合退费条件' })
        .expect(201);

      const account = await prisma.finAssetAccount.findUnique({ where: { id: rejectAccountId } });
      expect(account!.locked_qty).toBe(0);
      expect(account!.remaining_qty).toBe(10); // unchanged
      expect(account!.status).toBe('ACTIVE');
    });

    it('5-3. 拒绝后订单状态仍为 PAID', async () => {
      const order = await prisma.finOrder.findUnique({ where: { id: rejectOrderId } });
      expect(order!.status).toBe('PAID');
    });

    it('5-4. 拒绝后可再次申请退费', async () => {
      const token = await loginAs(app, studentUsername, PASSWORD);
      const res = await request(app.getHttpServer())
        .post('/finance/refund/apply')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderId: rejectOrderId, reason: '再次申请' })
        .expect(201);
      expect(res.body.status).toBe('PENDING');

      // Approve this one to clean state
      const cToken = await loginAs(app, campusAdminUsername, PASSWORD);
      await request(app.getHttpServer())
        .post('/finance/refund/approve')
        .set('Authorization', `Bearer ${cToken}`)
        .send({ refundId: res.body.id, isApproved: true })
        .expect(201);
    });

    afterAll(async () => {
      if (!rejectAccountId) return;
      await prisma.finAssetLedger.deleteMany({ where: { account_id: rejectAccountId } });
      await prisma.finRefundRecord.deleteMany({ where: { account_id: rejectAccountId } });
      if (rejectOrderId) {
        await prisma.finRefundRecord.deleteMany({ where: { order_id: rejectOrderId } });
        await prisma.finPaymentRecord.deleteMany({ where: { order_id: rejectOrderId } });
        await prisma.finOrder.delete({ where: { id: rejectOrderId } });
      }
      await prisma.finAssetAccount.delete({ where: { id: rejectAccountId } });
      // Clean auto-created classes from this purchase
      const classes = await prisma.edClass.findMany({ where: { name: { startsWith: PREFIX } } });
      for (const cls of classes) {
        await prisma.eduStudentInClass.deleteMany({ where: { class_id: cls.id } });
        await prisma.edLessonSchedule.deleteMany({ where: { assignment: { class_id: cls.id } } });
        await prisma.edClassAssignment.deleteMany({ where: { class_id: cls.id } });
        await prisma.edClass.delete({ where: { id: cls.id } });
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. 课程学习进度 & 课时扣减
  // ═══════════════════════════════════════════════════════════════════════════

  let studyOrderId: string;
  let studyAccountId: string;
  let realLessonId: string; // first lesson in DB (sort_order=1, no sequential gate)

  describe('6. 课程学习进度', () => {
    beforeAll(async () => {
      // Get a real first lesson (sort_order=1) so sequential lock is not triggered
      const firstLesson = await prisma.stdCourseLesson.findFirst({ orderBy: { sort_order: 'asc' } });
      if (!firstLesson) throw new Error('DB has no lessons — run the seed first');
      realLessonId = firstLesson.id;

      const adminToken = await loginAs(app, adminUsername, PASSWORD);
      const or = await request(app.getHttpServer())
        .post('/finance/order')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ studentId, courseId, amount: 800, totalQty: 10 })
        .expect(201);
      studyOrderId = or.body.id;

      const cToken = await loginAs(app, campusAdminUsername, PASSWORD);
      const pr = await request(app.getHttpServer())
        .post('/finance/pay')
        .set('Authorization', `Bearer ${cToken}`)
        .send({ orderId: studyOrderId, amount: 800, channel: 'WECHAT', campusId })
        .expect(201);
      studyAccountId = pr.body.accountId;
    });

    it('6-1. 学员开始学习 → status=IN_PROGRESS', async () => {
      const token = await loginAs(app, studentUsername, PASSWORD);
      const res = await request(app.getHttpServer())
        .post('/course-catalog/progress')
        .set('Authorization', `Bearer ${token}`)
        .send({ course_id: courseId, lesson_id: realLessonId, action: 'start' })
        .expect(201);
      expect(res.body.status).toBe('IN_PROGRESS');
    });

    it('6-2. 完成课时 → remaining_qty 减 1', async () => {
      const token = await loginAs(app, studentUsername, PASSWORD);
      await request(app.getHttpServer())
        .post('/course-catalog/progress')
        .set('Authorization', `Bearer ${token}`)
        .send({ course_id: courseId, lesson_id: realLessonId, action: 'complete' })
        .expect(201);

      const account = await prisma.finAssetAccount.findUnique({ where: { id: studyAccountId } });
      expect(account!.remaining_qty).toBe(9);
    });

    it('6-3. 重复完成同课时 → 不重复扣课时（幂等）', async () => {
      const token = await loginAs(app, studentUsername, PASSWORD);
      await request(app.getHttpServer())
        .post('/course-catalog/progress')
        .set('Authorization', `Bearer ${token}`)
        .send({ course_id: courseId, lesson_id: realLessonId, action: 'complete' })
        .expect(201);

      const account = await prisma.finAssetAccount.findUnique({ where: { id: studyAccountId } });
      expect(account!.remaining_qty).toBe(9); // still 9, not 8
    });

    afterAll(async () => {
      if (!studyAccountId) return;
      await prisma.studentLessonProgress.deleteMany({ where: { student_id: studentId, course_id: courseId } });
      await prisma.finAssetLedger.deleteMany({ where: { account_id: studyAccountId } });
      if (studyOrderId) {
        await prisma.finPaymentRecord.deleteMany({ where: { order_id: studyOrderId } });
        await prisma.finOrder.delete({ where: { id: studyOrderId } });
      }
      await prisma.finAssetAccount.delete({ where: { id: studyAccountId } });
      const classes = await prisma.edClass.findMany({ where: { name: { startsWith: PREFIX } } });
      for (const cls of classes) {
        await prisma.eduStudentInClass.deleteMany({ where: { class_id: cls.id } });
        await prisma.edLessonSchedule.deleteMany({ where: { assignment: { class_id: cls.id } } });
        await prisma.edClassAssignment.deleteMany({ where: { class_id: cls.id } });
        await prisma.edClass.delete({ where: { id: cls.id } });
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. ACCESS CONTROL
  // ═══════════════════════════════════════════════════════════════════════════

  describe('7. 权限隔离', () => {
    it('7-1. 教师无法查看全部订单 → 401', async () => {
      const token = await loginAs(app, teacherUsername, PASSWORD);
      await request(app.getHttpServer())
        .get('/finance/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('7-2. 学员无法作废订单 → 401', async () => {
      const token = await loginAs(app, studentUsername, PASSWORD);
      await request(app.getHttpServer())
        .post(`/finance/order/nonexistent-id/void`)
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('7-3. 学员无法手动发起退费 → 401', async () => {
      const token = await loginAs(app, studentUsername, PASSWORD);
      await request(app.getHttpServer())
        .post('/finance/refund/manual')
        .set('Authorization', `Bearer ${token}`)
        .send({ accountId: 'fake', refundQty: 1, reason: 'hack' })
        .expect(401);
    });

    it('7-4. CAMPUS_ADMIN 可查看全部订单 → 200 数组', async () => {
      const token = await loginAs(app, campusAdminUsername, PASSWORD);
      const res = await request(app.getHttpServer())
        .get('/finance/orders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
