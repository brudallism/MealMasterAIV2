import { openAIClient } from './openai-client';

export abstract class BaseAISystem {
  protected systemName: string;
  
  constructor(systemName: string) {
    this.systemName = systemName;
  }
  
  protected async callAI(prompt: string, systemPrompt?: string, model: string = 'gpt-4o-mini') {
    const messages = [
      ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
      { role: 'user' as const, content: prompt }
    ];
    
    const startTime = Date.now();
    const result = await openAIClient.chat(messages, model);
    const responseTime = Date.now() - startTime;
    
    // Log AI request for monitoring
    this.logAIRequest(prompt, result, responseTime);
    
    return result;
  }
  
  private async logAIRequest(prompt: string, result: any, responseTime: number) {
    // Implementation will connect to ai_requests_log table
    console.log(`[${this.systemName}] Response time: ${responseTime}ms, Success: ${result.success}`);
  }
}