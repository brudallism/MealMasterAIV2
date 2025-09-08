// Audit Helper Functions for Data Validation Gateway
import { supabase } from '../database/supabase';
import type { Database } from '../database/supabase';

type AuditTrail = Database['public']['Tables']['audit_trails']['Insert'];
type ValidationLog = Database['public']['Tables']['data_validation_logs']['Insert'];
type IntegrityCheck = Database['public']['Tables']['system_integrity_checks']['Insert'];

export interface AuditContext {
  userId?: string;
  systemName: string;
  operationType: 'insert' | 'update' | 'delete' | 'batch' | 'query';
  tableName: string;
  beforeState?: any;
  afterState?: any;
  businessContext?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface ValidationResult {
  tier: 1 | 2 | 3;
  type: 'schema' | 'business_rule' | 'ai_pattern' | 'crisis_detection';
  result: 'pass' | 'fail' | 'warning';
  confidenceScore?: number;
  processingTimeMs: number;
  validationDetails?: any;
  errorMessages?: string[];
  warnings?: string[];
  recommendations?: string[];
  aiModelUsed?: string;
  tokensUsed?: number;
  apiCostUsd?: number;
}

export class AuditHelper {
  private static generateOperationId(): string {
    return crypto.randomUUID();
  }

  private static generateIntegrityHash(data: any): string {
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    return btoa(jsonString).replace(/[+/=]/g, '').substring(0, 32);
  }

  private static calculateChangedFields(before: any, after: any): string[] {
    if (!before || !after) return [];
    
    const changes: string[] = [];
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    
    for (const key of allKeys) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changes.push(key);
      }
    }
    
    return changes;
  }

  static async createAuditTrail(
    context: AuditContext,
    validationStatus: 'passed' | 'failed' | 'warning' = 'passed',
    validationTier?: number,
    executionTimeMs?: number
  ): Promise<{ auditTrailId: string; operationId: string } | null> {
    try {
      const operationId = this.generateOperationId();
      const changedFields = this.calculateChangedFields(context.beforeState, context.afterState);
      
      const auditData: AuditTrail = {
        operation_id: operationId,
        user_id: context.userId || null,
        system_name: context.systemName,
        operation_type: context.operationType,
        table_name: context.tableName,
        before_state: context.beforeState || null,
        after_state: context.afterState || null,
        changed_fields: changedFields.length > 0 ? changedFields : null,
        validation_status: validationStatus,
        validation_tier: validationTier || null,
        execution_time_ms: executionTimeMs || null,
        integrity_hash: this.generateIntegrityHash({
          operation_id: operationId,
          system_name: context.systemName,
          operation_type: context.operationType,
          table_name: context.tableName
        }),
        ip_address: context.ipAddress || null,
        user_agent: context.userAgent || null,
        business_context: context.businessContext || null,
        error_details: null
      };

      const { data, error } = await supabase
        .from('audit_trails')
        .insert(auditData)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create audit trail:', error);
        return null;
      }

      return {
        auditTrailId: data.id,
        operationId
      };
    } catch (error) {
      console.error('Error creating audit trail:', error);
      return null;
    }
  }

  static async logValidationResult(
    operationId: string,
    auditTrailId: string,
    validation: ValidationResult
  ): Promise<boolean> {
    try {
      const validationData: ValidationLog = {
        operation_id: operationId,
        audit_trail_id: auditTrailId,
        validation_tier: validation.tier,
        validation_type: validation.type,
        validation_result: validation.result,
        confidence_score: validation.confidenceScore || null,
        processing_time_ms: validation.processingTimeMs,
        validation_details: validation.validationDetails || null,
        error_messages: validation.errorMessages || null,
        warnings: validation.warnings || null,
        recommendations: validation.recommendations || null,
        ai_model_used: validation.aiModelUsed || null,
        tokens_used: validation.tokensUsed || null,
        api_cost_usd: validation.apiCostUsd || null
      };

      const { error } = await supabase
        .from('data_validation_logs')
        .insert(validationData);

      if (error) {
        console.error('Failed to log validation result:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error logging validation result:', error);
      return false;
    }
  }

  static async updateAuditTrailStatus(
    auditTrailId: string,
    status: 'passed' | 'failed' | 'warning',
    errorDetails?: any
  ): Promise<boolean> {
    try {
      const updateData: any = { validation_status: status };
      
      if (errorDetails) {
        updateData.error_details = errorDetails;
      }

      const { error } = await supabase
        .from('audit_trails')
        .update(updateData)
        .eq('id', auditTrailId);

      if (error) {
        console.error('Failed to update audit trail status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating audit trail status:', error);
      return false;
    }
  }

  static async createIntegrityCheck(
    checkType: 'data_consistency' | 'audit_completeness' | 'performance_sla' | 'security_scan',
    scopeDescription: string,
    status: 'healthy' | 'warning' | 'critical',
    details: {
      issuesFound?: number;
      issuesDetails?: any;
      checkDurationMs?: number;
      recordsChecked?: number;
      autoRemediationAttempted?: boolean;
      manualInterventionRequired?: boolean;
      escalationTriggered?: boolean;
    } = {}
  ): Promise<string | null> {
    try {
      const checkData: IntegrityCheck = {
        check_type: checkType,
        scope_description: scopeDescription,
        status: status,
        issues_found: details.issuesFound || 0,
        issues_details: details.issuesDetails || null,
        check_duration_ms: details.checkDurationMs || null,
        records_checked: details.recordsChecked || null,
        auto_remediation_attempted: details.autoRemediationAttempted || false,
        manual_intervention_required: details.manualInterventionRequired || false,
        escalation_triggered: details.escalationTriggered || false
      };

      const { data, error } = await supabase
        .from('system_integrity_checks')
        .insert(checkData)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create integrity check:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error creating integrity check:', error);
      return null;
    }
  }

  static async getAuditTrails(
    userId?: string,
    systemName?: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('audit_trails')
        .select(`
          *,
          data_validation_logs (*)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (systemName) {
        query = query.eq('system_name', systemName);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get audit trails:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting audit trails:', error);
      return [];
    }
  }

  static async getValidationStats(
    userId?: string,
    systemName?: string,
    hoursBack: number = 24
  ): Promise<{
    totalOperations: number;
    passedOperations: number;
    failedOperations: number;
    warningOperations: number;
    avgProcessingTime: number;
    tierBreakdown: Record<string, number>;
  }> {
    try {
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
      
      let query = supabase
        .from('audit_trails')
        .select(`
          validation_status,
          execution_time_ms,
          data_validation_logs (
            validation_tier,
            processing_time_ms
          )
        `)
        .gte('created_at', since);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (systemName) {
        query = query.eq('system_name', systemName);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to get validation stats:', error);
        return {
          totalOperations: 0,
          passedOperations: 0,
          failedOperations: 0,
          warningOperations: 0,
          avgProcessingTime: 0,
          tierBreakdown: {}
        };
      }

      const stats = {
        totalOperations: data?.length || 0,
        passedOperations: data?.filter(d => d.validation_status === 'passed').length || 0,
        failedOperations: data?.filter(d => d.validation_status === 'failed').length || 0,
        warningOperations: data?.filter(d => d.validation_status === 'warning').length || 0,
        avgProcessingTime: 0,
        tierBreakdown: {} as Record<string, number>
      };

      if (data && data.length > 0) {
        const totalTime = data.reduce((sum, d) => sum + (d.execution_time_ms || 0), 0);
        stats.avgProcessingTime = Math.round(totalTime / data.length);

        data.forEach(d => {
          if (d.data_validation_logs) {
            d.data_validation_logs.forEach((log: any) => {
              const tier = `tier_${log.validation_tier}`;
              stats.tierBreakdown[tier] = (stats.tierBreakdown[tier] || 0) + 1;
            });
          }
        });
      }

      return stats;
    } catch (error) {
      console.error('Error getting validation stats:', error);
      return {
        totalOperations: 0,
        passedOperations: 0,
        failedOperations: 0,
        warningOperations: 0,
        avgProcessingTime: 0,
        tierBreakdown: {}
      };
    }
  }
}

// Convenience functions for common operations
export const createFoodRecognitionAudit = async (
  userId: string,
  operationType: 'insert' | 'update' | 'query',
  beforeState?: any,
  afterState?: any,
  businessContext?: any
) => {
  return await AuditHelper.createAuditTrail({
    userId,
    systemName: 'food_recognition_ai',
    operationType,
    tableName: operationType === 'query' ? 'food_recognition_cache' : 'daily_meals',
    beforeState,
    afterState,
    businessContext
  });
};

export const createUserFacingAudit = async (
  userId: string,
  operationType: 'insert' | 'update' | 'query',
  beforeState?: any,
  afterState?: any,
  businessContext?: any
) => {
  return await AuditHelper.createAuditTrail({
    userId,
    systemName: 'user_facing_ai',
    operationType,
    tableName: 'daily_meals',
    beforeState,
    afterState,
    businessContext
  });
};

export const logTier1Validation = async (
  operationId: string,
  auditTrailId: string,
  result: 'pass' | 'fail' | 'warning',
  processingTimeMs: number,
  errorMessages?: string[]
) => {
  return await AuditHelper.logValidationResult(operationId, auditTrailId, {
    tier: 1,
    type: 'schema',
    result,
    processingTimeMs,
    errorMessages
  });
};

export const logTier2Validation = async (
  operationId: string,
  auditTrailId: string,
  result: 'pass' | 'fail' | 'warning',
  processingTimeMs: number,
  validationDetails?: any,
  errorMessages?: string[],
  warnings?: string[]
) => {
  return await AuditHelper.logValidationResult(operationId, auditTrailId, {
    tier: 2,
    type: 'business_rule',
    result,
    processingTimeMs,
    validationDetails,
    errorMessages,
    warnings
  });
};

export const logTier3Validation = async (
  operationId: string,
  auditTrailId: string,
  result: 'pass' | 'fail' | 'warning',
  processingTimeMs: number,
  confidenceScore: number,
  aiModelUsed: string,
  tokensUsed?: number,
  apiCostUsd?: number,
  validationDetails?: any,
  errorMessages?: string[],
  warnings?: string[],
  recommendations?: string[]
) => {
  return await AuditHelper.logValidationResult(operationId, auditTrailId, {
    tier: 3,
    type: 'ai_pattern',
    result,
    processingTimeMs,
    confidenceScore,
    aiModelUsed,
    tokensUsed,
    apiCostUsd,
    validationDetails,
    errorMessages,
    warnings,
    recommendations
  });
};