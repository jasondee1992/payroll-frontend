import { PageHeader } from "@/components/shared/page-header";

type PageIntroProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function PageIntro({
  title,
  description,
  eyebrow = "Payroll management",
}: PageIntroProps) {
  return <PageHeader title={title} description={description} eyebrow={eyebrow} />;
}
