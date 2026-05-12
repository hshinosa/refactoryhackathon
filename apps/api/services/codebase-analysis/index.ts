import type { CodebaseAnalysis, RawScanResult } from '../../types';
import type { AgentEnrichmentBoundaryContract } from './enrichment-boundary';

export interface CodebaseAnalysisServiceContract {
  runDeterministicScan(input: { projectId: string; sourcePath: string }): Promise<RawScanResult>;
  enrichAnalysis(input: { projectId: string; rawScan: RawScanResult }): Promise<CodebaseAnalysis>;
  analyze(input: { projectId: string; sourcePath: string }): Promise<CodebaseAnalysis>;
}

export interface DeterministicScannerContract {
  scan(input: { projectId: string; sourcePath: string }): Promise<RawScanResult>;
}

export interface CodebaseAnalysisServiceDependencies {
  deterministicScanner: DeterministicScannerContract;
  enrichmentBoundary: AgentEnrichmentBoundaryContract;
}

export class CodebaseAnalysisService implements CodebaseAnalysisServiceContract {
  constructor(private readonly deps: CodebaseAnalysisServiceDependencies) {}

  async runDeterministicScan(input: { projectId: string; sourcePath: string }): Promise<RawScanResult> {
    return this.deps.deterministicScanner.scan(input);
  }

  async enrichAnalysis(input: { projectId: string; rawScan: RawScanResult }): Promise<CodebaseAnalysis> {
    const enriched = await this.deps.enrichmentBoundary.enrich(input);

    return {
      ...input.rawScan,
      ...enriched,
      completedAt: new Date().toISOString(),
    };
  }

  async analyze(input: { projectId: string; sourcePath: string }): Promise<CodebaseAnalysis> {
    const rawScan = await this.runDeterministicScan(input);
    return this.enrichAnalysis({
      projectId: input.projectId,
      rawScan,
    });
  }
}

export * from './folder-scanner';
export * from './dependency-scanner';
export * from './deterministic-scanner';
export * from './tech-stack-detector';
export * from './exclude-filter';
export * from './context-builder';
export * from './enrichment-boundary';
