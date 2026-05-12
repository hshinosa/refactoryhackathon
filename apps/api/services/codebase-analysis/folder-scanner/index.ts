import type { RawScanResult } from '../../../types';
import type { ExcludeFilterContract } from '../exclude-filter';
import fs from 'fs/promises';
import path from 'path';

export interface FileTreeNode {
  path: string;
  kind: 'file' | 'directory';
}

export interface ConfigFileCandidate {
  path: string;
  type: RawScanResult['configFiles'][number]['type'];
}

export interface FolderScannerInput {
  projectId: string;
  sourcePath: string;
}

export interface FolderScannerOutput {
  fileTree: FileTreeNode[];
  folderStructure: string[];
  configCandidates: ConfigFileCandidate[];
  excludedPaths: string[];
}

export interface FolderScannerContract {
  scan(input: FolderScannerInput): Promise<FolderScannerOutput>;
}

export interface FolderScannerDependencies {
  excludeFilter: ExcludeFilterContract;
}

export class FolderScanner implements FolderScannerContract {
  constructor(private readonly deps: FolderScannerDependencies) {}

  async scan(input: FolderScannerInput): Promise<FolderScannerOutput> {
    const fileTree: FileTreeNode[] = [];
    const folderSet = new Set<string>();
    const configCandidates: ConfigFileCandidate[] = [];
    const excludedPaths = new Set<string>();

    await this.walk({
      basePath: input.sourcePath,
      currentPath: input.sourcePath,
      fileTree,
      folderSet,
      configCandidates,
      excludedPaths,
    });

    return {
      fileTree,
      folderStructure: Array.from(folderSet).sort(),
      configCandidates: configCandidates.sort((a, b) => a.path.localeCompare(b.path)),
      excludedPaths: Array.from(excludedPaths).sort(),
    };
  }

  private async walk(input: {
    basePath: string;
    currentPath: string;
    fileTree: FileTreeNode[];
    folderSet: Set<string>;
    configCandidates: ConfigFileCandidate[];
    excludedPaths: Set<string>;
  }): Promise<void> {
    const entries = await fs.readdir(input.currentPath, { withFileTypes: true });
    const sortedEntries = [...entries].sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of sortedEntries) {
      const absolutePath = path.join(input.currentPath, entry.name);
      const relativePath = path.relative(input.basePath, absolutePath).replace(/\\/g, '/');

      if (!relativePath) {
        continue;
      }

      if (this.deps.excludeFilter.shouldExcludePath(relativePath)) {
        const topLevel = relativePath.split('/')[0] ?? relativePath;
        input.excludedPaths.add(topLevel);
        continue;
      }

      if (entry.isDirectory()) {
        input.fileTree.push({ path: relativePath, kind: 'directory' });
        input.folderSet.add(relativePath);
        await this.walk({
          ...input,
          currentPath: absolutePath,
        });
        continue;
      }

      input.fileTree.push({ path: relativePath, kind: 'file' });
      const configType = detectConfigType(relativePath);
      if (configType) {
        input.configCandidates.push({
          path: relativePath,
          type: configType,
        });
      }
    }
  }
}

export class FolderScannerStub extends FolderScanner {}

function detectConfigType(relativePath: string): RawScanResult['configFiles'][number]['type'] | null {
  const filename = relativePath.split('/').pop() ?? relativePath;

  switch (filename) {
    case 'package.json':
      return 'package.json';
    case 'tsconfig.json':
      return 'tsconfig.json';
    case 'requirements.txt':
      return 'requirements.txt';
    case 'go.mod':
      return 'go.mod';
    case 'Gemfile':
      return 'Gemfile';
    case 'pom.xml':
      return 'pom.xml';
    case 'Cargo.toml':
      return 'Cargo.toml';
    default:
      return null;
  }
}
