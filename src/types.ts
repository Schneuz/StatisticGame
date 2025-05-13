export interface Metric {
  id: string;
  name: string;
  type: 'numerical' | 'categorical' | 'binary';
  description?: string;
} 