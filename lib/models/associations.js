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
const Payment = require('./payment');
const Product = require('./product');
const Combo = require('./combo');
const ComboProduct = require('./combo_product');
const StockMovement = require('./stock_movement');
const ServiceType = require('./service_type');
const EventService = require('./event_service');

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
Event.hasMany(Payment, { foreignKey: 'event_id', as: 'payments' });

// Payment
Payment.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
Payment.belongsTo(Lead, { foreignKey: 'lead_id', as: 'lead' });

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

// Stock / Combos
Combo.hasMany(ComboProduct, { foreignKey: 'combo_id', as: 'items' });
ComboProduct.belongsTo(Combo, { foreignKey: 'combo_id', as: 'combo' });
ComboProduct.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(ComboProduct, { foreignKey: 'product_id', as: 'combo_uses' });
Product.hasMany(StockMovement, { foreignKey: 'product_id', as: 'movements' });
StockMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Motor de servicios
Event.hasMany(EventService, { foreignKey: 'event_id', as: 'services' });
EventService.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
EventService.belongsTo(ServiceType, { foreignKey: 'service_type_id', as: 'service_type' });
ServiceType.hasMany(EventService, { foreignKey: 'service_type_id', as: 'event_services' });
EventService.belongsTo(Combo, { foreignKey: 'combo_id', as: 'combo' });
EventService.hasMany(Payment, { foreignKey: 'service_id', as: 'payments' });
Payment.belongsTo(EventService, { foreignKey: 'service_id', as: 'service' });

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
  Payment,
  Product,
  Combo,
  ComboProduct,
  StockMovement,
  ServiceType,
  EventService,
};
