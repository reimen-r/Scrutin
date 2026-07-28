import { CONTRACT_TYPES, getContractLabel } from '../types/contract';

describe('CONTRACT_TYPES', () => {
  it('should have all 4 contract types', () => {
    expect(CONTRACT_TYPES).toHaveLength(4);
  });

  it('should include all required types', () => {
    const ids = CONTRACT_TYPES.map(t => t.id);
    expect(ids).toContain('alquiler');
    expect(ids).toContain('compra-venta');
    expect(ids).toContain('laboral');
    expect(ids).toContain('seguros');
  });

  it('should have unique IDs', () => {
    const ids = CONTRACT_TYPES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have non-empty labels and icons', () => {
    for (const type of CONTRACT_TYPES) {
      expect(type.label).toBeTruthy();
      expect(type.icon).toBeTruthy();
    }
  });
});

describe('getContractLabel', () => {
  it('should return correct label for alquiler', () => {
    expect(getContractLabel('alquiler')).toBe('Alquiler');
  });

  it('should return correct label for compra-venta', () => {
    expect(getContractLabel('compra-venta')).toBe('Compra-Venta');
  });

  it('should return correct label for seguros', () => {
    expect(getContractLabel('seguros')).toBe('Contrato de Seguros');
  });

  it('should return correct label for laboral', () => {
    expect(getContractLabel('laboral')).toBe('Contrato Laboral');
  });
});
