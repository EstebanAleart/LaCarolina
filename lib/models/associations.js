const User = require('./user');
const Lead = require('./lead');
const CalendarDate = require('./calendar_date');
const Proposal = require('./proposal');
const Event = require('./event');
const LeadStatusHistory = require('./lead_status_history');
const Interaction = require('./interaction');
const Visit = require('./visit');
const Reservation = require('./reservation');
const Task = require('./task');

// User
User.hasMany(Lead, { foreignKey: 'managed_by_user_id', as: 'leads' }); // Optional: if you want to track who manages a lead
User.hasMany(Task, { foreignKey: 'assigned_to_user_id', as: 'tasks' });

// Lead
Lead.hasMany(Interaction, { foreignKey: 'lead_id', as: 'interactions' });
Lead.hasMany(Visit, { foreignKey: 'lead_id', as: 'visits' });
Lead.hasMany(Proposal, { foreignKey: 'lead_id', as: 'proposals' });
Lead.hasMany(LeadStatusHistory, { foreignKey: 'lead_id', as: 'status_history' });
Lead.hasOne(Reservation, { foreignKey: 'lead_id', as: 'reservation' });
Lead.hasOne(Event, { foreignKey: 'lead_id', as: 'event' });

// CalendarDate
CalendarDate.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
CalendarDate.belongsTo(Event, { foreignKey: 'evento_id', as: 'event' });

// Proposal
Proposal.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
Proposal.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'creator' });

// Event
Event.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
Event.hasMany(Task, { foreignKey: 'evento_id', as: 'tasks' });
Event.belongsTo(CalendarDate, { foreignKey: 'calendar_date_id', as: 'calendar_date' });

// Task
Task.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
Task.belongsTo(Event, { foreignKey: 'evento_id', as: 'event' });
Task.belongsTo(User, { foreignKey: 'assigned_to_user_id', as: 'assigned_user' });

// Interaction
Interaction.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
Interaction.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'creator' });

// Visit
Visit.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
Visit.belongsTo(User, { foreignKey: 'created_by_user_id', as: 'creator' });

// Reservation
Reservation.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
Reservation.belongsTo(CalendarDate, { foreignKey: 'calendar_date_id', as: 'calendar_date' });

// LeadStatusHistory
LeadStatusHistory.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });
LeadStatusHistory.belongsTo(User, { foreignKey: 'changed_by_user_id', as: 'changer' });

module.exports = {
  User,
  Lead,
  CalendarDate,
  Proposal,
  Event,
  LeadStatusHistory,
  Interaction,
  Visit,
  Reservation,
  Task,
};
