import { buildAnalysisPrompt, buildTSJExtractionPrompt } from '../utils/prompts';

describe('buildAnalysisPrompt', () => {
  it('should return a non-empty string for each contract type', () => {
    const types = ['alquiler', 'compra-venta', 'laboral', 'seguros'] as const;
    for (const type of types) {
      const prompt = buildAnalysisPrompt(type);
      expect(prompt).toBeTruthy();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(100);
    }
  });

  it('should include the contract type label in the prompt', () => {
    const prompt = buildAnalysisPrompt('alquiler');
    expect(prompt).toContain('Alquiler');
  });

  it('should include JSON structure instructions', () => {
    const prompt = buildAnalysisPrompt('compra-venta');
    expect(prompt).toContain('"report"');
    expect(prompt).toContain('"riskLevel"');
  });
});

describe('buildTSJExtractionPrompt', () => {
  it('should return a non-empty string', () => {
    const prompt = buildTSJExtractionPrompt();
    expect(prompt).toBeTruthy();
    expect(prompt.length).toBeGreaterThan(100);
  });

  it('should include TSJ-related keywords', () => {
    const prompt = buildTSJExtractionPrompt();
    expect(prompt).toContain('TSJ');
    expect(prompt).toContain('expediente');
    expect(prompt).toContain('magistradoPonente');
  });

  it('should include JSON structure instructions', () => {
    const prompt = buildTSJExtractionPrompt();
    expect(prompt).toContain('"expediente"');
    expect(prompt).toContain('"tipoRecurso"');
    expect(prompt).toContain('"rawReport"');
  });
});
