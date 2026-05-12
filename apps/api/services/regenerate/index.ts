import { randomUUID } from 'node:crypto';

import type {
  Project,
  GitHubActionsRegenerateContract,
  GitHubActionsTriggerRequest,
  GitHubActionsTriggerResponse,
  RegenerateDocsRequest,
  RegenerateDocsResponse,
  RegenerateDocsEndpointRequest,
  RegenerateDocsEndpointResponse,
} from '../../types';

export interface RegenerateServiceContract {
  triggerRegeneration(input: RegenerateDocsRequest): Promise<RegenerateDocsResponse>;
}

export interface RegenerateEndpointContract {
  regenerateDocs(input: RegenerateDocsEndpointRequest): Promise<RegenerateDocsEndpointResponse>;
}

export interface RegenerateWorkflowTriggerContract extends GitHubActionsRegenerateContract {
  triggerFromWorkflow(input: GitHubActionsTriggerRequest): Promise<GitHubActionsTriggerResponse>;
}

export interface RegenerateProjectLookup {
  getProjectById(projectId: string): Promise<Project | null>;
}

export class RegenerateServiceStub implements RegenerateServiceContract {
  async triggerRegeneration(input: RegenerateDocsRequest): Promise<RegenerateDocsResponse> {
    return {
      projectId: input.projectId,
      jobId: randomUUID(),
      accepted: true,
    };
  }
}

export class RegenerateWorkflowTriggerStub implements RegenerateWorkflowTriggerContract {
  async triggerFromWorkflow(input: GitHubActionsTriggerRequest): Promise<GitHubActionsTriggerResponse> {
    return {
      accepted: true,
      projectId: input.projectId,
      queuedJobId: randomUUID(),
      triggerSource: 'github-actions',
    };
  }
}

export function createRegenerateDocsEndpointService(input: {
  triggerService: RegenerateServiceContract;
  getProjectById: RegenerateProjectLookup['getProjectById'];
}): RegenerateEndpointContract {
  return {
    async regenerateDocs(request: RegenerateDocsEndpointRequest): Promise<RegenerateDocsEndpointResponse> {
      const project = await input.getProjectById(request.projectId);

      if (!project) {
        throw new Error('Project not found');
      }

      if (project.ownership.ownerUserId !== request.requestedByUserId) {
        throw new Error('User does not own this project');
      }

      const result = await input.triggerService.triggerRegeneration({
        projectId: request.projectId,
        triggeredBy: request.triggeredBy,
      });

      return {
        ...result,
        requestedAt: new Date().toISOString(),
      };
    },
  };
}

export function createRegenerateWorkflowTriggerService(input: {
  triggerService: RegenerateServiceContract;
  getProjectById: RegenerateProjectLookup['getProjectById'];
}): RegenerateWorkflowTriggerContract {
  return {
    async triggerFromWorkflow(request: GitHubActionsTriggerRequest): Promise<GitHubActionsTriggerResponse> {
      const project = await input.getProjectById(request.projectId);

      if (!project) {
        throw new Error('Project not found');
      }

      if (project.sourceType !== 'github') {
        throw new Error('GitHub Actions regenerate requires a GitHub-backed project');
      }

      const result = await input.triggerService.triggerRegeneration({
        projectId: request.projectId,
        triggeredBy: 'github-actions',
      });

      return {
        accepted: true,
        projectId: result.projectId,
        queuedJobId: result.jobId,
        triggerSource: 'github-actions',
      };
    },
  };
}
