import { fetchAllSources } from '../src/lib/jobs/fetch-sources';

async function runFetchJob() {
  console.log('🚀 Starting content fetch job...');
  
  try {
    const result = await fetchAllSources();
    
    if (result.success) {
      console.log(`✅ Fetch job completed successfully!`);
      console.log(`📊 Total items fetched: ${result.totalFetched}`);
      console.log(`📋 Results by source:`);
      
      result.results.forEach(source => {
        if (source.success) {
          console.log(`  ✅ ${source.sourceName}: ${source.count} items`);
        } else {
          console.log(`  ❌ ${source.sourceName}: ${source.error}`);
        }
      });
    } else {
      console.log('❌ Fetch job failed');
    }
  } catch (error) {
    console.error('💥 Fetch job crashed:', error);
  }
}

runFetchJob();
