// src/services/transformers/base-transformer.ts

import { UnifiedMealItem } from '@/types/unified-meal-item';

/**
 * Generic transformer interface implemented by all API transformers
 * This ensures consistent transformation patterns across all data sources
 */
export interface BaseTransformer<T> {
  /**
   * Transform a single API response object to UnifiedMealItem
   * @param apiResponse The raw API response object
   * @returns Transformed UnifiedMealItem
   */
  transform(apiResponse: T): UnifiedMealItem;

  /**
   * Transform multiple API response objects to UnifiedMealItems
   * @param apiResponses Array of raw API response objects
   * @returns Array of transformed UnifiedMealItems
   */
  transformBatch(apiResponses: T[]): UnifiedMealItem[];
}

/**
 * Abstract base class that provides common transformation utilities
 * Can be extended by specific API transformers for shared functionality
 */
export abstract class AbstractTransformer<T> implements BaseTransformer<T> {
  abstract transform(apiResponse: T): UnifiedMealItem;

  transformBatch(apiResponses: T[]): UnifiedMealItem[] {
    return apiResponses.map(response => this.transform(response));
  }

  /**
   * Generate a consistent unified ID from source and original ID
   * @param source API source identifier
   * @param originalId Original API ID (string or number)
   */
  protected generateUnifiedId(source: string, originalId: string | number): string {
    return `${source}_${originalId}`;
  }

  /**
   * Safely extract numeric value with fallback
   * @param value Potentially undefined numeric value
   * @param fallback Default value if extraction fails
   */
  protected safeNumber(value: any, fallback: number = 0): number {
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  }

  /**
   * Safely extract string value with fallback
   * @param value Potentially undefined string value
   * @param fallback Default value if extraction fails
   */
  protected safeString(value: any, fallback: string = ''): string {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : fallback;
    }
    if (value != null) {
      const trimmed = String(value).trim();
      return trimmed.length > 0 ? trimmed : fallback;
    }
    return fallback;
  }

  /**
   * Clean and validate array values
   * @param value Potentially undefined array
   * @param fallback Default value if not an array
   */
  protected safeArray<U>(value: any, fallback: U[] = []): U[] {
    return Array.isArray(value) ? value : fallback;
  }

  /**
   * Extract and deduplicate tags from various sources
   * @param sources Array of potential tag sources
   */
  protected extractTags(...sources: (string | string[] | undefined)[]): string[] {
    const tags: string[] = [];

    for (const source of sources) {
      if (Array.isArray(source)) {
        tags.push(...source);
      } else if (typeof source === 'string' && source.trim()) {
        tags.push(source.trim());
      }
    }

    // Deduplicate and normalize
    return [...new Set(tags.map(tag => tag.toLowerCase().replace(/\s+/g, '-')))];
  }

  /**
   * Calculate confidence score based on data completeness
   * @param requiredFields Array of required field values
   * @param optionalFields Array of optional field values
   */
  protected calculateConfidence(requiredFields: any[], optionalFields: any[] = []): number {
    const requiredComplete = requiredFields.filter(field =>
      field !== undefined && field !== null && field !== ''
    ).length;

    const optionalComplete = optionalFields.filter(field =>
      field !== undefined && field !== null && field !== ''
    ).length;

    const requiredScore = requiredComplete / Math.max(requiredFields.length, 1);
    const optionalScore = optionalComplete / Math.max(optionalFields.length, 1);

    // Weight required fields more heavily
    return Math.min(1, (requiredScore * 0.8) + (optionalScore * 0.2));
  }
}