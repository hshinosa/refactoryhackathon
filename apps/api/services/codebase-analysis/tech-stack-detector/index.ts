import type { RawScanResult } from '../../../types';

export interface TechStackDetectorInput {
  projectId: string;
  rawScan: RawScanResult;
}

export interface TechStackDetectorOutput {
  techStack: string[];
}

export interface TechStackDetectorContract {
  infer(input: TechStackDetectorInput): TechStackDetectorOutput;
}

export class TechStackDetectorFallback implements TechStackDetectorContract {
  infer(input: TechStackDetectorInput): TechStackDetectorOutput {
    const detected = new Set<string>();
    const configPaths = new Set(input.rawScan.configFiles.map((file) => file.path));
    const dependencies = Object.keys(input.rawScan.dependencies);
    const folderPaths = input.rawScan.folderStructure;

    if (configPaths.has('package.json') && dependencies.includes('next')) detected.add('Next.js');
    if (dependencies.includes('react') || dependencies.includes('react-dom')) detected.add('React');
    if (dependencies.includes('express')) detected.add('Express');
    if (dependencies.includes('tailwindcss')) detected.add('Tailwind CSS');
    if (configPaths.has('tsconfig.json') || dependencies.includes('typescript')) detected.add('TypeScript');
    if (dependencies.includes('next-auth') || dependencies.includes('@auth/core')) detected.add('Auth.js / NextAuth');
    if (configPaths.has('requirements.txt')) detected.add('Python');
    if (dependencies.includes('flask')) detected.add('Flask');
    if (dependencies.includes('fastapi')) detected.add('FastAPI');
    if (configPaths.has('go.mod')) detected.add('Go');
    if (configPaths.has('Gemfile')) detected.add('Ruby');
    if (dependencies.includes('rails')) detected.add('Rails');
    if (configPaths.has('Cargo.toml')) detected.add('Rust');
    if (configPaths.has('pom.xml')) detected.add('Java');
    if (folderPaths.some((folder) => folder === 'app' || folder.startsWith('app/'))) detected.add('App Router');

    if (detected.size === 0) {
      detected.add('unknown');
    }

    return {
      techStack: Array.from(detected),
    };
  }
}

export class TechStackDetectorFallbackStub extends TechStackDetectorFallback {}
