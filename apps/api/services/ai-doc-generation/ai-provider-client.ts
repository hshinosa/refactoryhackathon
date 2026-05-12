import type { GeneratedDocsPage } from '../../types';
import OpenAI from 'openai';
import { AIProviderFailureError } from '../../utils';

export interface AIGenerationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIGenerationRequest {
  projectId: string;
  model: string;
  messages: AIGenerationMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AIGenerationResponse {
  projectId: string;
  model: string;
  content: string;
  generatedAt: string;
}

export interface OpenAICompatibleAIClientContract {
  generateText(input: AIGenerationRequest): Promise<AIGenerationResponse>;
}

export interface AIDocumentGenerationOutput {
  pages: GeneratedDocsPage[];
}

export class OpenAICompatibleAIClient implements OpenAICompatibleAIClientContract {
  constructor(
    private readonly client: Pick<OpenAI, 'chat'>,
  ) {}

  async generateText(input: AIGenerationRequest): Promise<AIGenerationResponse> {
    let response: Awaited<ReturnType<typeof this.client.chat.completions.create>>;
    try {
      response = await this.client.chat.completions.create({
        model: input.model,
        messages: input.messages,
        temperature: input.temperature,
        max_tokens: input.maxTokens,
      });
    } catch {
      throw new AIProviderFailureError('AI provider request failed');
    }

    return {
      projectId: input.projectId,
      model: input.model,
      content: response.choices[0]?.message?.content ?? '',
      generatedAt: new Date().toISOString(),
    };
  }
}

export class OpenAICompatibleAIClientStub implements OpenAICompatibleAIClientContract {
  async generateText(input: AIGenerationRequest): Promise<AIGenerationResponse> {
    return {
      projectId: input.projectId,
      model: input.model,
      content: [
        '# Documentation (stub)',
        '',
        'TODO: Replace stubbed AI generation with OpenAI-compatible provider call',
        'after Wave 1 analysis + context assembly is finalized.',
      ].join('\n'),
      generatedAt: new Date().toISOString(),
    };
  }
}
