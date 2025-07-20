export class GroqService {
  private static readonly API_BASE = 'https://api.groq.com/openai/v1/chat/completions';
  private static readonly API_KEY = import.meta.env.VITE_GROQ_API_KEY?.trim();

  static async sendMessage(message: string, context?: {
    lessonTitle?: string;
    lessonTranscript?: string;
    chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<{ response: string; error?: string }> {
    try {
      if (!this.API_KEY || this.API_KEY.length < 10) {
        throw new Error('Groq API key not configured or invalid. Please check your environment variables.');
      }

      // Prepare context for AI
      let systemMessage = `You are a helpful AI tutor assistant for an online learning platform. You help students understand course content and answer their questions clearly and educationally.

Guidelines:
- Answer questions based on the lesson content provided
- If you don't have enough context, ask for clarification
- Keep responses educational and supportive
- Be concise but thorough
- Use examples when helpful
- If the question is outside the lesson scope, acknowledge it and provide general guidance`;

      let userMessage = message;

      if (context?.lessonTitle) {
        systemMessage += `\n\nCurrent Lesson: "${context.lessonTitle}"`;
      }

      if (context?.lessonTranscript && context.lessonTranscript.trim()) {
        // Limit transcript length to avoid token limits
        const maxTranscriptLength = 2000;
        const transcript = context.lessonTranscript.length > maxTranscriptLength 
          ? context.lessonTranscript.substring(0, maxTranscriptLength) + '...'
          : context.lessonTranscript;
        
        systemMessage += `\n\nLesson Content/Transcript:\n${transcript}`;
        userMessage = `Based on the lesson content above, ${message}`;
      }

      // Prepare messages array
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemMessage }
      ];

      // Add chat history if available (last 4 messages to stay within token limits)
      if (context?.chatHistory && context.chatHistory.length > 0) {
        const recentHistory = context.chatHistory.slice(-4);
        messages.push(...recentHistory);
      }

      // Add current user message
      messages.push({ role: 'user', content: userMessage });

      const requestBody = {
        model: 'llama3-8b-8192',
        messages,
        max_tokens: 800,
        temperature: 0.7,
        top_p: 0.9,
        stream: false,
      };

      const response = await fetch(this.API_BASE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error('Invalid response from Groq API');
      }

      return {
        response: data.choices[0].message.content.trim()
      };
      
    } catch (error: any) {
      console.error('Groq API error:', error);
      return {
        response: '',
        error: error.message || 'Failed to get AI response'
      };
    }
  }
}
