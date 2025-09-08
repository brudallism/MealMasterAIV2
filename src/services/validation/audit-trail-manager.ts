// Comprehensive Audit Trail Management System
import { AuditHelper } from '../audit/audit-helper';
import { ValidationEngine, type ValidationResponse } from './validation-engine';

export interface AuditTrailQuery {
  userId?: string;
  systemName?: string;
  operationType?: string;
  tableName?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  validationStatus?: 'passed' | 'failed' | 'warning';
  limit?: number;
  offset?: number;
}

export interface AuditMetrics {
  totalOperations: number;
  successRate: number;
  avgProcessingTime: number;
  errorCount: number;
  warningCount: number;
  tierBreakdown: {
    tier1: { pass: number; fail: number; warning: number };
    tier2: { pass: number; fail: number; warning: number };
    tier3: { pass: number; fail: number; warning: number };
  };
  systemBreakdown: Record<string, {
    operations: number;
    successRate: number;
    avgTime: number;
  }>;
}

export interface SystemHealthStatus {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  recentErrorRate: number;
  avgResponseTime: number;
  issues: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    affectedSystems: string[];
    timestamp: Date;
  }>;
  recommendations: string[];
}

export class AuditTrailManager {
  private validationEngine: ValidationEngine;
  
  constructor() {
    this.validationEngine = new ValidationEngine();
  }

  async validateAndAudit(
    data: any,
    operation: 'insert' | 'update' | 'delete' | 'batch' | 'query',
    context: {
      userId?: string;
      systemName: string;
      tableName: string;
      beforeState?: any;
      businessContext?: any;
    }
  ): Promise<ValidationResponse> {
    return await this.validationEngine.validate({
      data,
      operation,
      context: {
        ...context,
        afterState: data
      }
    });
  }

  async queryAuditTrails(query: AuditTrailQuery): Promise<any[]> {
    try {
      const trails = await AuditHelper.getAuditTrails(
        query.userId,
        query.systemName,
        query.limit || 100,
        query.offset || 0
      );

      let filteredTrails = trails;

      // Apply additional filters
      if (query.operationType) {
        filteredTrails = filteredTrails.filter(t => t.operation_type === query.operationType);
      }

      if (query.tableName) {
        filteredTrails = filteredTrails.filter(t => t.table_name === query.tableName);
      }

      if (query.validationStatus) {
        filteredTrails = filteredTrails.filter(t => t.validation_status === query.validationStatus);
      }

      if (query.dateRange) {
        filteredTrails = filteredTrails.filter(t => {
          const trailDate = new Date(t.created_at);
          return trailDate >= query.dateRange!.start && trailDate <= query.dateRange!.end;
        });
      }

      return filteredTrails;
    } catch (error) {
      console.error('Failed to query audit trails:', error);
      return [];
    }
  }

  async getAuditMetrics(
    userId?: string,
    systemName?: string,
    hoursBack: number = 24
  ): Promise<AuditMetrics> {
    try {
      const stats = await AuditHelper.getValidationStats(userId, systemName, hoursBack);
      
      const trails = await this.queryAuditTrails({
        userId,
        systemName,
        dateRange: {
          start: new Date(Date.now() - hoursBack * 60 * 60 * 1000),
          end: new Date()
        },
        limit: 1000
      });

      // Calculate tier breakdown
      const tierBreakdown = {
        tier1: { pass: 0, fail: 0, warning: 0 },
        tier2: { pass: 0, fail: 0, warning: 0 },
        tier3: { pass: 0, fail: 0, warning: 0 }
      };

      // Calculate system breakdown
      const systemBreakdown: Record<string, {
        operations: number;
        successRate: number;
        avgTime: number;
      }> = {};

      trails.forEach(trail => {
        // System breakdown
        const system = trail.system_name;
        if (!systemBreakdown[system]) {
          systemBreakdown[system] = { operations: 0, successRate: 0, avgTime: 0 };
        }
        systemBreakdown[system].operations++;
        
        if (trail.validation_status === 'passed') {
          systemBreakdown[system].successRate++;
        }
        
        systemBreakdown[system].avgTime += trail.execution_time_ms || 0;

        // Process validation logs for tier breakdown
        if (trail.data_validation_logs) {
          trail.data_validation_logs.forEach((log: any) => {
            const tier = `tier${log.validation_tier}` as keyof typeof tierBreakdown;
            if (tierBreakdown[tier]) {
              if (log.validation_result === 'pass') {
                tierBreakdown[tier].pass++;
              } else if (log.validation_result === 'fail') {
                tierBreakdown[tier].fail++;
              } else if (log.validation_result === 'warning') {
                tierBreakdown[tier].warning++;
              }
            }
          });
        }
      });

      // Calculate success rates and average times
      Object.keys(systemBreakdown).forEach(system => {
        const systemData = systemBreakdown[system];
        systemData.successRate = systemData.operations > 0 
          ? (systemData.successRate / systemData.operations) * 100 
          : 0;
        systemData.avgTime = systemData.operations > 0 
          ? systemData.avgTime / systemData.operations 
          : 0;
      });

      return {
        totalOperations: stats.totalOperations,
        successRate: stats.totalOperations > 0 
          ? (stats.passedOperations / stats.totalOperations) * 100 
          : 100,
        avgProcessingTime: stats.avgProcessingTime,
        errorCount: stats.failedOperations,
        warningCount: stats.warningOperations,
        tierBreakdown,
        systemBreakdown
      };
    } catch (error) {
      console.error('Failed to calculate audit metrics:', error);
      return {
        totalOperations: 0,
        successRate: 0,
        avgProcessingTime: 0,
        errorCount: 0,
        warningCount: 0,
        tierBreakdown: {
          tier1: { pass: 0, fail: 0, warning: 0 },
          tier2: { pass: 0, fail: 0, warning: 0 },
          tier3: { pass: 0, fail: 0, warning: 0 }
        },
        systemBreakdown: {}
      };
    }
  }

  async getSystemHealthStatus(): Promise<SystemHealthStatus> {
    try {
      const recentMetrics = await this.getAuditMetrics(undefined, undefined, 1); // Last hour
      const dailyMetrics = await this.getAuditMetrics(undefined, undefined, 24); // Last 24 hours
      
      const issues: SystemHealthStatus['issues'] = [];
      const recommendations: string[] = [];
      
      // Calculate health indicators
      const recentErrorRate = recentMetrics.totalOperations > 0 
        ? (recentMetrics.errorCount / recentMetrics.totalOperations) * 100 
        : 0;
      
      const avgResponseTime = recentMetrics.avgProcessingTime;
      
      // Determine status
      let status: SystemHealthStatus['status'] = 'healthy';
      
      // Critical issues
      if (recentErrorRate > 25) {
        status = 'critical';
        issues.push({
          severity: 'critical',
          message: `High error rate: ${recentErrorRate.toFixed(1)}%`,
          affectedSystems: ['validation_engine'],
          timestamp: new Date()
        });
        recommendations.push('Investigate validation failures immediately');
      } else if (recentErrorRate > 10) {
        status = 'degraded';
        issues.push({
          severity: 'high',
          message: `Elevated error rate: ${recentErrorRate.toFixed(1)}%`,
          affectedSystems: ['validation_engine'],
          timestamp: new Date()
        });
        recommendations.push('Monitor error patterns and review validation rules');
      }
      
      // Performance issues
      if (avgResponseTime > 10000) { // 10 seconds
        if (status === 'healthy') status = 'degraded';
        issues.push({
          severity: 'medium',
          message: `Slow response time: ${avgResponseTime}ms`,
          affectedSystems: ['validation_engine', 'database'],
          timestamp: new Date()
        });
        recommendations.push('Review database performance and validation complexity');
      }
      
      // System-specific issues
      Object.entries(dailyMetrics.systemBreakdown).forEach(([systemName, systemData]) => {
        if (systemData.successRate < 90) {
          if (status === 'healthy') status = 'degraded';
          issues.push({
            severity: 'medium',
            message: `Low success rate for ${systemName}: ${systemData.successRate.toFixed(1)}%`,
            affectedSystems: [systemName],
            timestamp: new Date()
          });
          recommendations.push(`Review ${systemName} validation rules and data quality`);
        }
      });
      
      // If no issues but warning count is high
      if (status === 'healthy' && dailyMetrics.warningCount > dailyMetrics.totalOperations * 0.2) {
        status = 'degraded';
        issues.push({
          severity: 'low',
          message: `High warning count: ${dailyMetrics.warningCount} warnings`,
          affectedSystems: ['validation_engine'],
          timestamp: new Date()
        });
        recommendations.push('Review validation rules to reduce false warnings');
      }

      return {
        status,
        uptime: 100, // Placeholder - would be calculated from system start time
        recentErrorRate,
        avgResponseTime,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Failed to get system health status:', error);
      return {
        status: 'critical',
        uptime: 0,
        recentErrorRate: 100,
        avgResponseTime: 0,
        issues: [{
          severity: 'critical',
          message: 'Failed to assess system health',
          affectedSystems: ['audit_trail_manager'],
          timestamp: new Date()
        }],
        recommendations: ['Check database connectivity and audit system configuration']
      };
    }
  }

  async performIntegrityCheck(
    checkType: 'data_consistency' | 'audit_completeness' | 'performance_sla' = 'data_consistency'
  ): Promise<{
    checkId: string;
    status: 'healthy' | 'warning' | 'critical';
    issuesFound: number;
    details: any;
  }> {
    const startTime = Date.now();
    
    try {
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let issuesFound = 0;
      let details: any = {};
      
      switch (checkType) {
        case 'data_consistency':
          const recentTrails = await this.queryAuditTrails({
            limit: 1000,
            dateRange: {
              start: new Date(Date.now() - 24 * 60 * 60 * 1000),
              end: new Date()
            }
          });
          
          // Check for orphaned validation logs
          let orphanedLogs = 0;
          let missingAudits = 0;
          
          recentTrails.forEach(trail => {
            if (trail.data_validation_logs) {
              trail.data_validation_logs.forEach((log: any) => {
                if (!log.audit_trail_id || log.audit_trail_id !== trail.id) {
                  orphanedLogs++;
                }
              });
            }
            
            if (!trail.validation_status) {
              missingAudits++;
            }
          });
          
          issuesFound = orphanedLogs + missingAudits;
          details = { orphanedLogs, missingAudits, totalChecked: recentTrails.length };
          
          if (issuesFound > 10) {
            status = 'critical';
          } else if (issuesFound > 0) {
            status = 'warning';
          }
          break;
          
        case 'audit_completeness':
          const metrics = await this.getAuditMetrics(undefined, undefined, 24);
          const expectedOperations = 100; // Placeholder - would be calculated based on system activity
          const completenessRatio = metrics.totalOperations / expectedOperations;
          
          details = { 
            recordedOperations: metrics.totalOperations,
            expectedOperations,
            completenessRatio: completenessRatio * 100
          };
          
          if (completenessRatio < 0.8) {
            status = 'critical';
            issuesFound = 1;
          } else if (completenessRatio < 0.95) {
            status = 'warning';
            issuesFound = 1;
          }
          break;
          
        case 'performance_sla':
          const perfMetrics = await this.getAuditMetrics(undefined, undefined, 1);
          const slaThreshold = 5000; // 5 seconds SLA
          
          details = {
            avgResponseTime: perfMetrics.avgProcessingTime,
            slaThreshold,
            slaBreaches: perfMetrics.avgProcessingTime > slaThreshold ? 1 : 0
          };
          
          if (perfMetrics.avgProcessingTime > slaThreshold * 2) {
            status = 'critical';
            issuesFound = 1;
          } else if (perfMetrics.avgProcessingTime > slaThreshold) {
            status = 'warning';
            issuesFound = 1;
          }
          break;
      }
      
      const checkDuration = Date.now() - startTime;
      
      const checkId = await AuditHelper.createIntegrityCheck(
        checkType,
        `${checkType} check for audit trail system`,
        status,
        {
          issuesFound,
          issuesDetails: details,
          checkDurationMs: checkDuration,
          recordsChecked: details.totalChecked || 0
        }
      );
      
      return {
        checkId: checkId || 'failed',
        status,
        issuesFound,
        details
      };
      
    } catch (error) {
      const checkId = await AuditHelper.createIntegrityCheck(
        checkType,
        `${checkType} check failed`,
        'critical',
        {
          issuesFound: 1,
          issuesDetails: { error: error instanceof Error ? error.message : 'Unknown error' },
          checkDurationMs: Date.now() - startTime
        }
      );
      
      return {
        checkId: checkId || 'failed',
        status: 'critical',
        issuesFound: 1,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}

// Export singleton instance
export const auditTrailManager = new AuditTrailManager();