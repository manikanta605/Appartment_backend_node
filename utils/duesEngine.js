const { Society, Member, Payment, Notification } = require('../models');
const { Op } = require('sequelize');

/**
 * Generates monthly dues dynamically for a society (or all active societies)
 * Computes: Current Month Maintenance + Previous Unpaid Dues = Total Payable
 */
async function generateMonthlyDues({ societyId = null, targetPeriod = null, targetMonth = null, targetYear = null } = {}) {
  const now = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentMonthIdx = targetMonth !== null && targetMonth !== undefined ? targetMonth : now.getMonth();
  const currentYear = targetYear || now.getFullYear();
  const period = targetPeriod || `${monthNames[currentMonthIdx]} ${currentYear}`;

  // Find target societies
  const societyQuery = { status: 'Active' };
  if (societyId) {
    societyQuery.id = societyId;
  }
  const societies = await Society.findAll({ where: societyQuery });

  const summary = {
    period,
    societiesProcessed: societies.length,
    totalRecordsCreated: 0,
    details: []
  };

  for (const society of societies) {
    const monthlyRate = Number(society.maintenance_amount) || 2500;
    const dueDay = society.due_day || 10;
    const dueDate = new Date(currentYear, currentMonthIdx, dueDay);

    // Fetch all active members in this society
    const members = await Member.findAll({
      where: {
        society_id: society.id,
        status: 'Active'
      }
    });

    let societyCreatedCount = 0;

    for (const member of members) {
      // 1. Check if record already exists for this society + flat + period
      const existing = await Payment.findOne({
        where: {
          society_id: society.id,
          flat_no: member.flat_no,
          period: period
        }
      });

      if (!existing) {
        // 2. Calculate previous unpaid balance (accumulate past pending dues)
        const pastUnpaid = await Payment.findAll({
          where: {
            society_id: society.id,
            flat_no: member.flat_no,
            status: { [Op.in]: ['Pending', 'Overdue', 'Partial'] }
          }
        });

        let previousDueTotal = 0;
        for (const past of pastUnpaid) {
          const dueVal = Number(past.total_due || past.amount);
          const paidVal = Number(past.paid_amount || (past.status === 'Paid' ? dueVal : 0));
          const unpaid = dueVal - paidVal;
          if (unpaid > 0) {
            previousDueTotal += unpaid;
          }
        }

        const currentAmount = monthlyRate;
        const totalPayable = currentAmount + previousDueTotal;
        const cleanFlat = (member.flat_no || '').replace(/[^a-zA-Z0-9]/g, '');
        const invoiceNo = `INV-${society.code || 'SOC'}-${currentYear}${String(currentMonthIdx + 1).padStart(2, '0')}-${cleanFlat}`;

        await Payment.create({
          society_id: society.id,
          date: now,
          flat_no: member.flat_no,
          resident_name: member.name,
          period: period,
          amount: currentAmount,
          previous_due: previousDueTotal,
          total_due: totalPayable,
          paid_amount: 0,
          status: 'Pending',
          mode: 'Pending',
          due_date: dueDate.toISOString().split('T')[0],
          invoice_no: invoiceNo,
          notes: previousDueTotal > 0 
            ? `Includes ₹${previousDueTotal.toLocaleString()} previous unpaid dues` 
            : 'Monthly Society Maintenance'
        });

        // 3. Create Notification for the resident
        await Notification.create({
          society_id: society.id,
          title: `Maintenance Bill: ${period}`,
          message: `Bill generated for flat ${member.flat_no}: ₹${totalPayable.toLocaleString()} (Due on ${dueDate.toLocaleDateString()}). ${previousDueTotal > 0 ? `(Includes ₹${previousDueTotal} previous due)` : ''}`,
          type: 'Payment',
          target_flat: member.flat_no,
          is_read: false
        });

        societyCreatedCount++;
      }
    }

    summary.totalRecordsCreated += societyCreatedCount;
    summary.details.push({
      societyId: society.id,
      societyName: society.name,
      maintenanceAmount: monthlyRate,
      recordsCreated: societyCreatedCount,
      totalMembers: members.length
    });
  }

  return summary;
}

module.exports = { generateMonthlyDues };

