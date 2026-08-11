import type { RuleBreak } from "@/game/types";

export const STARTING_POT = 100_000;
/** Anzahl spielbarer Tage. Der Tag danach ist die Abschlusszeremonie. */
export const TOTAL_DAYS = 9;
export const FINALE_DAY = TOTAL_DAYS + 1;

export const RULE_BREAK_COST: Record<RuleBreak, number> = {
  solo: 2_000,
  kuss: 3_000,
  petting: 6_000,
  sex: 20_000,
};

export const RULE_BREAK_LABEL: Record<RuleBreak, string> = {
  solo: "Selbstbefriedigung",
  kuss: "Kuss",
  petting: "Heavy Petting",
  sex: "Sex",
};

export const RULES = [
  {
    icon: "🚫💋",
    title: "Kein Küssen",
    text: `Jeder Kuss kostet die Gruppe ${RULE_BREAK_COST.kuss.toLocaleString("de-DE")} €. Ja, auch der kurze. Ja, auch der, den ihr für unbeobachtet haltet.`,
  },
  {
    icon: "🚫🤲",
    title: "Kein Heavy Petting",
    text: `${RULE_BREAK_COST.petting.toLocaleString("de-DE")} € pro Vorfall. Die Definition ist absichtlich weit gefasst.`,
  },
  {
    icon: "🚫🛏️",
    title: "Kein Sex",
    text: `${RULE_BREAK_COST.sex.toLocaleString("de-DE")} €. Ein Fünftel des Preisgeldes. In einer Nacht.`,
  },
  {
    icon: "🚫🙋",
    title: "Keine Selbstbefriedigung",
    text: `${RULE_BREAK_COST.solo.toLocaleString("de-DE")} €. Lana sieht alles. Lana ist überall.`,
  },
  {
    icon: "🟢",
    title: "Grünes Licht",
    text: "Wer echte emotionale Reife zeigt, bekommt von Lana grünes Licht. Dann ist ein Kuss kostenlos. Das passiert selten. Aus gutem Grund.",
  },
  {
    icon: "🏆",
    title: "Das Preisgeld",
    text: `Ihr startet mit ${STARTING_POT.toLocaleString("de-DE")} €. Am letzten Tag entscheidet Lana, wer davon etwas sieht – und ob überhaupt jemand.`,
  },
];

export function formatMoney(value: number): string {
  return `${Math.round(value).toLocaleString("de-DE")} €`;
}
