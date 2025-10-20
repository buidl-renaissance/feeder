import { processPendingContent } from '../src/lib/jobs/process-content';

async function runProcessJob() {
  console.log('🔄 Starting content processing job...');
  
  try {
    const result = await processPendingContent();
    
    if (result.success) {
      console.log(`✅ Processing job completed successfully!`);
      console.log(`📊 Total items processed: ${result.totalProcessed}`);
      console.log(`📋 Results by content:`);
      
      result.results.forEach(content => {
        if (content.success) {
          console.log(`  ✅ ${content.contentId}: ${content.workflowsExecuted} workflows executed`);
        } else {
          console.log(`  ❌ ${content.contentId}: ${content.error}`);
        }
      });
    } else {
      console.log('❌ Processing job failed');
    }
  } catch (error) {
    console.error('💥 Processing job crashed:', error);
  }
}

runProcessJob();
