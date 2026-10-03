import {
  CheckCircleIcon,
  FlagIcon,
  LightBulbIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/16/solid";
import type { Idea } from "@/types";

export const STAGE_LABEL: Record<Idea["stage"], string> = {
  idea: "Pomysł",
  prototype: "Prototyp",
  pilot: "Pilotaż",
};

export const STATUS_LABEL: Record<Idea["status"], string> = {
  draft: "Szkic",
  submitted: "Wysłany",
  reviewed: "Oceniony",
};

export const STAGE_ICON = {
  idea: LightBulbIcon,
  prototype: WrenchScrewdriverIcon,
  pilot: FlagIcon,
} as const;

export const STATUS_ICON = {
  draft: PencilSquareIcon,
  submitted: PaperAirplaneIcon,
  reviewed: CheckCircleIcon,
} as const;
