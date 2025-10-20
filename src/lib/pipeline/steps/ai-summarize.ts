import OpenAI from 'openai';
import { ContentObject } from '@/types/content';

export class AISummarizeStep {
  private openai: OpenAI;
  private config: {
    model?: string;
    maxLength?: number;
    temperature?: number;
  };

  constructor(config: any = {}) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.config = {
      model: config.model || 'gpt-3.5-turbo',
      maxLength: config.maxLength || 150,
      temperature: config.temperature || 0.7,
    };
  }

  async process(content: ContentObject): Promise<ContentObject> {
    try {
      const textToSummarize = content.rawContent || content.description || content.title;
      
      if (!textToSummarize) {
        return content;
      }

      const response = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content: `Summarize the following content in ${this.config.maxLength} characters or less. Focus on the key points and main ideas.`,
          },
          {
            role: 'user',
            content: textToSummarize,
          },
        ],
        max_tokens: Math.ceil(this.config.maxLength! / 4), // Rough token estimation
        temperature: this.config.temperature,
      });

      const summary = response.choices[0]?.message?.content || '';
      
      return {
        ...content,
        processedContent: summary,
        metadata: {
          ...content.metadata,
          aiSummary: summary,
          summaryLength: summary.length,
          model: this.config.model,
        },
      };
    } catch (error) {
      console.error('AI summarization failed:', error);
      return content;
    }
  }
}
