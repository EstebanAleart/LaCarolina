/**
 * Tests para getEventDataFromProposal:
 * verifica que todos los campos del contrato se mapean correctamente al Event.
 */
const { getEventDataFromProposal } = require('../lib/automations');

describe('getEventDataFromProposal', () => {
  const propuestaCompleta = {
    tipo_evento: 'Fiesta de 15',
    invitados_estimados: 120,
    valor_total_evento: 500000,
    precio_senia: 150000,
    modalidad_actualizacion_precios: 'Precio fijo',
    servicios_base: ['Salón', 'Catering'],
    adicionales: [
      { nombre: 'DJ', opciones: [{ descripcion: 'DJ básico', precio: 20000 }, { descripcion: 'DJ premium', precio: 40000 }], opcion_elegida: 1 },
      { nombre: 'Foto', opciones: [{ descripcion: 'Foto básica', precio: 15000 }], opcion_elegida: null },
    ],
    menu_seleccionado: 'Menú 2',
    minimo_tarjetas: 100,
    valor_tarjeta_adulto: 4000,
    valor_tarjeta_adolescente: 2500,
    valor_tarjeta_nino: 1500,
  };

  test('mapea todos los campos financieros y de producción', () => {
    const data = getEventDataFromProposal(propuestaCompleta);
    expect(data.tipo_evento).toBe('Fiesta de 15');
    expect(data.invitados_estimados).toBe(120);
    expect(data.valor_total_evento).toBe(500000);
    expect(data.precio_senia).toBe(150000);
    expect(data.modalidad_actualizacion_precios).toBe('Precio fijo');
    expect(data.menu_seleccionado).toBe('Menú 2');
    expect(data.minimo_tarjetas).toBe(100);
    expect(data.valor_tarjeta_adulto).toBe(4000);
    expect(data.valor_tarjeta_adolescente).toBe(2500);
    expect(data.valor_tarjeta_nino).toBe(1500);
  });

  test('servicios_contratados combina servicios_base + adicionales elegidos', () => {
    const data = getEventDataFromProposal(propuestaCompleta);
    // servicios_base: ['Salón', 'Catering']
    // adicionales elegidos: solo 'DJ' (opcion_elegida: 1), 'Foto' tiene null → no incluida
    expect(data.servicios_contratados).toEqual(['Salón', 'Catering', 'DJ']);
  });

  test('adicionales se copia completo (con todas las opciones)', () => {
    const data = getEventDataFromProposal(propuestaCompleta);
    expect(data.adicionales).toEqual(propuestaCompleta.adicionales);
    expect(data.adicionales).toHaveLength(2);
  });

  test('no incluye servicios_contratados si no hay servicios', () => {
    const data = getEventDataFromProposal({ servicios_base: [], adicionales: [] });
    expect(data.servicios_contratados).toBeUndefined();
  });

  test('no incluye adicionales si el array está vacío', () => {
    const data = getEventDataFromProposal({ adicionales: [] });
    expect(data.adicionales).toBeUndefined();
  });

  test('omite campos undefined/null/falsy', () => {
    const data = getEventDataFromProposal({
      tipo_evento: '',
      invitados_estimados: 0,
      valor_total_evento: null,
      precio_senia: undefined,
    });
    expect(data.tipo_evento).toBeUndefined();
    expect(data.invitados_estimados).toBeUndefined();
    expect(data.valor_total_evento).toBeUndefined();
    expect(data.precio_senia).toBeUndefined();
  });

  test('solo servicios_base sin adicionales elegidos', () => {
    const data = getEventDataFromProposal({
      servicios_base: ['Salón'],
      adicionales: [{ nombre: 'DJ', opciones: [], opcion_elegida: null }],
    });
    expect(data.servicios_contratados).toEqual(['Salón']);
  });
});
