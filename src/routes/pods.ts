import { Router, Request, Response } from "express";
import { z } from "zod";
import {
  podErstellen,
  podHolen,
  podAnsicht,
  podZug,
  podZugStream,
  antragBeantworten,
  revealAnsicht,
  statusAktualisieren,
  podStatistik,
  POD_DAUER_SEKUNDEN,
} from "../services/pods";

export const podsRouter = Router();

const startSchema = z.object({
  vorname: z.string().min(1).max(40),
  praeferenz: z.enum(["frauen", "maenner", "alle"]),
  /** Bereits kennengelernte Rollen, damit ein neuer Pod jemand anderen bringt. */
  ausschluss: z.array(z.string()).optional().default([]),
});

const nachrichtSchema = z.object({
  message: z.string().min(1).max(2000),
  stream: z.boolean().optional().default(true),
});

const antragSchema = z.object({
  entscheidung: z.enum(["ja", "nein"]),
});

/** POST /pods — neues Pod-Date starten. */
podsRouter.post("/", (req: Request, res: Response) => {
  const parsed = startSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Anfrage", details: parsed.error.flatten() });
    return;
  }

  const pod = podErstellen({
    teilnehmerVorname: parsed.data.vorname.trim(),
    praeferenz: parsed.data.praeferenz,
    ausschluss: parsed.data.ausschluss,
  });

  res.status(201).json({
    ...podAnsicht(pod),
    personaId: pod.persona.id,
    dauerSekunden: POD_DAUER_SEKUNDEN,
  });
});

/** GET /pods/:podId — aktueller Stand eines Dates. */
podsRouter.get("/:podId", (req: Request, res: Response) => {
  const pod = podHolen(req.params.podId);
  if (!pod) {
    res.status(404).json({ error: "Pod nicht gefunden" });
    return;
  }
  res.json(podAnsicht(statusAktualisieren(pod)));
});

/** POST /pods/:podId/nachricht — eine Nachricht durch die Wand schicken. */
podsRouter.post("/:podId/nachricht", async (req: Request, res: Response) => {
  const pod = podHolen(req.params.podId);
  if (!pod) {
    res.status(404).json({ error: "Pod nicht gefunden" });
    return;
  }

  const parsed = nachrichtSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Anfrage", details: parsed.error.flatten() });
    return;
  }

  statusAktualisieren(pod);
  if (pod.status !== "offen") {
    res.status(409).json({
      error: "Dieses Date läuft nicht mehr.",
      status: pod.status,
    });
    return;
  }

  try {
    if (parsed.data.stream) {
      await podZugStream(pod, parsed.data.message, res);
      return;
    }

    const ergebnis = await podZug(pod, parsed.data.message);
    statusAktualisieren(pod);
    res.json({
      antwort: ergebnis.antwort || pod.antragText,
      ...podAnsicht(pod),
    });
  } catch (err) {
    console.error("[pods] Fehler:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Interner Fehler im Pod" });
    }
  }
});

/** POST /pods/:podId/antrag — auf den Antrag der Rolle antworten. */
podsRouter.post("/:podId/antrag", async (req: Request, res: Response) => {
  const pod = podHolen(req.params.podId);
  if (!pod) {
    res.status(404).json({ error: "Pod nicht gefunden" });
    return;
  }

  const parsed = antragSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Ungültige Anfrage", details: parsed.error.flatten() });
    return;
  }

  if (!pod.antragVonRolle) {
    res.status(409).json({ error: `${pod.persona.vorname} hat noch keinen Antrag gemacht.` });
    return;
  }

  if (pod.entscheidung) {
    res.status(409).json({ error: "Die Entscheidung ist schon gefallen.", entscheidung: pod.entscheidung });
    return;
  }

  try {
    const reaktion = await antragBeantworten(pod, parsed.data.entscheidung);
    res.json({
      reaktion,
      ...podAnsicht(pod),
      // Das Aussehen wird ausschließlich nach einem Ja freigegeben.
      reveal: parsed.data.entscheidung === "ja" ? revealAnsicht(pod) : null,
    });
  } catch (err) {
    console.error("[pods] Fehler beim Antrag:", err);
    res.status(500).json({ error: "Interner Fehler im Pod" });
  }
});

/** GET /pods/statistik/gesamt — aggregierte Kennzahlen der Demo. */
podsRouter.get("/statistik/gesamt", (_req: Request, res: Response) => {
  res.json(podStatistik());
});
