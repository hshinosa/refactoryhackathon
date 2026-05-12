import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import AdmZip from 'adm-zip';
import simpleGit from 'simple-git';

import { getBackendConfig } from '../../config';
import type {
  GitHubClonePreparationInput,
  GitHubClonePreparationResult,
  IngestionJob,
  UserPATStorageContract,
} from '../../types';
import { InaccessibleRepositoryError } from '../../utils';

import { validateGitHubRepositoryIntake } from '../project-intake';

export interface SourceIngestionServiceContract {
  ingestFromZip(input: { projectId: string; zipPath: string }): Promise<{ tempPath: string }>;
  ingestFromGitHub(input: { projectId: string; repositoryUrl: string; patRef?: string }): Promise<{ tempPath: string }>;
}

export interface TempSourcePaths {
  rootPath: string;
  sourcePath: string;
  cleanupAt: number;
}

export interface SourceCleanupSchedule {
  projectId: string;
  tempPath: string;
  cleanupAt: number;
  reason: 'success' | 'failure' | 'ttl-expired';
}

export interface PrivateRepositoryClonePreparationContract {
  prepareGitHubClone(input: GitHubClonePreparationInput): Promise<GitHubClonePreparationResult>;
}

export class PrivateRepositoryClonePreparationService implements PrivateRepositoryClonePreparationContract {
  constructor(private readonly patStorage: UserPATStorageContract) {}

  async prepareGitHubClone(input: GitHubClonePreparationInput): Promise<GitHubClonePreparationResult> {
    const validatedRepo = validateGitHubRepositoryIntake({ repositoryUrl: input.repositoryUrl });

    if (input.providedPAT?.trim()) {
      return {
        repositoryUrl: validatedRepo.repositoryUrl,
        isPrivateClone: true,
        resolvedPAT: input.providedPAT.trim(),
        resolvedFrom: 'provided',
      };
    }

    const resolved = await this.patStorage.resolvePATForUser({
      userId: input.userId,
      patId: input.storedPatId,
    });

    if (input.storedPatId && !resolved) {
      throw new InaccessibleRepositoryError('Repository is not accessible with the provided or stored credentials');
    }

    if (!resolved) {
      return {
        repositoryUrl: validatedRepo.repositoryUrl,
        isPrivateClone: false,
        resolvedFrom: 'none',
      };
    }

    return {
      repositoryUrl: validatedRepo.repositoryUrl,
      isPrivateClone: true,
      resolvedPAT: resolved.pat,
      resolvedFrom: 'stored',
      resolvedPatId: resolved.patId,
    };
  }
}

export function createTempSourcePaths(input: {
  projectId: string;
  sourceType: 'zip' | 'github';
  now?: number;
}): TempSourcePaths {
  const config = getBackendConfig();
  const baseTimestamp = input.now ?? Date.now();
  const rootPath = path.join(config.storage.tempPath, input.projectId, String(baseTimestamp));

  return {
    rootPath,
    sourcePath: path.join(rootPath, input.sourceType === 'zip' ? 'extracted' : 'repo'),
    cleanupAt: baseTimestamp + config.storage.cleanupTTL,
  };
}

export async function ensureTempSourcePath(paths: TempSourcePaths): Promise<void> {
  await fs.mkdir(paths.sourcePath, { recursive: true });
}

export async function extractZipToTempStorage(input: {
  zipFilePath: string;
  outputPath: string;
}): Promise<void> {
  const archive = new AdmZip(input.zipFilePath);
  await fs.mkdir(input.outputPath, { recursive: true });
  archive.extractAllTo(input.outputPath, true);
}

export async function cleanupSourcePath(tempPath: string): Promise<void> {
  await fs.rm(tempPath, { recursive: true, force: true });
}

export async function cloneGitHubRepositoryToTempStorage(input: {
  repositoryUrl: string;
  outputPath: string;
  pat?: string;
}): Promise<void> {
  const credentials = input.pat ? await createGitAskPassEnvironment(input.pat) : null;
  await fs.mkdir(path.dirname(input.outputPath), { recursive: true });
  try {
    const git = credentials ? simpleGit().env(credentials.env) : simpleGit();
    await git.clone(input.repositoryUrl, input.outputPath, ['--depth', '1']);
  } catch {
    throw new InaccessibleRepositoryError('Repository is not accessible with the provided or stored credentials');
  } finally {
    if (credentials) {
      await fs.rm(credentials.rootPath, { recursive: true, force: true });
    }
  }
}

async function createGitAskPassEnvironment(pat: string): Promise<{ env: Record<string, string>; rootPath: string }> {
  const rootPath = await fs.mkdtemp(path.join(os.tmpdir(), 'codebase-wiki-git-askpass-'));
  const tokenPath = path.join(rootPath, 'token');
  const askPassPath = path.join(rootPath, 'askpass.sh');
  await fs.writeFile(tokenPath, pat, { mode: 0o600 });
  await fs.writeFile(
    askPassPath,
    [
      '#!/bin/sh',
      'case "$1" in',
      '  *Username*) printf "%s" "x-access-token" ;;',
      `  *Password*) cat ${shellQuote(tokenPath)} ;;`,
      '  *) printf "%s" "" ;;',
      'esac',
      '',
    ].join('\n'),
    { mode: 0o700 },
  );

  return {
    rootPath,
    env: {
      ...process.env,
      GIT_ASKPASS: askPassPath,
      GIT_TERMINAL_PROMPT: '0',
    } as Record<string, string>,
  };
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

export function isCleanupExpired(cleanupAt: number, now = Date.now()): boolean {
  return cleanupAt <= now;
}

export function createCleanupSchedule(input: {
  projectId: string;
  tempPath: string;
  cleanupAt: number;
  reason: 'success' | 'failure' | 'ttl-expired';
}): SourceCleanupSchedule {
  return input;
}

export function createIngestionJob(input: {
  projectId: string;
  sourceType: 'zip' | 'github';
  tempStoragePath: string;
  status?: IngestionJob['status'];
}): IngestionJob {
  return {
    projectId: input.projectId,
    sourceType: input.sourceType,
    tempStoragePath: input.tempStoragePath,
    status: input.status ?? (input.sourceType === 'zip' ? 'extracting' : 'cloning'),
    startedAt: new Date().toISOString(),
  };
}
