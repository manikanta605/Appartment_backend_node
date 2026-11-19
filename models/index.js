const { sequelize } = require('../config/database');
const Society = require('./Society');
const User = require('./User');
const Member = require('./Member');
const Expense = require('./Expense');
const Payment = require('./Payment');
const Complaint = require('./Complaint');
const Post = require('./Post');
const Notification = require('./Notification');
const Event = require('./Event');
const EventMember = require('./EventMember');
const Amenity = require('./Amenity');
const Booking = require('./Booking');
const Visitor = require('./Visitor');

// Society multi-tenant relationships
Society.hasMany(User, { foreignKey: 'society_id' });
User.belongsTo(Society, { foreignKey: 'society_id' });

Society.hasMany(Member, { foreignKey: 'society_id' });
Member.belongsTo(Society, { foreignKey: 'society_id' });

Society.hasMany(Expense, { foreignKey: 'society_id' });
Expense.belongsTo(Society, { foreignKey: 'society_id' });

Society.hasMany(Payment, { foreignKey: 'society_id' });
Payment.belongsTo(Society, { foreignKey: 'society_id' });

Society.hasMany(Complaint, { foreignKey: 'society_id' });
Complaint.belongsTo(Society, { foreignKey: 'society_id' });

Society.hasMany(Post, { foreignKey: 'society_id' });
Post.belongsTo(Society, { foreignKey: 'society_id' });

Society.hasMany(Notification, { foreignKey: 'society_id' });
Notification.belongsTo(Society, { foreignKey: 'society_id' });

Society.hasMany(Event, { foreignKey: 'society_id' });
Event.belongsTo(Society, { foreignKey: 'society_id' });

Society.hasMany(Amenity, { foreignKey: 'society_id' });
Amenity.belongsTo(Society, { foreignKey: 'society_id' });

Society.hasMany(Booking, { foreignKey: 'society_id' });
Booking.belongsTo(Society, { foreignKey: 'society_id' });

Society.hasMany(Visitor, { foreignKey: 'society_id' });
Visitor.belongsTo(Society, { foreignKey: 'society_id' });

// Event relationships
Event.hasMany(Payment, { foreignKey: 'eventId' });
Payment.belongsTo(Event, { foreignKey: 'eventId' });

Event.hasMany(Expense, { foreignKey: 'eventId' });
Expense.belongsTo(Event, { foreignKey: 'eventId' });

Event.hasMany(EventMember, { foreignKey: 'eventId' });
EventMember.belongsTo(Event, { foreignKey: 'eventId' });

// Amenities relationships
Amenity.hasMany(Booking, { foreignKey: 'amenityId' });
Booking.belongsTo(Amenity, { foreignKey: 'amenityId' });

module.exports = {
  sequelize,
  Society,
  User,
  Member,
  Expense,
  Payment,
  Complaint,
  Post,
  Notification,
  Event,
  EventMember,
  Amenity,
  Booking,
  Visitor
};
