import { Router, Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

/**
 * Casting-Bewerbungen für "Blind Verliebt — Österreich".
 *
 * Speicher ist bewusst nur im Prozess: Bewerbungen enthalten personenbezogene
 * Daten und gehören in der Produktion in eine DSGVO-konforme Ablage mit
 * Löschfristen (siehe docs/KONZEPT.md, Abschnitt "Recht & Fürsorge").
 * Deshalb gibt es hier auch keinen Endpunkt, der Bewerbungen ausliest.
 */

export const castingRouter = Router();

const BUNDESLAENDER = [
  "Wien",
  "Niederösterreich",
  "Oberösterreich",
  "Steiermark",
  "Tirol",
  "Kärnten",
  "Salzburg",
  "Vorarlberg",
  "Burgenland",
] as const;

const bewerbungSchema = z.object({
  vorname: z.string().min(2).max(40),
  nachname: z.string().min(2).max(60),
  email: z.string().email(),
  alter: z.number().int().min(18).max(99),
  bundesland: z.enum(BUNDESLAENDER),
  sucht: z.enum(["frauen", "maenner", "alle"]),
  beruf: z.string().min(2).max(120),
  motivation: z.string().min(40).max(2000),
  dealbreaker: z.string().max(500).optional().default(""),
  bereitFuerHochzeit: z.literal(true, {
    errorMap: () => ({ message: "Ohne echte Heiratsabsicht ist eine Teilnahme nicht möglich." }),
  }),
  datenschutz: z.literal(true, {
    errorMap: () => ({ message: "Die Datenschutzerklärung muss akzeptiert werden." }),
  }),
});

export type Bewerbung = z.infer<typeof bewerbungSchema> & {
  id: string;
  eingegangenAm: string;
};

const bewerbungen = new Map<string, Bewerbung>();
const emailIndex = new Set<string>();

/** POST /casting/bewerbung — Bewerbung einreichen. */
castingRouter.post("/bewerbung", (req: Request, res: Response) => {
  const parsed = bewerbungSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Bewerbung unvollständig",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const email = parsed.data.email.toLowerCase();
  if (emailIndex.has(email)) {
    res.status(409).json({ error: "Für diese E-Mail-Adresse liegt bereits eine Bewerbung vor." });
    return;
  }

  const bewerbung: Bewerbung = {
    ...parsed.data,
    email,
    id: uuidv4(),
    eingegangenAm: new Date().toISOString(),
  };

  bewerbungen.set(bewerbung.id, bewerbung);
  emailIndex.add(email);

  console.log(`[casting] Neue Bewerbung ${bewerbung.id} aus ${bewerbung.bundesland}`);

  res.status(201).json({
    id: bewerbung.id,
    nachricht:
      `Danke, ${bewerbung.vorname}. Deine Bewerbung ist da. ` +
      `Wir melden uns innerhalb von 14 Tagen — auch dann, wenn es diesmal nicht passt.`,
    naechsterSchritt: "Videocall mit dem Casting-Team (ca. 30 Minuten)",
  });
});

/** GET /casting/statistik — nur aggregierte Zahlen, keine Personendaten. */
castingRouter.get("/statistik", (_req: Request, res: Response) => {
  const alle = Array.from(bewerbungen.values());
  const proBundesland: Record<string, number> = {};
  for (const b of alle) {
    proBundesland[b.bundesland] = (proBundesland[b.bundesland] ?? 0) + 1;
  }

  res.json({
    bewerbungen: alle.length,
    durchschnittsalter:
      alle.length > 0 ? Math.round(alle.reduce((s, b) => s + b.alter, 0) / alle.length) : 0,
    proBundesland,
  });
});

/** GET /casting/bundeslaender — Auswahlliste fürs Formular. */
castingRouter.get("/bundeslaender", (_req: Request, res: Response) => {
  res.json({ bundeslaender: BUNDESLAENDER });
});
