import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    policies: collection({
      label: 'Legal Policies',
      slugField: 'title',
      path: '../tncm-next/src/content/policies/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        lastUpdated: fields.date({ label: 'Last Updated Date' }),
        content: fields.document({
          label: 'Content',
          formatting: true,
          dividers: true,
          links: true,
        }),
      },
    }),
  },
});
