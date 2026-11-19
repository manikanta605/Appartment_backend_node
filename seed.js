const {
  sequelize,
  Society,
  User,
  Member,
  Expense,
  Payment,
  Event,
  EventMember,
  Amenity,
  Booking,
  Notification
} = require('./models');

async function seed() {
  try {
    console.log('Syncing database (force: true)...');
    await sequelize.sync({ force: true });
    console.log('Database synced cleanly.');

    // 1. Create Platform Super Admin
    const superAdmin = await User.create({
      username: 'superadmin',
      password: 'superadmin123',
      name: 'Platform Super Administrator',
      email: 'superadmin@apartmentsaas.com',
      role: 'superadmin',
      society_id: null,
      flat_no: null
    });
    console.log('✅ Super Admin created (superadmin / superadmin123)');

    // 2. Create Society 1: Satya Nagar Colony
    const snc = await Society.create({
      name: 'Satya Nagar Colony',
      code: 'SNC',
      address: 'Road No. 4, Satya Nagar Colony',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500072',
      maintenance_amount: 2500.00,
      due_day: 10,
      late_fine: 100.00,
      upi_id: 'satyanagar@upi',
      contact_email: 'welfare@satyanagar.org',
      contact_phone: '9870543200',
      status: 'Active',
      plan: 'Standard'
    });
    console.log(`✅ Society 1 created: ${snc.name} [Code: ${snc.code}, Maintenance: ₹${snc.maintenance_amount}]`);

    // 3. Create Society 1 Admin & Watchman
    await User.create({
      society_id: snc.id,
      username: 'admin',
      password: 'admin123',
      name: 'SNC Secretary',
      email: 'admin@satyanagar.org',
      role: 'admin',
      flat_no: null
    });
    console.log('✅ SNC Admin created (admin / admin123)');

    await User.create({
      society_id: snc.id,
      username: 'watchman',
      password: 'gatekeeper123',
      name: 'Main Gate Guard',
      role: 'watchman',
      flat_no: null
    });
    console.log('✅ SNC Watchman created (watchman / gatekeeper123)');

    // 4. Create Society 1 Members
    const sncMembers = [
      { flat_no: 'A-101', name: 'Rajesh Kumar Sharma', phone: '9870543201', email: 'rajesh1@email.com', type: 'Owner', family_size: 2, role: 'President', status: 'Active', society_id: snc.id },
      { flat_no: 'A-102', name: 'Venkata Subrahmanyam', phone: '9870543202', email: 'venkata2@email.com', type: 'Owner', family_size: 3, role: 'Secretary', status: 'Active', society_id: snc.id },
      { flat_no: 'A-103', name: 'Mohammed Irfan Ahmed', phone: '9870543203', email: 'mohammed3@email.com', type: 'Owner', family_size: 3, role: 'Treasurer', status: 'Active', society_id: snc.id },
      { flat_no: 'A-104', name: 'Srinivas Rao Patil', phone: '9870543204', email: 'srinivas4@email.com', type: 'Tenant', family_size: 2, role: 'Member', status: 'Active', society_id: snc.id },
      { flat_no: 'A-105', name: 'Priya Reddy', phone: '9870543205', email: 'priya5@email.com', type: 'Owner', family_size: 4, role: 'Member', status: 'Active', society_id: snc.id },
      { flat_no: 'A-106', name: 'Lakshmi Devi Gupta', phone: '9870543206', email: 'lakshmi6@email.com', type: 'Owner', family_size: 3, role: 'Member', status: 'Active', society_id: snc.id },
      { flat_no: 'A-107', name: 'Anil Kumar Verma', phone: '9870543207', email: 'anil7@email.com', type: 'Owner', family_size: 2, role: 'Member', status: 'Active', society_id: snc.id },
      { flat_no: 'A-108', name: 'Suresh Babu Naidu', phone: '9870543208', email: 'suresh8@email.com', type: 'Owner', family_size: 3, role: 'Member', status: 'Active', society_id: snc.id },
    ];
    await Member.bulkCreate(sncMembers);

    // Auto-create User logins for members
    const memberUsers = sncMembers.map(m => ({
      society_id: snc.id,
      username: m.phone,
      password: m.flat_no.replace('-', '').toLowerCase() + '123',
      name: m.name,
      phone: m.phone,
      email: m.email,
      role: 'member',
      flat_no: m.flat_no
    }));
    await User.bulkCreate(memberUsers, { individualHooks: true });
    console.log(`✅ SNC Members & Resident Accounts created (${sncMembers.length} units)`);

    // 5. Create Payments for SNC (demonstrating previous due + current dues accumulation)
    const now = new Date();
    await Payment.bulkCreate([
      // A-101: Fully paid March
      {
        society_id: snc.id,
        date: new Date(2026, 2, 10),
        flat_no: 'A-101',
        resident_name: 'Rajesh Kumar Sharma',
        period: 'March 2026',
        amount: 2500,
        previous_due: 0,
        total_due: 2500,
        paid_amount: 2500,
        mode: 'UPI',
        status: 'Paid',
        invoice_no: 'INV-SNC-202603-A101'
      },
      // A-101: April current bill (no previous due)
      {
        society_id: snc.id,
        date: new Date(2026, 3, 1),
        flat_no: 'A-101',
        resident_name: 'Rajesh Kumar Sharma',
        period: 'April 2026',
        amount: 2500,
        previous_due: 0,
        total_due: 2500,
        paid_amount: 0,
        mode: 'Pending',
        status: 'Pending',
        due_date: '2026-04-10',
        invoice_no: 'INV-SNC-202604-A101'
      },
      // A-102: Unpaid March (2500)
      {
        society_id: snc.id,
        date: new Date(2026, 2, 1),
        flat_no: 'A-102',
        resident_name: 'Venkata Subrahmanyam',
        period: 'March 2026',
        amount: 2500,
        previous_due: 0,
        total_due: 2500,
        paid_amount: 0,
        mode: 'Pending',
        status: 'Pending',
        due_date: '2026-03-10',
        invoice_no: 'INV-SNC-202603-A102'
      },
      // A-102: April bill carries previous due 2500 + current 2500 = 5000 Total Due!
      {
        society_id: snc.id,
        date: new Date(2026, 3, 1),
        flat_no: 'A-102',
        resident_name: 'Venkata Subrahmanyam',
        period: 'April 2026',
        amount: 2500,
        previous_due: 2500,
        total_due: 5000,
        paid_amount: 0,
        mode: 'Pending',
        status: 'Pending',
        due_date: '2026-04-10',
        invoice_no: 'INV-SNC-202604-A102',
        notes: 'Includes ₹2,500 past unpaid March dues'
      },
      // A-103: Paid April
      {
        society_id: snc.id,
        date: new Date(2026, 3, 2),
        flat_no: 'A-103',
        resident_name: 'Mohammed Irfan Ahmed',
        period: 'April 2026',
        amount: 2500,
        previous_due: 0,
        total_due: 2500,
        paid_amount: 2500,
        mode: 'Razorpay',
        status: 'Paid',
        transaction_id: 'pay_rzp_mock_103',
        invoice_no: 'INV-SNC-202604-A103'
      }
    ]);
    console.log('✅ SNC Payments seeded with cumulative dues test cases');

    // 6. Expenses for SNC
    await Expense.bulkCreate([
      { society_id: snc.id, date: '2026-03-24', description: 'Common area electricity bill', category: 'Utilities', amount: 11847, paid_to: 'TSSPDCL', payment_mode: 'UPI' },
      { society_id: snc.id, date: '2026-03-28', description: 'Lift AMC Maintenance', category: 'Maintenance', amount: 4500, paid_to: 'Otis Elevators', payment_mode: 'Bank Transfer' },
      { society_id: snc.id, date: '2026-04-01', description: 'Security Guard Salary', category: 'Security', amount: 12000, paid_to: 'Eagle Security', payment_mode: 'Bank Transfer' }
    ]);
    console.log('✅ SNC Expenses seeded');

    // 7. Amenities for SNC
    await Amenity.bulkCreate([
      { society_id: snc.id, name: 'Clubhouse Banquet Hall', description: 'Air-conditioned hall for events up to 100 guests', fee: 3000, status: 'Available' },
      { society_id: snc.id, name: 'Rooftop Swimming Pool', description: 'Open 6:00 AM - 9:00 PM daily', fee: 0, status: 'Available' },
      { society_id: snc.id, name: 'Society Gym & Yoga Deck', description: 'Modern equipment and treadmills', fee: 0, status: 'Available' }
    ]);
    console.log('✅ SNC Amenities seeded');

    // 8. Create Second Society (SaaS Tenant): Green Valley Heights (Bangalore)
    const gvh = await Society.create({
      name: 'Green Valley Heights',
      code: 'GVH',
      address: '12th Cross, Whitefield',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560066',
      maintenance_amount: 3200.00, // Different dynamic maintenance amount!
      due_day: 5,
      late_fine: 150.00,
      upi_id: 'greenvalley@icici',
      contact_email: 'manager@greenvalley.in',
      contact_phone: '9880123456',
      status: 'Active',
      plan: 'Premium'
    });
    console.log(`✅ Society 2 created: ${gvh.name} [Code: ${gvh.code}, Maintenance: ₹${gvh.maintenance_amount}]`);

    // GVH Admin
    await User.create({
      society_id: gvh.id,
      username: 'gvh_admin',
      password: 'gvh123',
      name: 'Green Valley Manager',
      email: 'manager@greenvalley.in',
      role: 'admin',
      flat_no: null
    });
    console.log('✅ GVH Admin created (gvh_admin / gvh123)');

    await User.create({
      society_id: gvh.id,
      username: 'gvh_guard',
      password: 'guard123',
      name: 'GVH Gate Guard',
      role: 'watchman',
      flat_no: null
    });
    console.log('✅ GVH Guard created (gvh_guard / guard123)');

    // GVH Members
    const gvhMembers = [
      { flat_no: 'B-101', name: 'Karthik Raman', phone: '9880112233', email: 'karthik@techcorp.com', type: 'Owner', family_size: 3, role: 'President', status: 'Active', society_id: gvh.id },
      { flat_no: 'B-102', name: 'Deepa Narayan', phone: '9880112244', email: 'deepa@techcorp.com', type: 'Owner', family_size: 2, role: 'Secretary', status: 'Active', society_id: gvh.id },
    ];
    await Member.bulkCreate(gvhMembers);
    for (const gm of gvhMembers) {
      await User.create({
        society_id: gvh.id,
        username: gm.phone,
        password: gm.flat_no.replace('-', '').toLowerCase() + '123',
        name: gm.name,
        phone: gm.phone,
        email: gm.email,
        role: 'member',
        flat_no: gm.flat_no
      });
    }
    console.log('✅ GVH Members & Accounts created');

    console.log('\n=============================================');
    console.log('🎉 SAAS MULTI-TENANT SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=============================================');
    console.log('Logins to test:');
    console.log('1. Super Admin: superadmin / superadmin123');
    console.log('2. Satya Nagar Admin: admin / admin123 (Maintenance: ₹2,500)');
    console.log('3. Satya Nagar Resident: 9870543201 / a101123');
    console.log('4. Satya Nagar Guard: watchman / gatekeeper123');
    console.log('5. Green Valley Admin: gvh_admin / gvh123 (Maintenance: ₹3,200)');
    console.log('6. Green Valley Resident: 9880112233 / b101123');
    console.log('=============================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
