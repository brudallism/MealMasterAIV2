-- Data Validation Gateway Audit Tables Setup
-- Run these SQL commands in your Supabase SQL Editor
-- These tables support comprehensive audit trails and data validation logging

-- 1. Comprehensive Audit Trail Table
CREATE TABLE IF NOT EXISTS audit_trails (
  -- Core identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Operation details
  user_id UUID REFERENCES users(id),
  system_name TEXT NOT NULL, -- 'user_facing_ai', 'food_recognition_ai', etc.
  operation_type TEXT NOT NULL, -- 'insert', 'update', 'delete', 'batch'
  table_name TEXT NOT NULL,
  
  -- Data states
  before_state JSONB,
  after_state JSONB,
  changed_fields TEXT[],
  
  -- Context and metadata
  validation_status TEXT NOT NULL, -- 'passed', 'failed', 'warning'
  validation_tier INTEGER, -- 1=schema, 2=business, 3=ai_pattern
  execution_time_ms INTEGER,
  
  -- Security and integrity
  integrity_hash TEXT, -- Hash of operation for tamper detection
  ip_address INET,
  user_agent TEXT,
  
  -- Additional context
  error_details JSONB,
  business_context JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Data Validation Logs Table
CREATE TABLE IF NOT EXISTS data_validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID NOT NULL,
  audit_trail_id UUID REFERENCES audit_trails(id),
  
  -- Validation specifics
  validation_tier INTEGER NOT NULL, -- 1, 2, or 3
  validation_type TEXT NOT NULL, -- 'schema', 'business_rule', 'ai_pattern', 'crisis_detection'
  
  -- Results
  validation_result TEXT NOT NULL, -- 'pass', 'fail', 'warning'
  confidence_score DECIMAL(3,2), -- For AI validations
  processing_time_ms INTEGER,
  
  -- Details
  validation_details JSONB, -- Specific validation results
  error_messages TEXT[],
  warnings TEXT[],
  recommendations TEXT[],
  
  -- AI usage tracking
  ai_model_used TEXT, -- 'gpt-3.5-turbo', null for deterministic
  tokens_used INTEGER,
  api_cost_usd DECIMAL(10,6),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. System Integrity Checks Table
CREATE TABLE IF NOT EXISTS system_integrity_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL, -- 'data_consistency', 'audit_completeness', 'performance_sla'
  
  -- Check details
  check_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scope_description TEXT, -- What was checked
  
  -- Results
  status TEXT NOT NULL, -- 'healthy', 'warning', 'critical'
  issues_found INTEGER DEFAULT 0,
  issues_details JSONB,
  
  -- Performance metrics
  check_duration_ms INTEGER,
  records_checked INTEGER,
  
  -- Follow-up actions
  auto_remediation_attempted BOOLEAN DEFAULT FALSE,
  manual_intervention_required BOOLEAN DEFAULT FALSE,
  escalation_triggered BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_trails_user_timestamp ON audit_trails(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trails_system_operation ON audit_trails(system_name, operation_type);
CREATE INDEX IF NOT EXISTS idx_audit_trails_operation_id ON audit_trails(operation_id);

CREATE INDEX IF NOT EXISTS idx_validation_logs_audit_trail ON data_validation_logs(audit_trail_id);
CREATE INDEX IF NOT EXISTS idx_validation_logs_tier_result ON data_validation_logs(validation_tier, validation_result);
CREATE INDEX IF NOT EXISTS idx_validation_logs_timestamp ON data_validation_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_integrity_checks_type_status ON system_integrity_checks(check_type, status);
CREATE INDEX IF NOT EXISTS idx_integrity_checks_timestamp ON system_integrity_checks(check_timestamp DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE audit_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_integrity_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_trails (users can only see their own audit trails)
CREATE POLICY "Users can view their own audit trails" ON audit_trails
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can access all audit data (for system operations)
CREATE POLICY "Service role can manage all audit trails" ON audit_trails
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for data_validation_logs (linked to audit trails access)
CREATE POLICY "Users can view validation logs for their operations" ON data_validation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM audit_trails 
      WHERE audit_trails.id = data_validation_logs.audit_trail_id 
      AND audit_trails.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all validation logs" ON data_validation_logs
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for system_integrity_checks (service role only)
CREATE POLICY "Service role can manage integrity checks" ON system_integrity_checks
  FOR ALL USING (auth.role() = 'service_role');

-- Optional: Create a view for common audit trail queries
CREATE OR REPLACE VIEW user_audit_summary AS
SELECT 
  at.user_id,
  at.system_name,
  at.operation_type,
  COUNT(*) as operation_count,
  AVG(at.execution_time_ms) as avg_execution_time,
  COUNT(CASE WHEN at.validation_status = 'failed' THEN 1 END) as failed_operations,
  MAX(at.timestamp) as last_operation
FROM audit_trails at
GROUP BY at.user_id, at.system_name, at.operation_type;

-- Grant appropriate permissions
GRANT SELECT ON user_audit_summary TO authenticated;
GRANT ALL ON audit_trails TO service_role;
GRANT ALL ON data_validation_logs TO service_role;  
GRANT ALL ON system_integrity_checks TO service_role;

-- Add helpful comments
COMMENT ON TABLE audit_trails IS 'Comprehensive audit trail for all data validation operations';
COMMENT ON TABLE data_validation_logs IS 'Detailed validation results for each tier of validation';
COMMENT ON TABLE system_integrity_checks IS 'System-wide integrity and health monitoring';

COMMENT ON COLUMN audit_trails.integrity_hash IS 'Hash for detecting audit trail tampering';
COMMENT ON COLUMN data_validation_logs.confidence_score IS 'AI confidence score (0.0-1.0) for AI-based validations';
COMMENT ON COLUMN system_integrity_checks.auto_remediation_attempted IS 'Whether system attempted automatic fix';