import { PageHeader } from "@/components/shared/page-header";
import { ResourceEmptyState } from "@/components/shared/resource-state";

type PlannedModulePlaceholderProps = {
  title: string;
  description: string;
};

export function PlannedModulePlaceholder({
  title,
  description,
}: PlannedModulePlaceholderProps) {
  return (
    <>
      <PageHeader title={title} description={description} eyebrow="Workspace" />

      <section className="panel p-6 sm:p-7">
        <ResourceEmptyState
          title="Module content pending"
          description="This view is intentionally blank for now while we decide which tables, actions, and workflow states belong here."
        />
      </section>
    </>
  );
}
