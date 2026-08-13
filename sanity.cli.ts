import { defineCliConfig } from 'sanity/cli'
import { sanityDataset, sanityProjectId } from '@/lib/sanity/env'

export default defineCliConfig({
  api: {
    projectId: sanityProjectId || 'neurova-demo',
    dataset: sanityDataset || 'production',
  },
})
