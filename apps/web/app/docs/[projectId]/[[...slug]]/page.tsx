import { initializePostgresSchema, PostgresDocumentationStore, PostgresProjectStore } from '@codebase-wiki/api';
import { notFound, redirect } from 'next/navigation';
import { DocsReader } from '@/components/docs/DocsReader';
import { buildDocsReaderModel } from '@/components/docs/docsViewModel';
import { getRequiredSessionIdentity, UnauthorizedError } from '@/lib/auth/session';

export default async function DocsReaderPage({ params }: { params: { projectId: string; slug?: string[] } }) {
  let identity;
  try {
    identity = await getRequiredSessionIdentity();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect('/auth/sign-in');
    }
    throw error;
  }

  await initializePostgresSchema();
  const project = await new PostgresProjectStore().getProject(params.projectId);
  if (!project || project.ownership.ownerUserId !== identity.userId) {
    notFound();
  }

  const docs = await new PostgresDocumentationStore().getDocumentation(params.projectId);
  if (!docs) {
    notFound();
  }

  const activeSlug = params.slug?.at(-1);
  return (
    <DocsReader
      model={{
        ...buildDocsReaderModel({ docs, activeSlug }),
        viewer: {
          displayName: identity.name ?? identity.email ?? 'Account',
          nameInitial: (identity.name ?? identity.email ?? 'A').trim().charAt(0).toUpperCase() || 'A',
        },
      }}
    />
  );
}
