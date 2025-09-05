import OpenAI from 'openai';
import Constants from 'expo-constants';

class OpenAIClient {
  private client: OpenAI;
  
  constructor() {
    const apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found in environment variables');
    }
    
    this.client = new OpenAI({
      apiKey,
    });
  }
  
  async chat(messages: OpenAI.Chat.ChatCompletionMessageParam[], model: string = 'gpt-4o-mini') {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      return {
        success: true,
        data: response.choices[0]?.message?.content || '',
        usage: response.usage,
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const openAIClient = new OpenAIClient();