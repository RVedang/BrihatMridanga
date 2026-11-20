import { marathonPublicDirectory } from "@/lib/marathon-data";
import { PageIntro } from "@/components/ui";
import { TempleDirectory } from "./temple-directory";
export const metadata = { title: "Participating Temples" };
export default async function ParticipatingTemples() {
  const temples = await marathonPublicDirectory();
  return (
    <div className="container">
      <PageIntro
        title="Participating Temples"
        eyebrow="Book Distribution Marathon 2026"
      />
      <TempleDirectory temples={temples} />
    </div>
  );
}
