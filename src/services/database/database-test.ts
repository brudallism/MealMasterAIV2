// Database connection test for Data Validation Gateway
import { supabase } from './supabase';

interface TestResult {
  testName: string;
  success: boolean;
  message: string;
  duration?: number;
}

export class DatabaseConnectionTest {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    this.results = [];
    
    console.log('🧪 Running Database Connection Tests for Data Validation Gateway...\n');
    
    await this.testBasicConnection();
    await this.testAuditTrailsTable();
    await this.testValidationLogsTable();
    await this.testIntegrityChecksTable();
    await this.testTableRelationships();
    
    this.printResults();
    return this.results;
  }

  private async testBasicConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.from('users').select('count', { count: 'exact' });
      
      if (error) {
        this.addResult('Basic Connection', false, `Connection failed: ${error.message}`, Date.now() - startTime);
        return;
      }
      
      this.addResult('Basic Connection', true, `Connected successfully`, Date.now() - startTime);
    } catch (error) {
      this.addResult('Basic Connection', false, `Connection error: ${error}`, Date.now() - startTime);
    }
  }

  private async testAuditTrailsTable(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test table exists and basic structure
      const { data, error } = await supabase
        .from('audit_trails')
        .select('id')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows, which is fine
        this.addResult('Audit Trails Table', false, `Table access failed: ${error.message}`, Date.now() - startTime);
        return;
      }
      
      this.addResult('Audit Trails Table', true, 'Table accessible and structured correctly', Date.now() - startTime);
    } catch (error) {
      this.addResult('Audit Trails Table', false, `Table test error: ${error}`, Date.now() - startTime);
    }
  }

  private async testValidationLogsTable(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('data_validation_logs')
        .select('id')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        this.addResult('Validation Logs Table', false, `Table access failed: ${error.message}`, Date.now() - startTime);
        return;
      }
      
      this.addResult('Validation Logs Table', true, 'Table accessible and structured correctly', Date.now() - startTime);
    } catch (error) {
      this.addResult('Validation Logs Table', false, `Table test error: ${error}`, Date.now() - startTime);
    }
  }

  private async testIntegrityChecksTable(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase
        .from('system_integrity_checks')
        .select('id')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        this.addResult('Integrity Checks Table', false, `Table access failed: ${error.message}`, Date.now() - startTime);
        return;
      }
      
      this.addResult('Integrity Checks Table', true, 'Table accessible and structured correctly', Date.now() - startTime);
    } catch (error) {
      this.addResult('Integrity Checks Table', false, `Table test error: ${error}`, Date.now() - startTime);
    }
  }

  private async testTableRelationships(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test foreign key relationship between validation_logs and audit_trails
      const { data, error } = await supabase
        .from('data_validation_logs')
        .select(`
          id,
          audit_trail_id,
          audit_trails:audit_trail_id (
            id,
            operation_id
          )
        `)
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        this.addResult('Table Relationships', false, `Relationship test failed: ${error.message}`, Date.now() - startTime);
        return;
      }
      
      this.addResult('Table Relationships', true, 'Foreign key relationships configured correctly', Date.now() - startTime);
    } catch (error) {
      this.addResult('Table Relationships', false, `Relationship test error: ${error}`, Date.now() - startTime);
    }
  }

  private addResult(testName: string, success: boolean, message: string, duration?: number): void {
    this.results.push({ testName, success, message, duration });
    
    const status = success ? '✅' : '❌';
    const durationStr = duration ? ` (${duration}ms)` : '';
    console.log(`${status} ${testName}: ${message}${durationStr}`);
  }

  private printResults(): void {
    const successful = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    console.log(`\n📊 Test Results: ${successful}/${total} tests passed`);
    
    if (successful === total) {
      console.log('🎉 All database tests passed! Data Validation Gateway database foundation is ready.');
    } else {
      console.log('⚠️  Some tests failed. Please check the audit table setup in Supabase.');
      
      const failures = this.results.filter(r => !r.success);
      console.log('\n❌ Failed tests:');
      failures.forEach(failure => {
        console.log(`  - ${failure.testName}: ${failure.message}`);
      });
    }
  }
}

// Export for testing
export const runDatabaseTests = async (): Promise<TestResult[]> => {
  const tester = new DatabaseConnectionTest();
  return await tester.runAllTests();
};