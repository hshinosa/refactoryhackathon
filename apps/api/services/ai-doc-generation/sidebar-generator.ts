import type { GeneratedDocsPage, GeneratedSidebarItem } from '../../types';

export interface SidebarGenerationContract {
  generateSidebar(input: { projectId: string; pages: GeneratedDocsPage[] }): GeneratedSidebarItem[];
}

export class SidebarGeneratorStub implements SidebarGenerationContract {
  generateSidebar(input: { projectId: string; pages: GeneratedDocsPage[] }): GeneratedSidebarItem[] {
    return input.pages.map((page) => ({
      title: page.title,
      slug: page.slug,
      children: [],
    }));
  }
}

export class FlatSidebarGeneratorStub implements SidebarGenerationContract {
  generateSidebar(input: { projectId: string; pages: GeneratedDocsPage[] }): GeneratedSidebarItem[] {
    return input.pages.map((page) => ({
      title: page.title,
      slug: page.slug,
      children: [],
    }));
  }
}
