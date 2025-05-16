/**
 * Typen von Metriken
 */
export enum MetricType {
  NUMERICAL = 'numerical',
  CATEGORICAL = 'categorical',
  MIXED = 'mixed'
}

/**
 * Ergebnis der Metrik-Validierung
 */
export interface MetricValidationResult {
  isValid: boolean;
  errorMessage?: string;
  metricType: MetricType;
}

/**
 * Liste der numerischen Metriken
 */
export const NUMERICAL_METRICS = [
  'Mean Return', 
  'Median Return', 
  'Mean Gain', 
  'Mean Loss'
];

/**
 * Liste der kategorischen Metriken
 */
export const CATEGORICAL_METRICS = [
  'Positive Return Days', 
  'Negative Return Days', 
  'High Volatility Days'
];

/**
 * Bestimmt den Typ einer Metrik
 */
export function getMetricType(metricName: string): MetricType {
  if (NUMERICAL_METRICS.includes(metricName)) {
    return MetricType.NUMERICAL;
  } else if (CATEGORICAL_METRICS.includes(metricName)) {
    return MetricType.CATEGORICAL;
  }
  return MetricType.MIXED; // Fallback
}

/**
 * Prüft, ob alle Metriken vom gleichen Typ sind
 */
export function areAllSameType(metrics: string[]): boolean {
  if (metrics.length <= 1) return true;
  
  const firstType = getMetricType(metrics[0]);
  return metrics.every(metric => getMetricType(metric) === firstType);
}

/**
 * Validiert die gewählten Metriken
 * @param metrics - Liste der gewählten Metriken
 * @returns ValidationResult mit Informationen über die Validität
 */
export function validateMetrics(metrics: string[]): MetricValidationResult {
  // Wenn keine Metriken gewählt wurden
  if (!metrics || metrics.length === 0) {
    return {
      isValid: false,
      errorMessage: "No metrics selected.",
      metricType: MetricType.MIXED
    };
  }
  
  // Wenn nur eine Metrik gewählt wurde
  if (metrics.length === 1) {
    return {
      isValid: true,
      metricType: getMetricType(metrics[0])
    };
  }
  
  // Wenn zwei identische Metriken gewählt wurden
  if (metrics.length === 2 && metrics[0] === metrics[1]) {
    return {
      isValid: true,
      metricType: getMetricType(metrics[0])
    };
  }
  
  // Wenn zwei verschiedene Metriken gewählt wurden
  if (metrics.length === 2) {
    const typeA = getMetricType(metrics[0]);
    const typeB = getMetricType(metrics[1]);
    
    // Beide numerisch, aber unterschiedlich
    if (typeA === MetricType.NUMERICAL && typeB === MetricType.NUMERICAL) {
      return {
        isValid: false,
        errorMessage: "Use the same metrics for comparison.",
        metricType: MetricType.NUMERICAL
      };
    }
    
    // Beide kategorisch, aber unterschiedlich
    if (typeA === MetricType.CATEGORICAL && typeB === MetricType.CATEGORICAL) {
      return {
        isValid: false,
        errorMessage: "Use the same metrics for comparison.",
        metricType: MetricType.CATEGORICAL
      };
    }
    
    // Gemischte Typen (numerisch + kategorisch)
    return {
      isValid: false,
      errorMessage: "Use the same metrics, and don't mix up categorical and numerical metrics.",
      metricType: MetricType.MIXED
    };
  }
  
  // Mehr als zwei Metriken (sollte nicht vorkommen)
  return {
    isValid: false,
    errorMessage: "Too many metrics selected. Please select only one or two metrics.",
    metricType: MetricType.MIXED
  };
}

/**
 * Validiert, ob der gewählte Testtyp für die Metriktypen geeignet ist
 */
export function validateTestForMetrics(
  testType: string,
  metricType: MetricType
): MetricValidationResult {
  const lowerTestType = testType.toLowerCase();
  
  // Numerical metrics should use t-test
  if (metricType === MetricType.NUMERICAL && lowerTestType !== 't-test') {
    return {
      isValid: false,
      errorMessage: "You chose numerical data, use T-Test.",
      metricType
    };
  }
  
  // Categorical metrics should use chi-square
  if (metricType === MetricType.CATEGORICAL && lowerTestType !== 'chi-square') {
    return {
      isValid: false,
      errorMessage: "You chose categorical data, use Chi-Square test.",
      metricType
    };
  }
  
  // Mixed metrics should not be used with any test
  if (metricType === MetricType.MIXED) {
    return {
      isValid: false,
      errorMessage: "Use the same metrics, and don't mix up categorical and numerical metrics.",
      metricType
    };
  }
  
  // Valid test type for metric type
  return {
    isValid: true,
    metricType
  };
} 