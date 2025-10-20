import { NextApiRequest, NextApiResponse } from 'next';
import { fetchAllSources } from '@/lib/jobs/fetch-sources';
import { processPendingContent } from '@/lib/jobs/process-content';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Manual refresh all triggered');
    
    // Fetch from all sources
    const fetchResult = await fetchAllSources();
    
    if (fetchResult.success) {
      console.log(`✅ Fetched ${fetchResult.totalFetched} items from ${fetchResult.results.length} sources`);
    }
    
    // Process content
    const processResult = await processPendingContent();
    
    if (processResult.success) {
      console.log(`✅ Processed ${processResult.totalProcessed} content items`);
    }

    res.status(200).json({ 
      success: true, 
      message: 'All sources refreshed successfully',
      fetchResult,
      processResult
    });

  } catch (error) {
    console.error('Error refreshing all sources:', error);
    res.status(500).json({ 
      error: 'Failed to refresh all sources',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
