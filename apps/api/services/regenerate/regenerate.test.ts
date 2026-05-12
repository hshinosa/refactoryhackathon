import {
  createRegenerateDocsEndpointService,
  createRegenerateWorkflowTriggerService,
  RegenerateServiceStub,
} from './index';
import type { Project } from '../../types';

function createProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-1',
    userId: 'user-1',
    ownership: {
      ownerUserId: 'user-1',
      createdBy: 'user-1',
    },
    name: 'Demo Project',
    sourceType: 'github',
    sourceInput: 'https://github.com/example/repo',
    status: 'completed',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('regenerate flow', () => {
  test('manual regenerate accepts request for owned project', async () => {
    const triggerService = new RegenerateServiceStub();
    const endpoint = createRegenerateDocsEndpointService({
      triggerService,
      getProjectById: async () => createProject(),
    });

    const result = await endpoint.regenerateDocs({
      projectId: 'project-1',
      triggeredBy: 'manual',
      requestedByUserId: 'user-1',
    });

    expect(result.accepted).toBe(true);
    expect(result.projectId).toBe('project-1');
    expect(result.requestedAt).toBeTruthy();
    expect(result.jobId).toBeTruthy();
  });

  test('manual regenerate rejects request for project not owned by user', async () => {
    const triggerService = new RegenerateServiceStub();
    const endpoint = createRegenerateDocsEndpointService({
      triggerService,
      getProjectById: async () => createProject({
        ownership: {
          ownerUserId: 'another-user',
          createdBy: 'another-user',
        },
      }),
    });

    await expect(
      endpoint.regenerateDocs({
        projectId: 'project-1',
        triggeredBy: 'manual',
        requestedByUserId: 'user-1',
      }),
    ).rejects.toThrow('User does not own this project');
  });

  test('github actions trigger is accepted for github-backed project', async () => {
    const workflow = createRegenerateWorkflowTriggerService({
      triggerService: new RegenerateServiceStub(),
      getProjectById: async () => createProject({ sourceType: 'github' }),
    });

    const result = await workflow.triggerFromWorkflow({
      projectId: 'project-1',
      repository: 'example/repo',
      workflowRunId: 'run-1',
      ref: 'refs/heads/main',
      sha: 'abc123',
      actor: 'octocat',
    });

    expect(result.accepted).toBe(true);
    expect(result.projectId).toBe('project-1');
    expect(result.triggerSource).toBe('github-actions');
    expect(result.queuedJobId).toBeTruthy();
  });

  test('github actions trigger rejects non-github project', async () => {
    const workflow = createRegenerateWorkflowTriggerService({
      triggerService: new RegenerateServiceStub(),
      getProjectById: async () => createProject({ sourceType: 'zip' }),
    });

    await expect(
      workflow.triggerFromWorkflow({
        projectId: 'project-1',
        repository: 'example/repo',
        workflowRunId: 'run-1',
        ref: 'refs/heads/main',
        sha: 'abc123',
        actor: 'octocat',
      }),
    ).rejects.toThrow('GitHub Actions regenerate requires a GitHub-backed project');
  });
});
