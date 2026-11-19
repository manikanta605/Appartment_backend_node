process.env.NODE_ENV = 'test';
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { sequelize } = require('./config/database');
const app = require('./server');

const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const results = [];

function recordTest(module, name, passed, details = '') {
  results.push({ module, name, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${module}] ${name} ${details ? '(' + details + ')' : ''}`);
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING RESIDEX SAAS FULL FUNCTIONALITY TEST SUITE');
  console.log('======================================================\n');

  try {
    await sequelize.query('ALTER TABLE "Bookings" ADD COLUMN IF NOT EXISTS slot VARCHAR(255);');
  } catch(e) {}

  // Start test server
  let server;
  try {
    server = app.listen(TEST_PORT);
    console.log(`Test Express server running at http://localhost:${TEST_PORT}\n`);
  } catch (e) {
    console.error('Failed to start test server:', e);
    process.exit(1);
  }

  try {
    // ─── 1. AUTHENTICATION & ROLE-BASED ACCESS ─────────────────────────────
    console.log('--- 1. AUTHENTICATION & ROLE-BASED ACCESS ---');

    // 1.1 Super Admin Login
    const superLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'superadmin', password: 'superadmin123' })
    });
    const superToken = superLogin.data?.token;
    recordTest('Auth', 'Super Admin Login', superLogin.ok && superLogin.data?.user?.role === 'superadmin', `Role: ${superLogin.data?.user?.role}`);

    // 1.2 Society Admin Login (SNC)
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'admin123', society_code: 'SNC' })
    });
    const adminToken = adminLogin.data?.token;
    recordTest('Auth', 'SNC Society Admin Login', adminLogin.ok && adminLogin.data?.user?.role === 'admin', `Society: ${adminLogin.data?.society?.code}`);

    // 1.3 Resident / Member Login (Flat A-101)
    const memberLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: '9870543201', password: 'a101123', society_code: 'SNC' })
    });
    const memberToken = memberLogin.data?.token;
    recordTest('Auth', 'Resident Login (A-101)', memberLogin.ok && memberLogin.data?.user?.flat_no === 'A-101', `Flat: ${memberLogin.data?.user?.flat_no}`);

    // 1.4 Gatekeeper / Watchman Login
    const watchmanLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'watchman', password: 'gatekeeper123', society_code: 'SNC' })
    });
    const watchmanToken = watchmanLogin.data?.token;
    recordTest('Auth', 'Gatekeeper Login', watchmanLogin.ok && watchmanLogin.data?.user?.role === 'watchman', `Role: ${watchmanLogin.data?.user?.role}`);

    // 1.5 Multi-Tenant Isolation Check (GVH Resident)
    const gvhLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: '9880112233', password: 'b101123', society_code: 'GVH' })
    });
    recordTest('Auth', 'Multi-Tenant Tenant Scoping (GVH)', gvhLogin.ok && gvhLogin.data?.society?.code === 'GVH', `Tenant: ${gvhLogin.data?.society?.code}`);


    // ─── 2. SUPER ADMIN PLATFORM MANAGEMENT ─────────────────────────────────
    console.log('\n--- 2. SUPER ADMIN PLATFORM MANAGEMENT ---');

    // 2.1 Platform Stats
    const statsRes = await request('/superadmin/stats', {
      headers: { Authorization: `Bearer ${superToken}` }
    });
    recordTest('SuperAdmin', 'Fetch Global Platform Stats', statsRes.ok && statsRes.data?.totalSocieties >= 2, `Societies: ${statsRes.data?.totalSocieties}, Users: ${statsRes.data?.totalUsers}`);

    // 2.2 List Societies
    const societiesRes = await request('/superadmin/societies', {
      headers: { Authorization: `Bearer ${superToken}` }
    });
    recordTest('SuperAdmin', 'List All Tenant Societies', societiesRes.ok && Array.isArray(societiesRes.data), `Total Count: ${societiesRes.data?.length}`);

    // 2.3 Onboard New Society
    const testSocCode = 'T' + Math.floor(Math.random() * 899 + 100);
    const createSocRes = await request('/superadmin/societies', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superToken}` },
      body: JSON.stringify({
        name: 'Residex Platinum Towers',
        code: testSocCode,
        address: '45 Lake View Road',
        city: 'Hyderabad',
        maintenance_amount: 3500,
        due_day: 5,
        late_fine: 150
      })
    });
    recordTest('SuperAdmin', 'Onboard New Tenant Society', createSocRes.ok && createSocRes.data?.society?.code === testSocCode, `Created code: ${testSocCode}`);


    // ─── 3. SOCIETY ADMIN CONFIG & DASHBOARD ────────────────────────────────
    console.log('\n--- 3. SOCIETY ADMIN CONFIG & DASHBOARD ---');

    // 3.1 Fetch Current Society Settings
    const socCurrentRes = await request('/society/current', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    recordTest('Admin', 'Get Current Society Settings', socCurrentRes.ok && socCurrentRes.data?.code === 'SNC', `Rate: ₹${socCurrentRes.data?.maintenance_amount}`);

    // 3.2 Update Society Billing Rates
    const updateSocRes = await request('/society/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        maintenance_amount: 2500,
        due_day: 10,
        late_fine: 100
      })
    });
    const parsedRate = parseFloat(updateSocRes.data?.society?.maintenance_amount);
    recordTest('Admin', 'Update Society Billing & Late Fine Rules', updateSocRes.ok && parsedRate === 2500, `Rate set to ₹${parsedRate}`);

    // 3.3 Dashboard KPI Stats
    const dashRes = await request('/dashboard/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    recordTest('Admin', 'Fetch Society Financial Dashboard KPIs', dashRes.ok && typeof dashRes.data?.totalCollected === 'number', `Collected: ₹${dashRes.data?.totalCollected}, Net: ₹${dashRes.data?.netBalance}`);


    // ─── 4. DYNAMIC MAINTENANCE DUES ENGINE ─────────────────────────────────
    console.log('\n--- 4. DYNAMIC MAINTENANCE DUES ENGINE (1ST OF MONTH CRON) ---');

    // 4.1 Trigger Dynamic Dues Generation
    const genDuesRes = await request('/payments/generate-dues', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ targetPeriod: 'November 2026' })
    });
    recordTest('DuesEngine', 'Trigger Dynamic Monthly Dues Generation', genDuesRes.ok, genDuesRes.data?.message);

    // 4.2 Fetch Payments / Invoices as Resident
    const memberPaymentsRes = await request('/payments', {
      headers: { Authorization: `Bearer ${memberToken}` }
    });
    const myInvoices = Array.isArray(memberPaymentsRes.data) ? memberPaymentsRes.data : [];
    const pendingBill = myInvoices.find(p => p.status === 'Pending' || p.status === 'Overdue');
    recordTest('DuesEngine', 'Resident Views Monthly Dues Breakdown', memberPaymentsRes.ok && myInvoices.length > 0, `Invoices found: ${myInvoices.length}`);


    // ─── 5. PAYMENT SETTLEMENT & CHECKOUT ──────────────────────────────────
    console.log('\n--- 5. PAYMENT SETTLEMENT & CHECKOUT ---');

    // 5.1 Settle / Pay Due via UPI / Razorpay
    const dueToPay = pendingBill ? Number(pendingBill.total_due || pendingBill.amount) : 2500;
    const payRes = await request('/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
      body: JSON.stringify({
        flat_no: 'A-101',
        resident_name: 'Satya Resident 101',
        amount: dueToPay,
        mode: 'UPI',
        status: 'Paid',
        period: 'November 2026',
        transaction_id: 'UPI_TXN_' + Date.now()
      })
    });
    recordTest('Payments', 'Settle Outstanding Due (Mark as Paid)', payRes.ok && (payRes.data?.status === 'Paid' || payRes.data?.status === 'Partial'), `Status: ${payRes.data?.status}, TXN: ${payRes.data?.transaction_id}`);

    // 5.2 Razorpay Order Creation Endpoint
    const orderRes = await request('/payments/create-order', {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
      body: JSON.stringify({ amount: 2500, receipt: 'rcpt_test_101' })
    });
    recordTest('Payments', 'Razorpay Order Creation Endpoint', orderRes.ok && !!orderRes.data?.id, `Order ID: ${orderRes.data?.id}`);


    // ─── 6. EXPENSES & FINANCE LEDGER ──────────────────────────────────────
    console.log('\n--- 6. EXPENSES & FINANCE LEDGER ---');

    // 6.1 Create Expense
    const createExpRes = await request('/expenses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        category: 'Maintenance',
        description: 'Elevator Monthly Servicing',
        amount: 3500,
        date: new Date().toISOString().split('T')[0],
        payment_mode: 'Bank Transfer',
        paid_to: 'Otis Elevators Pvt Ltd'
      })
    });
    const createdExpId = createExpRes.data?.id;
    recordTest('Expenses', 'Create Society Expense Record', createExpRes.ok && !!createdExpId, `Expense ID: ${createdExpId}`);

    // 6.2 Get Expenses
    const getExpRes = await request('/expenses', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    recordTest('Expenses', 'List Society Expenses', getExpRes.ok && Array.isArray(getExpRes.data), `Total Expenses: ${getExpRes.data?.length}`);

    // 6.3 Delete / Cleanup Expense
    if (createdExpId) {
      const delExpRes = await request(`/expenses/${createdExpId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      recordTest('Expenses', 'Delete Expense (Admin)', delExpRes.ok, 'Deleted cleanly');
    }


    // ─── 7. SECURITY & 6-DIGIT PIN VISITOR PASS ─────────────────────────────
    console.log('\n--- 7. SECURITY & 6-DIGIT PIN VISITOR PASS ---');

    // 7.1 Resident Pre-Approves Visitor & Generates 6-Digit Pass Code
    const createPassRes = await request('/visitors', {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
      body: JSON.stringify({
        name: 'Rahul Kumar (Guest)',
        phone: '9876543210',
        flat_no: 'A-101',
        purpose: 'Guest',
        pre_approved: true
      })
    });
    const passCode = createPassRes.data?.pass_code;
    const visitorId = createPassRes.data?.id;
    recordTest('Visitors', 'Generate 6-Digit Pre-Approved Visitor Pass', createPassRes.ok && !!passCode && passCode.length === 6, `Pass PIN: ${passCode}`);

    // 7.2 Gatekeeper Verifies 6-Digit PIN Pass
    const verifyPassRes = await request('/visitors/verify-pass', {
      method: 'POST',
      headers: { Authorization: `Bearer ${watchmanToken}` },
      body: JSON.stringify({ pass_code: passCode })
    });
    recordTest('Visitors', 'Gatekeeper Verifies Pass PIN at Gate', verifyPassRes.ok && verifyPassRes.data?.valid === true, `Valid: ${verifyPassRes.data?.valid}`);

    // 7.3 Gatekeeper Checks in Visitor / Updates Status
    const updateVisitorRes = await request(`/visitors/${visitorId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${watchmanToken}` },
      body: JSON.stringify({ status: 'Approved' })
    });
    recordTest('Visitors', 'Update Visitor Gate Status', updateVisitorRes.ok && updateVisitorRes.data?.status === 'Approved', `Status: Approved`);


    // ─── 8. COMPLAINTS & HELPDESK ──────────────────────────────────────────
    console.log('\n--- 8. COMPLAINTS & HELPDESK ---');

    // 8.1 Resident Creates Complaint
    const createComplaintRes = await request('/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${memberToken}` },
      body: JSON.stringify({
        title: 'Water pressure low in 2nd floor',
        description: 'Water pressure in the master bathroom is very low since yesterday',
        category: 'Plumbing',
        flat_no: 'A-101',
        resident_name: 'Satya Resident 101'
      })
    });
    const complaintId = createComplaintRes.data?.id;
    recordTest('Complaints', 'Resident Raises Complaint Ticket', createComplaintRes.ok && !!complaintId, `Ticket ID: #${complaintId}`);

    // 8.2 Admin Updates Status to In Progress and Resolved
    const updateComplaintRes = await request(`/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'Resolved' })
    });
    recordTest('Complaints', 'Admin Updates Ticket Status to Resolved', updateComplaintRes.ok && updateComplaintRes.data?.status === 'Resolved', `Status: Resolved`);


    // ─── 9. COMMUNITY FORUM & NOTICES ──────────────────────────────────────
    console.log('\n--- 9. COMMUNITY FORUM & NOTICES ---');

    // 9.1 Create Post
    const createPostRes = await request('/posts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        content: 'Notice: Lift maintenance will take place this Saturday from 2 PM to 5 PM.'
      })
    });
    const postId = createPostRes.data?.id;
    recordTest('Community', 'Publish Community Announcement / Notice', createPostRes.ok && !!postId, `Post ID: ${postId}`);

    // 9.2 Fetch Feed
    const getPostsRes = await request('/posts', {
      headers: { Authorization: `Bearer ${memberToken}` }
    });
    recordTest('Community', 'Residents Fetch Community Forum Feed', getPostsRes.ok && Array.isArray(getPostsRes.data), `Posts count: ${getPostsRes.data?.length}`);

    // 9.3 Delete Post (Admin)
    if (postId) {
      const delPostRes = await request(`/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      recordTest('Community', 'Admin Deletes Notice / Post', delPostRes.ok, 'Deleted cleanly');
    }


    // ─── 10. AMENITIES & FACILITIES BOOKING ────────────────────────────────
    console.log('\n--- 10. AMENITIES & FACILITIES BOOKING ---');

    // 10.1 List Amenities
    const getAmenitiesRes = await request('/amenities', {
      headers: { Authorization: `Bearer ${memberToken}` }
    });
    const amenities = Array.isArray(getAmenitiesRes.data) ? getAmenitiesRes.data : [];
    recordTest('Amenities', 'List Available Society Amenities', getAmenitiesRes.ok && amenities.length > 0, `Count: ${amenities.length}`);

    // 10.2 Resident Books Amenity
    const targetAmenity = amenities[0];
    let bookingId = null;
    if (targetAmenity) {
      const bookRes = await request('/amenities/bookings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${memberToken}` },
        body: JSON.stringify({
          amenityId: targetAmenity.id,
          booking_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          start_time: '18:00:00',
          end_time: '20:00:00',
          slot: 'Evening (6 PM - 8 PM)'
        })
      });
      if (!bookRes.ok) console.log('DEBUG booking error:', bookRes.status, bookRes.data);
      bookingId = bookRes.data?.id;
      recordTest('Amenities', 'Resident Books Amenity Slot', bookRes.ok && !!bookingId, `Booking #${bookingId}`);

      // 10.3 Admin Approves Booking
      if (bookingId) {
        const approveRes = await request(`/amenities/bookings/${bookingId}/status`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ status: 'Approved' })
        });
        recordTest('Amenities', 'Admin Approves Facility Booking', approveRes.ok && approveRes.data?.status === 'Approved', 'Status: Approved');
      }
    }


    // ─── 11. EVENTS & OCCASIONS ────────────────────────────────────────────
    console.log('\n--- 11. EVENTS & OCCASIONS ---');

    // 11.1 List Events
    const getEventsRes = await request('/events', {
      headers: { Authorization: `Bearer ${memberToken}` }
    });
    recordTest('Events', 'List Society Events', getEventsRes.ok && Array.isArray(getEventsRes.data), `Events found: ${getEventsRes.data?.length}`);


    // ─── 12. MEMBERS DIRECTORY CRUD ────────────────────────────────────────
    console.log('\n--- 12. MEMBERS DIRECTORY CRUD ---');

    // 12.1 List Members
    const getMembersRes = await request('/members', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    recordTest('Members', 'List Society Members Directory', getMembersRes.ok && Array.isArray(getMembersRes.data), `Members: ${getMembersRes.data?.length}`);

    // 12.2 Create Member
    const testFlat = 'T-' + Math.floor(Math.random() * 900 + 100);
    const createMemberRes = await request('/members', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        flat_no: testFlat,
        name: 'Test Resident ' + testFlat,
        phone: '99' + Math.floor(Math.random() * 89999999 + 10000000),
        type: 'Owner',
        status: 'Active'
      })
    });
    const newMemberId = createMemberRes.data?.id;
    recordTest('Members', 'Admin Creates New Resident Member', createMemberRes.ok && !!newMemberId, `Flat: ${testFlat}`);

    // 12.3 Update Member
    if (newMemberId) {
      const updateMemberRes = await request(`/members/${newMemberId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: 'Updated Resident ' + testFlat,
          type: 'Tenant'
        })
      });
      recordTest('Members', 'Admin Updates Resident Details', updateMemberRes.ok && updateMemberRes.data?.type === 'Tenant', 'Type changed to Tenant');

      // 12.4 Delete Member
      const delMemberRes = await request(`/members/${newMemberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      recordTest('Members', 'Admin Deletes Resident Member', delMemberRes.ok, 'Deleted cleanly');
    }

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    if (server) {
      server.close();
      console.log('\nTest server shut down.');
    }
  }

  // Print Summary Table
  console.log('\n======================================================');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('======================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  console.log(`Total Scenarios Tested : ${total}`);
  console.log(`Passed                 : ${passed} ✅`);
  console.log(`Failed                 : ${failed} ${failed > 0 ? '❌' : '🎉'}`);
  console.log(`Success Rate           : ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`- [${r.module}] ${r.name}: ${r.details}`);
    });
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite();
