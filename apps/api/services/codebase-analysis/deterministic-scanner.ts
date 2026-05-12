import type { RawScanResult } from '../../types';
import type { DependencyScannerContract } from './dependency-scanner';
import type { FolderScannerContract } from './folder-scanner';

export interface DeterministicScannerInput {
  projectId: string;
  sourcePath: string;
}

export interface DeterministicScannerContract {
  scan(input: DeterministicScannerInput): Promise<RawScanResult>;
}

export interface DeterministicScannerDependencies {
  folderScanner: FolderScannerContract;
  dependencyScanner: DependencyScannerContract;
}

export class DeterministicScanner implements DeterministicScannerContract {
  constructor(private readonly deps: DeterministicScannerDependencies) {}

  async scan(input: DeterministicScannerInput): Promise<RawScanResult> {
    const startedAt = Date.now();
    const folderScan = await this.deps.folderScanner.scan({
      projectId: input.projectId,
      sourcePath: input.sourcePath,
    });

    const dependencyScan = await this.deps.dependencyScanner.scan({
      projectId: input.projectId,
      sourcePath: input.sourcePath,
      configCandidates: folderScan.configCandidates,
    });

    return {
      projectId: input.projectId,
      fileCount: folderScan.fileTree.filter((entry) => entry.kind === 'file').length,
      folderStructure: folderScan.folderStructure,
      configFiles: folderScan.configCandidates.map((candidate) => ({
        path: candidate.path,
        type: candidate.type,
      })),
      dependencies: dependencyScan.dependencies,
      filePaths: folderScan.fileTree
        .filter((entry) => entry.kind === 'file')
        .map((entry) => entry.path)
        .sort((a, b) => a.localeCompare(b)),
      excludedPaths: folderScan.excludedPaths,
      scanDuration: Date.now() - startedAt,
    };
  }
}

export class DeterministicScannerStub extends DeterministicScanner {}
