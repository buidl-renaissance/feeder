import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { fetchSource } from '@/inngest/functions/fetch-source';
import { fetchAllSources } from '@/inngest/functions/fetch-all-sources';
import { processContent } from '@/inngest/functions/process-content';
import { scheduleSourceFetches } from '@/inngest/functions/schedule-source-fetches';
import { scheduledEventPoll, manualEventPoll } from '@/inngest/functions/scheduled-event-poll';

export default serve({
  client: inngest,
  functions: [
    fetchSource,
    fetchAllSources,
    processContent,
    scheduleSourceFetches,
    scheduledEventPoll,
    manualEventPoll,
  ],
});
