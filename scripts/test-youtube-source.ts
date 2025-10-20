import { createSource } from '../src/db/queries';

async function testYouTubeSource() {
  console.log('🎬 Testing YouTube source creation...');
  
  try {
    // Create a YouTube source
    const youtubeSource = await createSource({
      id: `youtube-test-${Date.now()}`,
      type: 'YOUTUBE',
      name: 'Test YouTube Channel',
      url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCqlYzSgsh5jdtWYfVIBoTDw',
      config: {
        channelId: 'UCqlYzSgsh5jdtWYfVIBoTDw'
      },
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('✅ YouTube source created successfully!');
    console.log('📊 Source details:', {
      id: youtubeSource[0].id,
      name: youtubeSource[0].name,
      type: youtubeSource[0].type,
      url: youtubeSource[0].url,
      channelId: youtubeSource[0].config?.channelId
    });
    
    return youtubeSource[0];
  } catch (error) {
    console.error('❌ Failed to create YouTube source:', error);
    throw error;
  }
}

testYouTubeSource();
