import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq } from 'drizzle-orm';
import Database from 'better-sqlite3';
import * as schema from '../src/db/schema';

// Create database connection
const sqlite = new Database('./local.db');
const db = drizzle(sqlite, { schema });

async function testDatabase() {
  try {
    // Test query to check if tables exist
    const sources = await db.select().from(schema.sources).limit(1);
    console.log('✅ Database connection successful!');
    console.log(`📊 Found ${sources.length} sources in database`);
    
    // Test inserting a sample source
    const testId = `test-source-${Date.now()}`;
    const newSource = await db.insert(schema.sources).values({
      id: testId,
      type: 'RSS',
      name: 'Test RSS Feed',
      url: 'https://example.com/feed.xml',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    console.log('✅ Sample source created:', newSource[0].name);
    
    // Clean up test data
    await db.delete(schema.sources).where(eq(schema.sources.id, testId));
    console.log('🧹 Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    sqlite.close();
  }
}

testDatabase();
