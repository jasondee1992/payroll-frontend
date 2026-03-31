import { SectionCard } from "@/components/ui/section-card";

type DashboardSectionProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardSection(props: DashboardSectionProps) {
  return <SectionCard {...props} descriptionClassName="text-slate-500" />;
}
