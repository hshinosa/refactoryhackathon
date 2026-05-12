export interface BackendConfig {
  ai: {
    provider: 'openai';
    apiKey: string;
    baseURL: string;
    model: string;
    embeddingModel: string;
  };
  github: {
    cloneTimeout: number;
  };
  upload: {
    maxZipSize: number;
  };
  storage: {
    tempPath: string;
    cleanupTTL: number;
    docsPath: string;
    vectorIndexPath: string;
  };
  encryption: {
    algorithm: string;
    secretKey: string;
  };
}

const config: BackendConfig = {
  ai: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY || '',
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.AI_MODEL || 'gpt-4-turbo-preview',
    embeddingModel: process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small',
  },
  github: {
    cloneTimeout: parseInt(process.env.GITHUB_CLONE_TIMEOUT || '300000', 10),
  },
  upload: {
    maxZipSize: parseInt(process.env.MAX_ZIP_SIZE || '52428800', 10),
  },
  storage: {
    tempPath: process.env.TEMP_STORAGE_PATH || '/tmp/codebase-wiki',
    cleanupTTL: parseInt(process.env.CLEANUP_TTL || '1800000', 10),
    docsPath: process.env.DOCS_STORAGE_PATH || '/tmp/codebase-wiki-docs',
    vectorIndexPath: process.env.VECTOR_INDEX_PATH || '/tmp/codebase-wiki-index',
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    secretKey: process.env.ENCRYPTION_SECRET_KEY || '',
  },
};

export default config;
