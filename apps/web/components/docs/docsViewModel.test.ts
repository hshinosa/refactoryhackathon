import assert from 'node:assert/strict';

import { buildDocsReaderModel } from './docsViewModel';

const model = buildDocsReaderModel({
  docs: {
    projectId: 'project-12345678',
    version: 2,
    pages: [
      { slug: 'overview', title: 'Overview', content: '## Overview\n\nOverview body' },
      {
        slug: 'proxy-service',
        title: 'Proxy Service',
        content:
          [
            '## Proxy Service',
            '',
            'Files documented:',
            '- `internal/proxy/client.go`',
            '- `internal/proxy/config.go`',
            '',
            '| File | Purpose |',
            '| --- | --- |',
            '| `internal/proxy/client.go` | HTTP handlers |',
            '| `internal/proxy/config.go` | Env config |',
            '',
            '```go',
            'router.Get("/health", health)',
            '```',
            '',
            '### Runtime behavior',
            '',
            'Proxy body',
          ].join('\n'),
      },
    ],
    sidebar: [
      { title: 'Overview', slug: 'overview', children: [] },
      {
        title: 'Features',
        slug: 'features',
        children: [{ title: 'Proxy Service', slug: 'proxy-service', children: [] }],
      },
    ],
    sourceFiles: [
      {
        path: 'internal/proxy/client.go',
        language: 'go',
        content: 'func (c *Client) HandleModels(w http.ResponseWriter, r *http.Request) {}',
      },
      {
        path: 'internal/proxy/config.go',
        language: 'go',
        content: 'func LoadConfig() (Config, error) { return Config{}, nil }',
      },
      {
        path: 'main.go',
        language: 'go',
        content: 'func main() {}',
      },
    ],
  },
  activeSlug: 'proxy-service',
});

assert.equal(model.title, 'Proxy Service');
assert.equal(model.sidebar[1]?.title, 'Features');
assert.equal(model.sidebar[1]?.children?.[0]?.active, true);
assert.equal(model.sidebar[0]?.icon, 'overview');
assert.equal(model.sidebar[1]?.icon, 'features');
assert.equal(model.sidebar[1]?.collapsible, true);
assert.equal(model.sidebar[1]?.startsNewSection, true);
assert.equal(model.previous.label, 'Features');
assert.equal(model.next.label, 'Proxy Service');
assert.deepEqual(
  model.sourcePreview.files.map((file) => file.path),
  ['internal/proxy/client.go', 'internal/proxy/config.go'],
);
assert.equal(model.sourcePreview.files[0]?.content.includes('HandleModels'), true);
assert.equal(model.sections[0]?.blocks.some((block) => block.type === 'list'), true);
assert.equal(model.sections[0]?.blocks.some((block) => block.type === 'table'), true);
assert.equal(model.sections[0]?.blocks.some((block) => block.type === 'code'), true);
assert.equal(model.sections.some((section) => section.heading === 'Runtime behavior'), true);
assert.deepEqual(model.summaryCards.map((card) => card.label), ['Source files', 'Sections', 'Code preview']);
assert.equal(model.fileTable[0]?.path, 'internal/proxy/client.go');

const architectureModelWithoutMermaid = buildDocsReaderModel({
  docs: {
    projectId: 'project-12345678',
    version: 2,
    pages: [
      {
        slug: 'architecture',
        title: 'Architecture',
        content: [
          '## Architecture',
          '',
          '### Application flow',
          '',
          '```mermaid',
          'flowchart LR',
          '  Client --> Handler',
          '  Handler --> Upstream',
          '```',
        ].join('\n'),
      },
    ],
    sidebar: [{ title: 'Architecture', slug: 'architecture', children: [] }],
  },
  activeSlug: 'architecture',
});

assert.equal(architectureModelWithoutMermaid.sections[0]?.blocks.length, 0);

console.log('docsViewModel tests passed');
