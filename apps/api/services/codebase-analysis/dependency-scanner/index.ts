import type { ConfigFileCandidate } from '../folder-scanner';
import fs from 'fs/promises';
import path from 'path';

export interface DependencyScannerInput {
  projectId: string;
  sourcePath: string;
  configCandidates: ConfigFileCandidate[];
}

export interface DependencyScannerOutput {
  dependencies: Record<string, string>;
}

export interface DependencyScannerContract {
  scan(input: DependencyScannerInput): Promise<DependencyScannerOutput>;
}

export class DependencyScanner implements DependencyScannerContract {
  async scan(input: DependencyScannerInput): Promise<DependencyScannerOutput> {
    const dependencies: Record<string, string> = {};

    for (const candidate of input.configCandidates) {
      const absolutePath = path.join(input.sourcePath, candidate.path);
      const raw = await fs.readFile(absolutePath, 'utf-8');

      if (candidate.type === 'package.json') {
        const json = JSON.parse(raw) as {
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
          peerDependencies?: Record<string, string>;
          optionalDependencies?: Record<string, string>;
        };

        Object.assign(
          dependencies,
          json.dependencies ?? {},
          json.devDependencies ?? {},
          json.peerDependencies ?? {},
          json.optionalDependencies ?? {},
        );
        continue;
      }

      if (candidate.type === 'requirements.txt') {
        for (const line of raw.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const [name, version] = trimmed.split(/==|>=|<=|~=|>|</);
          if (name) {
            dependencies[name.trim()] = version?.trim() ?? '*';
          }
        }
      }

      if (candidate.type === 'go.mod') {
        for (const line of raw.split(/\r?\n/)) {
          const trimmed = line.trim().replace(/^require\s+/, '');
          const match = trimmed.match(/^([^\s]+)\s+(v[^\s]+)$/);
          if (match?.[1] && match[2]) dependencies[match[1]] = match[2];
        }
      }

      if (candidate.type === 'Gemfile') {
        for (const line of raw.split(/\r?\n/)) {
          const match = line.trim().match(/^gem\s+['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?/);
          if (match?.[1]) dependencies[match[1]] = match[2] ?? '*';
        }
      }

      if (candidate.type === 'Cargo.toml') {
        let inDependencies = false;
        for (const line of raw.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (trimmed === '[dependencies]') {
            inDependencies = true;
            continue;
          }
          if (trimmed.startsWith('[') && trimmed !== '[dependencies]') inDependencies = false;
          if (!inDependencies || !trimmed || trimmed.startsWith('#')) continue;

          const match = trimmed.match(/^([A-Za-z0-9_-]+)\s*=\s*(?:"([^"]+)"|\{\s*version\s*=\s*"([^"]+)")/);
          if (match?.[1]) dependencies[match[1]] = match[2] ?? match[3] ?? '*';
        }
      }

      if (candidate.type === 'pom.xml') {
        const dependencyBlocks = raw.match(/<dependency>[\s\S]*?<\/dependency>/g) ?? [];
        for (const block of dependencyBlocks) {
          const groupId = block.match(/<groupId>(.*?)<\/groupId>/)?.[1]?.trim();
          const artifactId = block.match(/<artifactId>(.*?)<\/artifactId>/)?.[1]?.trim();
          const version = block.match(/<version>(.*?)<\/version>/)?.[1]?.trim();
          if (groupId && artifactId) dependencies[`${groupId}:${artifactId}`] = version ?? '*';
        }
      }
    }

    return {
      dependencies,
    };
  }
}

export class DependencyScannerStub extends DependencyScanner {}
