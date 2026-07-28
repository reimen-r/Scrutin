export type ContractType = 'alquiler' | 'compra-venta' | 'laboral' | 'seguros';

export interface ContractTypeOption {
  id: ContractType;
  label: string;
  icon: string; // Ionicons glyphMap key
}


export interface AnalysisResult {
  contractType: ContractType;
  text: string;
  report: string;
  riskLevel: 'bajo' | 'medio' | 'alto';
}

export interface HistoryItem {
  id: string;
  date: string;
  contractType: ContractType;
  contractLabel: string;
  result: AnalysisResult;
  starred?: boolean;
  notes?: string;
}

export const CONTRACT_TYPES: ContractTypeOption[] = [
  { id: 'alquiler', label: 'Alquiler', icon: 'home-outline' },
  { id: 'compra-venta', label: 'Compra-Venta', icon: 'document-text-outline' },
  { id: 'laboral', label: 'Contrato Laboral', icon: 'briefcase-outline' },
  { id: 'seguros', label: 'Contrato de Seguros', icon: 'shield-checkmark-outline' },
];

export const ICON_MAP: Record<ContractType, string> = {
  alquiler: 'home-outline',
  'compra-venta': 'document-text-outline',
  laboral: 'briefcase-outline',
  seguros: 'shield-checkmark-outline',
};

export function getContractLabel(type: ContractType): string {
  const labels: Record<ContractType, string> = {
    alquiler: 'Alquiler',
    'compra-venta': 'Compra-Venta',
    laboral: 'Contrato Laboral',
    seguros: 'Contrato de Seguros',
  };
  return labels[type];
}

export interface TSJExtractionResult {
  expediente: string;
  tipoRecurso: string;
  magistradoPonente: string;
  decision: string;
  fecha: string;
  votacion: string;
  partes: string;
  rawReport: string;
}

export interface TSJHistoryItem {
  id: string;
  date: string;
  result: TSJExtractionResult;
  starred?: boolean;
  notes?: string;
}
