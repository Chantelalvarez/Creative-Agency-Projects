import { StructuredBrief } from "@/lib/types";

const FIELDS: {
  key: keyof StructuredBrief;
  label: string;
  wide?: boolean;
}[] = [
  { key: "clientBackground", label: "Client Background", wide: true },
  { key: "projectScope", label: "Project Scope" },
  { key: "brandName", label: "Brand Name" },
  { key: "brandImage", label: "Brand Image" },
  { key: "targetAudience", label: "Target Audience" },
  { key: "colourDirection", label: "Colour Direction" },
  { key: "competitorBrands", label: "Competitors Mentioned" },
  { key: "lookAndFeel", label: "Look & Feel", wide: true },
  { key: "deliverables", label: "Deliverables" },
  { key: "timeline", label: "Timeline" },
  { key: "otherNotes", label: "Other Notes", wide: true },
];

export default function BriefDisplay({ brief }: { brief: StructuredBrief }) {
  const filled = FIELDS.filter((f) => brief[f.key]?.trim());

  return (
    <div className="grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {filled.map(({ key, label, wide }) => (
        <div key={key} className={wide ? "sm:col-span-2 lg:col-span-3" : ""}>
          <p className="font-mono text-[10px] text-cream-muted/50 uppercase tracking-widest mb-1.5">
            {label}
          </p>
          <p className="font-mono text-sm text-cream/90 leading-relaxed">
            {brief[key]}
          </p>
        </div>
      ))}
    </div>
  );
}
