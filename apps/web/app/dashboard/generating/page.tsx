import { GeneratingDashboard } from '@/components/dashboard/DashboardClient';

export default function DashboardGeneratingPage({ searchParams }: { searchParams?: { projectId?: string } }) {
  return <GeneratingDashboard projectId={searchParams?.projectId} />;
}
