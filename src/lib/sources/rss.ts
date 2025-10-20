import Parser from 'rss-parser';
import { SourceConnector } from './base';
import { SourceType, RSSItem, ContentObject } from '@/types/content';
import { createContentWithDuplicatePrevention } from '@/lib/utils/duplicate-prevention';

export class RSSConnector extends SourceConnector {
  private parser: Parser;

  constructor(sourceId: string, config: Record<string, any>) {
    super(sourceId, config);
    this.parser = new Parser({
      customFields: {
        feed: [],
        item: [],
      },
    });
  }

  getSourceType(): SourceType {
    return SourceType.RSS;
  }

  async fetch(): Promise<ContentObject[]> {
    try {
      const url = this.config.url;
      if (!url) {
        throw new Error('RSS URL not configured');
      }
      
      const feed = await this.parser.parseURL(url);
      
      if (!feed.items) {
        return [];
      }

      // Process items with duplicate prevention
      const results = [];
      for (const item of feed.items) {
        const rssItem: RSSItem = {
          title: item.title || 'Untitled',
          description: item.contentSnippet || item.description,
          link: item.link,
          pubDate: item.pubDate,
          content: item.content,
          categories: item.categories,
          author: item.creator || item.author,
        };

        const normalizedContent = this.normalizeContent(rssItem);
        
        // Use duplicate prevention when creating content
        try {
          const result = await createContentWithDuplicatePrevention(normalizedContent);
          if (result.created) {
            results.push(result.content);
            console.log(`✓ Created new content: "${normalizedContent.title}"`);
          } else {
            console.log(`⚠ Skipped duplicate: "${normalizedContent.title}"`);
          }
        } catch (error) {
          console.error('Error creating content with duplicate prevention:', error);
          // Fallback to original behavior if duplicate prevention fails
          results.push(normalizedContent);
        }
      }

      return results;
    } catch (error) {
      console.error(`Error fetching RSS feed ${this.config.url}:`, error);
      throw new Error(`Failed to fetch RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
