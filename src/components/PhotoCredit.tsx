import type { Dict } from "@/i18n/dictionaries";
import type { Activity } from "@/lib/types";

/** The licence's own page, e.g. "CC BY-SA 4.0" or "CC BY 3.0 rs"; undefined for one it cannot read. */
export function licenseUrl(license: string): string | undefined {
  if (license === "CC0") return "https://creativecommons.org/publicdomain/zero/1.0/";
  const match = /^CC (BY(?:-SA)?) (\d\.\d)(?: (\w+))?$/.exec(license);
  if (!match) return undefined;
  const [, kind, version, country] = match;
  return `https://creativecommons.org/licenses/${kind.toLowerCase()}/${version}/${country ? `${country}/` : ""}`;
}

const link = "underline underline-offset-2 hover:text-ink";

/** "Foto: Julian Nyča · CC BY-SA 3.0", with links to the original photo and to the licence. */
export default function PhotoCredit({ credit, t }: { credit: NonNullable<Activity["imageCredit"]>; t: Dict }) {
  const license = licenseUrl(credit.license);
  return (
    <>
      {t.credits.photo}:{" "}
      <a href={credit.source} target="_blank" rel="noopener noreferrer" className={link}>
        {credit.author}
      </a>
      {" · "}
      {license ? (
        <a href={license} target="_blank" rel="license noopener noreferrer" className={link}>
          {credit.license}
        </a>
      ) : (
        credit.license
      )}
    </>
  );
}
