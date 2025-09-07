#!/usr/bin/env node

// Custom test runner for comprehensive Food Recognition AI testing

import { spawn } from 'child_process';
import * as path from 'path';

interface TestSuite {
  name: string;
  pattern: string;
  timeout?: number;
  coverage?: boolean;
  description: string;
}

const TEST_SUITES: TestSuite[] = [
  {
    name: 'Unit Tests',
    pattern: 'src/__tests__/unit/**/*.test.ts',
    timeout: 10000,
    coverage: true,
    description: 'Test individual components and functions'
  },
  {
    name: 'Integration Tests',
    pattern: 'src/__tests__/integration/**/*.test.ts',
    timeout: 30000,
    coverage: false,
    description: 'Test component interactions and real API calls'
  },
  {
    name: 'Accuracy Validation',
    pattern: 'src/__tests__/accuracy/**/*.test.ts',
    timeout: 60000,
    coverage: false,
    description: 'Comprehensive accuracy validation against known food data'
  }
];

interface TestResult {
  suiteName: string;
  passed: boolean;
  output: string;
  duration: number;
  coverage?: string;
}

class TestRunner {
  private results: TestResult[] = [];

  async runSuite(suite: TestSuite): Promise<TestResult> {
    console.log(`\\n📋 Running ${suite.name}...`);
    console.log(`   ${suite.description}`);
    console.log(`   Pattern: ${suite.pattern}`);
    console.log(`   Timeout: ${suite.timeout || 15000}ms`);

    const startTime = Date.now();
    
    const jestArgs = [
      '--testPathPattern=' + suite.pattern,
      '--testTimeout=' + (suite.timeout || 15000),
      '--verbose',
      '--detectOpenHandles',
      '--forceExit'
    ];

    if (suite.coverage) {
      jestArgs.push('--coverage');
    }

    if (process.env.VERBOSE) {
      jestArgs.push('--verbose');
    }

    return new Promise((resolve) => {
      const jest = spawn('npx', ['jest', ...jestArgs], {
        stdio: 'pipe',
        cwd: process.cwd(),
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let output = '';
      let errorOutput = '';

      jest.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        if (process.env.VERBOSE) {
          process.stdout.write(text);
        }
      });

      jest.stderr?.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        if (process.env.VERBOSE) {
          process.stderr.write(text);
        }
      });

      jest.on('close', (code) => {
        const duration = Date.now() - startTime;
        const passed = code === 0;
        
        const result: TestResult = {
          suiteName: suite.name,
          passed,
          output: output + errorOutput,
          duration
        };

        if (passed) {
          console.log(`   ✅ ${suite.name} completed successfully (${duration}ms)`);
        } else {
          console.log(`   ❌ ${suite.name} failed (${duration}ms)`);
          if (!process.env.VERBOSE) {
            console.log('\\n--- Error Output ---');
            console.log(errorOutput);
            console.log('--- End Error Output ---\\n');
          }
        }

        resolve(result);
      });
    });
  }

  async runAll(): Promise<void> {
    console.log('🧪 Starting Food Recognition AI Test Suite');
    console.log('=' .repeat(60));

    for (const suite of TEST_SUITES) {
      const result = await this.runSuite(suite);
      this.results.push(result);
    }

    this.printSummary();
  }

  async runAccuracyOnly(): Promise<void> {
    console.log('🎯 Running Accuracy Validation Tests Only');
    console.log('=' .repeat(60));

    const accuracySuite = TEST_SUITES.find(s => s.name === 'Accuracy Validation');
    if (accuracySuite) {
      const result = await this.runSuite(accuracySuite);
      this.results.push(result);
      this.printSummary();
    }
  }

  async runQuick(): Promise<void> {
    console.log('⚡ Running Quick Test Suite (Unit Tests Only)');
    console.log('=' .repeat(60));

    const unitSuite = TEST_SUITES.find(s => s.name === 'Unit Tests');
    if (unitSuite) {
      const result = await this.runSuite(unitSuite);
      this.results.push(result);
      this.printSummary();
    }
  }

  private printSummary(): void {
    console.log('\\n📊 Test Results Summary');
    console.log('=' .repeat(60));

    let totalPassed = 0;
    let totalDuration = 0;

    this.results.forEach(result => {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      const duration = (result.duration / 1000).toFixed(1);
      
      console.log(`${status} ${result.suiteName} (${duration}s)`);
      
      if (result.passed) totalPassed++;
      totalDuration += result.duration;
    });

    const overallPassed = totalPassed === this.results.length;
    const totalTime = (totalDuration / 1000).toFixed(1);
    
    console.log('\\n' + '='.repeat(60));
    console.log(`Overall Result: ${overallPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log(`Total Time: ${totalTime}s`);
    console.log(`Suites Passed: ${totalPassed}/${this.results.length}`);

    if (!overallPassed) {
      console.log('\\n❗ Failed test output can be found above');
      console.log('💡 Run with VERBOSE=true for detailed output');
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const runner = new TestRunner();
  const command = process.argv[2];

  switch (command) {
    case 'accuracy':
      await runner.runAccuracyOnly();
      break;
    case 'quick':
      await runner.runQuick();
      break;
    case 'all':
    default:
      await runner.runAll();
      break;
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { TestRunner };