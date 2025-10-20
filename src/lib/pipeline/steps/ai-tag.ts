import OpenAI from 'openai';
import { ContentObject } from '@/types/content';

export class AITagStep {
  private openai: OpenAI;
  private config: {
    model?: string;
    maxTags?: number;
    categories?: string[];
    temperature?: number;
  };

  constructor(config: any = {}) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.config = {
      model: config.model || 'gpt-3.5-turbo',
      maxTags: config.maxTags || 5,
      categories: config.categories || ['technology', 'business', 'science', 'entertainment', 'sports', 'politics', 'health', 'education'],
      temperature: config.temperature || 0.3,
    };
  }

  async process(content: ContentObject): Promise<ContentObject> {
    try {
      const textToAnalyze = content.rawContent || content.description || content.title;
      
      if (!textToAnalyze) {
        return content;
      }

      const categories = this.config.categories!.join(', ');
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content: `Analyze the following content and provide ${this.config.maxTags} relevant tags from these categories: ${categories}. 
            Also provide a sentiment (positive, negative, neutral) and a confidence score (0-1).
            Return the response as JSON with this structure: {"tags": ["tag1", "tag2"], "sentiment": "positive", "confidence": 0.8}`,
          },
          {
            role: 'user',
            content: textToAnalyze,
          },
        ],
        max_tokens: 200,
        temperature: this.config.temperature,
      });

      const analysisText = response.choices[0]?.message?.content || '';
      
      try {
        const analysis = JSON.parse(analysisText);
        
        return {
          ...content,
          metadata: {
            ...content.metadata,
            aiTags: analysis.tags || [],
            sentiment: analysis.sentiment || 'neutral',
            confidence: analysis.confidence || 0.5,
            model: this.config.model,
          },
        };
      } catch (parseError) {
        // Fallback if JSON parsing fails
        const tags = analysisText.split(',').map(tag => tag.trim()).slice(0, this.config.maxTags);
        
        return {
          ...content,
          metadata: {
            ...content.metadata,
            aiTags: tags,
            sentiment: 'neutral',
            confidence: 0.5,
            model: this.config.model,
          },
        };
      }
    } catch (error) {
      console.error('AI tagging failed:', error);
      return content;
    }
  }
}
