import type { Metadata } from "next";
import Game from "@/components/Game";

export const metadata: Metadata = {
  title: "Retreat — Too Hot to Handle",
  description: "Neun Tage in der Villa. Deine Entscheidungen, Lanas Rechnung.",
};

export default function PlayPage() {
  return <Game />;
}
