import { SectionCard } from "@/components/ui/section-card";

type EmployeeDetailSectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function EmployeeDetailSection(props: EmployeeDetailSectionProps) {
  return <SectionCard {...props} />;
}
