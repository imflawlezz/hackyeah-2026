import {
  INSTITUTION_TYPE_LABELS,
  MUNICIPALITY_TYPE_LABELS,
} from "@/lib/institutions/labels";
import type { InstitutionProfile } from "@/types";

const MAX_LENGTH = 2000;

/** The profile as one Polish problem description for the matcher. */
export function profileToProblem(profile: InstitutionProfile): string {
  const institution = [
    INSTITUTION_TYPE_LABELS[profile.institutionType],
    profile.municipalityType
      ? `gmina ${MUNICIPALITY_TYPE_LABELS[profile.municipalityType].toLowerCase()}`
      : "",
  ]
    .filter(Boolean)
    .join(", ");

  return [
    profile.need,
    `Wsparcie ma objąć: ${profile.targetGroup}.`,
    `Instytucja: ${institution}.`,
    profile.constraints ? `Ograniczenia: ${profile.constraints}` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, MAX_LENGTH);
}
