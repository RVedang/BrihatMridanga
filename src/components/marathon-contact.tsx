import { contactName, phoneLink, type MarathonTemple } from "@/lib/marathon";
export function MarathonContact({ temple }: { temple: MarathonTemple }) {
  return (
    <div>
      <p>
        {temple.city}, {temple.country}
      </p>
      {temple.spoc && <p>{contactName(temple.spoc)}</p>}
      {temple.email && (
        <p>
          <a href={"mailto:" + temple.email}>{temple.email}</a>
        </p>
      )}
      {temple.phone && (
        <p>
          <a href={phoneLink(temple)}>{temple.phone}</a>
        </p>
      )}
      {!temple.phone && !temple.email && <p>Contact details pending.</p>}
    </div>
  );
}
