
import { PageIntro } from "@/components/ui";
import { ReportForm } from "@/components/report-form";
export const metadata = {
  title: "Reporting preview",
  robots: { index: false, follow: false },
};
export default function Preview() {
  return (
    <div className="container workspace">
      <PageIntro eyebrow="Reporting preview" title="Try the distribution form">
        Enter weekly quantities to preview the book and set totals.
      </PageIntro>
      <ReportForm

        temples={[]}
        campaigns={[]}
        centres={[]}
        individuals={[]}
        teams={[]}
        preview
      />
    </div>
  );
}
