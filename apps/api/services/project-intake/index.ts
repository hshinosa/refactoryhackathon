import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
  type CipherGCM,
  type DecipherGCM,
} from 'node:crypto';

import { getBackendConfig } from '../../config';
import { InvalidGitHubRepositoryUrlError, InvalidPATError, InvalidZipUploadError } from '../../utils';
import type {
  CreateProjectInput,
  DeleteUserPATInput,
  Project,
  ResolveUserPATInput,
  ResolvedUserPAT,
  RevokeUserPATInput,
  SessionIdentity,
  StoreUserPATInput,
  UserPAT,
} from '../../types';

const projectsByUser = new Map<string, Project[]>();
const patsByUser = new Map<string, UserPAT[]>();

export const GITHUB_REPOSITORY_URL_PATTERN = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/?#]+?)(?:\.git)?\/?$/i;

export interface ZipUploadIntakeInput {
  fileName: string;
  fileSizeBytes: number;
  mimeType?: string;
}

export interface GitHubRepositoryIntakeInput {
  repositoryUrl: string;
}

export interface ValidatedZipUploadIntake {
  fileName: string;
  fileSizeBytes: number;
  sourceType: 'zip';
}

export interface ValidatedGitHubRepositoryIntake {
  repositoryUrl: string;
  sourceType: 'github';
}

export function validateZipUploadIntake(input: ZipUploadIntakeInput): ValidatedZipUploadIntake {
  const config = getBackendConfig();
  const normalizedFileName = input.fileName.trim();

  if (!normalizedFileName) {
    throw new InvalidZipUploadError('ZIP file name is required');
  }

  if (!normalizedFileName.toLowerCase().endsWith('.zip')) {
    throw new InvalidZipUploadError('Only .zip files are accepted');
  }

  if (!Number.isFinite(input.fileSizeBytes) || input.fileSizeBytes <= 0) {
    throw new InvalidZipUploadError('ZIP file size must be a positive number');
  }

  if (input.fileSizeBytes > config.upload.maxZipSize) {
    throw new InvalidZipUploadError(`ZIP file exceeds maximum allowed size of ${config.upload.maxZipSize} bytes`);
  }

  return {
    fileName: normalizedFileName,
    fileSizeBytes: input.fileSizeBytes,
    sourceType: 'zip',
  };
}

export function validateGitHubRepositoryIntake(input: GitHubRepositoryIntakeInput): ValidatedGitHubRepositoryIntake {
  const normalizedUrl = input.repositoryUrl.trim();

  if (!normalizedUrl) {
    throw new InvalidGitHubRepositoryUrlError('GitHub repository URL is required');
  }

  if (!GITHUB_REPOSITORY_URL_PATTERN.test(normalizedUrl)) {
    throw new InvalidGitHubRepositoryUrlError('Invalid GitHub repository URL');
  }

  return {
    repositoryUrl: normalizedUrl,
    sourceType: 'github',
  };
}

function assertValidProjectInput(input: CreateProjectInput): void {
  if (!input.name?.trim()) {
    throw new Error('Project name is required');
  }

  if (!input.sourceInput?.trim()) {
    throw new Error('Project source input is required');
  }

  if (input.sourceType !== 'zip' && input.sourceType !== 'github') {
    throw new Error('Invalid project source type');
  }

  if (input.sourceType === 'github') {
    validateGitHubRepositoryIntake({ repositoryUrl: input.sourceInput });
  }
}

export interface ProjectIntakeServiceContract {
  createProject(input: {
    userId: string;
    name: string;
    sourceType: 'zip' | 'github';
    sourceInput: string;
  }): Promise<{ projectId: string }>;
  validateZipUpload(input: ZipUploadIntakeInput): Promise<ValidatedZipUploadIntake>;
  validateGitHubRepository(input: GitHubRepositoryIntakeInput): Promise<ValidatedGitHubRepositoryIntake>;
}

function deriveEncryptionKey(secretKey: string): Buffer {
  return createHash('sha256').update(secretKey).digest();
}

function encryptPAT(pat: string): Pick<UserPAT, 'encryptedPAT' | 'ivHex' | 'authTagHex'> {
  const config = getBackendConfig();
  const iv = randomBytes(16);
  const key = deriveEncryptionKey(config.encryption.secretKey);
  const cipher = createCipheriv(config.encryption.algorithm, key, iv) as CipherGCM;

  const encrypted = Buffer.concat([cipher.update(pat, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedPAT: encrypted.toString('hex'),
    ivHex: iv.toString('hex'),
    authTagHex: authTag.toString('hex'),
  };
}

function decryptPAT(record: UserPAT): string {
  const config = getBackendConfig();
  const key = deriveEncryptionKey(config.encryption.secretKey);
  const decipher = createDecipheriv(
    config.encryption.algorithm,
    key,
    Buffer.from(record.ivHex, 'hex'),
  ) as DecipherGCM;
  decipher.setAuthTag(Buffer.from(record.authTagHex, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(record.encryptedPAT, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export async function storePATForUser(input: StoreUserPATInput): Promise<{ patId: string }> {
  if (!input.userId.trim()) {
    throw new Error('User ID is required');
  }

  if (!input.pat.trim()) {
    throw new InvalidPATError('PAT is required');
  }

  const now = new Date().toISOString();
  const patId = randomUUID();
  const encrypted = encryptPAT(input.pat.trim());

  const record: UserPAT = {
    id: patId,
    userId: input.userId,
    githubUsername: input.githubUsername?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
    ...encrypted,
  };

  const existing = patsByUser.get(input.userId) ?? [];
  existing.push(record);
  patsByUser.set(input.userId, existing);

  return { patId };
}

export async function resolveStoredPATForUser(
  input: ResolveUserPATInput,
): Promise<ResolvedUserPAT | null> {
  const existing = patsByUser.get(input.userId) ?? [];
  const record = input.patId
    ? existing.find((item) => item.id === input.patId && !item.revokedAt)
    : existing.find((item) => !item.revokedAt);

  if (!record) {
    return null;
  }

  record.lastUsedAt = new Date().toISOString();
  record.updatedAt = record.lastUsedAt;

  return {
    patId: record.id,
    pat: decryptPAT(record),
    githubUsername: record.githubUsername,
  };
}

export async function revokeStoredPATForUser(input: RevokeUserPATInput): Promise<boolean> {
  const existing = patsByUser.get(input.userId) ?? [];
  const record = existing.find((item) => item.id === input.patId && !item.revokedAt);

  if (!record) {
    return false;
  }

  const now = new Date().toISOString();
  record.revokedAt = now;
  record.updatedAt = now;
  return true;
}

export async function deleteStoredPATForUser(input: DeleteUserPATInput): Promise<boolean> {
  const existing = patsByUser.get(input.userId) ?? [];
  const next = existing.filter((item) => item.id !== input.patId);

  if (next.length === existing.length) {
    return false;
  }

  patsByUser.set(input.userId, next);
  return true;
}

export function createProjectForUser(identity: SessionIdentity, input: CreateProjectInput): Project {
  assertValidProjectInput(input);

  const now = new Date().toISOString();
  const project: Project = {
    id: randomUUID(),
    userId: identity.userId,
    ownership: {
      ownerUserId: identity.userId,
      createdBy: identity.userId,
    },
    name: input.name.trim(),
    sourceType: input.sourceType,
    sourceInput: input.sourceInput.trim(),
    status: 'queued',
    createdAt: now,
    updatedAt: now,
  };

  const currentProjects = projectsByUser.get(identity.userId) ?? [];
  currentProjects.push(project);
  projectsByUser.set(identity.userId, currentProjects);

  return project;
}

export function listProjectsForUser(identity: SessionIdentity): Project[] {
  return projectsByUser.get(identity.userId) ?? [];
}
