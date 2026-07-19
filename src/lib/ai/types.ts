export interface AiProductSuggestion {
  name: string;
  brand: string;
  category: string;
  unit: 'PIECE' | 'KG' | 'GRAM' | 'LITER' | 'ML' | 'DOZEN' | 'BOX' | 'PACK';
  packageSize?: string;
  estimatedPrice?: number;
  detectedBarcode?: string;
  confidence: number; // 0.0 to 1.0
}

export type MatchConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AiRecognitionResponse {
  suggestion: AiProductSuggestion;
  confidenceLevel: MatchConfidenceLevel;
  matchedProduct: {
    id: string;
    name: string;
    sku: string;
    barcode?: string | null;
    price: number;
    unit: string;
    category?: { id: string; name: string } | null;
    inventory?: { quantity: number } | null;
  } | null;
  logId?: string;
}
