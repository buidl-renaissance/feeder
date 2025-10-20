import { SourceConnector } from './base';
import { SourceType, FileUploadConfig } from '@/types/content';

export class FileConnector extends SourceConnector {
  getSourceType(): SourceType {
    return SourceType.FILE;
  }

  async fetch(): Promise<ContentObject[]> {
    // File connector doesn't fetch - it processes uploaded files
    // This would typically be called from a file upload handler
    throw new Error('File connector does not support fetch operation. Use processFile method instead.');
  }

  async processFile(file: File, config: FileUploadConfig): Promise<ContentObject> {
    try {
      // Validate file type
      if (config.allowedTypes && !config.allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} not allowed`);
      }

      // Validate file size
      if (config.maxSize && file.size > config.maxSize) {
        throw new Error(`File size ${file.size} exceeds maximum ${config.maxSize}`);
      }

      // Read file content
      const content = await this.readFileContent(file);
      
      const fileData = {
        title: file.name,
        description: `Uploaded file: ${file.name}`,
        content: content,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          lastModified: file.lastModified,
        },
      };

      // Apply custom transform if provided
      if (config.transform) {
        const transformFn = new Function('data', config.transform);
        const transformedData = transformFn(fileData);
        return this.normalizeContent(transformedData);
      }

      return this.normalizeContent(fileData);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      
      reader.onerror = (e) => {
        reject(new Error('Failed to read file'));
      };
      
      if (file.type.startsWith('text/')) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  }
}
