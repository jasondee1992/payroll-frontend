import { SectionCard } from "@/components/ui/section-card";

type EmployeeFormSectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function EmployeeFormSection(props: EmployeeFormSectionProps) {
  return <SectionCard {...props} />;
}
