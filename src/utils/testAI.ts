import { openAIClient } from '@/services/ai/openai-client';

export async function testOpenAIConnection() {
  try {
    const result = await openAIClient.chat([
      { role: 'user', content: 'Say "AI connection successful!" if you can read this.' }
    ]);
    
    if (result.success) {
      console.log('OpenAI response:', result.data);
      return true;
    } else {
      console.error('OpenAI error:', result.error);
      return false;
    }
  } catch (error) {
    console.error('OpenAI test failed:', error);
    return false;
  }
}