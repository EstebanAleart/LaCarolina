/**
 * Mock de @/lib/models/associations para tests.
 * Cada función es un jest.fn() que los tests pueden configurar con mockResolvedValue.
 */

function makeModel(name) {
  return {
    __name: name,
    findByPk:  jest.fn(),
    findOne:   jest.fn(),
    findAll:   jest.fn(),
    create:    jest.fn(),
    update:    jest.fn(),
    destroy:   jest.fn(),
    count:     jest.fn(),
  };
}

module.exports = {
  Lead:              makeModel('Lead'),
  Proposal:          makeModel('Proposal'),
  Event:             makeModel('Event'),
  CalendarDate:      makeModel('CalendarDate'),
  LeadStatusHistory: makeModel('LeadStatusHistory'),
  Reservation:       makeModel('Reservation'),
  Task:              makeModel('Task'),
  Interaction:       makeModel('Interaction'),
  Visit:             makeModel('Visit'),
  Payment:           makeModel('Payment'),
};
