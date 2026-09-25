import catalog from "@/data/books.json";
import type { Book } from "@/lib/catalog";
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
        Explore the supplied book catalog, calculated points and total-only
        reporting. This preview does not save or publish data.
      </PageIntro>
      <ReportForm
        books={catalog as Book[]}
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
