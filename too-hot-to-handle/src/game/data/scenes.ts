import type { Scene } from "@/game/types";

/**
 * Der Szenen-Katalog. Pro Tag werden alle Szenen gespielt, deren `condition`
 * erfüllt ist – in der Reihenfolge, in der sie hier stehen.
 */
export const SCENES: Scene[] = [
  // ───────────────────────── TAG 1 ─────────────────────────
  {
    id: "d1-ankunft",
    day: 1,
    title: "Die Ankunft",
    speaker: "narrator",
    text: "Ein Boot, acht Menschen, null Impulskontrolle. Die Villa liegt in der Sonne, der Pool dampft, und niemand hier weiß, dass das hier kein normales Datingformat ist. Du stehst mit einem Glas in der Hand da und sollst dich vorstellen.",
    choices: [
      {
        id: "charmant",
        label: "Charmant, aber zurückhaltend bleiben",
        risk: "safe",
        outcome:
          "Du sagst wenig und lächelst viel. Es funktioniert. Kenji nickt dir zu, als hättet ihr einen Pakt geschlossen, von dem du nichts weißt.",
        effects: { trust: 8, growth: 3, target: "kenji", connection: 6 },
      },
      {
        id: "show",
        label: "Sofort eine Show abziehen",
        risk: "flirty",
        outcome:
          "Du springst in Klamotten in den Pool. Aylin filmt alles, Noah applaudiert, Sofia notiert sich innerlich, dass du kein Kandidat für ernsthafte Gespräche bist.",
        effects: { trust: -4, target: "aylin", connection: 12 },
      },
      {
        id: "ehrlich",
        label: "Ehrlich sagen, warum du wirklich hier bist",
        risk: "growth",
        outcome:
          "Du erzählst von der Beziehung, die dich hierher gebracht hat. Kurze Stille. Dann redet plötzlich jeder über echte Dinge. Der Abend kippt in eine Richtung, mit der niemand gerechnet hat.",
        effects: { growth: 10, trust: 10 },
      },
    ],
  },
  {
    id: "d1-lana",
    day: 1,
    title: "Lana meldet sich",
    speaker: "lana",
    text: "Guten Abend. Ich bin Lana. Dieses Retreat dient nicht der körperlichen Befriedigung, sondern eurer emotionalen Entwicklung. Ab sofort gilt: kein Küssen, kein Heavy Petting, kein Sex, keine Selbstbefriedigung. Jeder Verstoß wird vom gemeinsamen Preisgeld von 100.000 € abgezogen.",
    choices: [
      {
        id: "akzeptieren",
        label: "Ruhig bleiben und die Regeln akzeptieren",
        risk: "safe",
        outcome:
          "Während alle anderen schreien, sitzt du still da. Rafa schaut dich an und sagt nur: „Du hast es schon vorher gewusst, oder?“",
        effects: { growth: 6, trust: 5, target: "rafa", connection: 8 },
      },
      {
        id: "lachen",
        label: "Laut lachen und es für einen Scherz halten",
        risk: "flirty",
        outcome:
          "Du lachst als Einziger. Das Lachen hält genau so lange, bis Lanas Licht rot wird und der Pott zum ersten Mal auf dem Bildschirm erscheint.",
        effects: { trust: -3, growth: -2 },
        lana: "Ich verstehe Humor. Ich berechne ihn nur nicht mit ein.",
      },
      {
        id: "verhandeln",
        label: "Mit Lana verhandeln",
        risk: "flirty",
        outcome:
          "Du fragst, ob Händchenhalten erlaubt sei. Sofia übernimmt sofort als deine Anwältin. Die Villa hat innerhalb von vier Minuten eine Rechtsabteilung.",
        effects: { trust: 4, target: "sofia", connection: 10 },
        lana: "Händchenhalten ist gestattet. Ich weiß, wohin es führt. Ich warte.",
      },
    ],
  },
  {
    id: "d1-nacht",
    day: 1,
    title: "Erste Nacht",
    speaker: "narrator",
    text: "Die Betten sind riesig und gemeinsam. Niemand hat das vorher erwähnt. Neben dir liegt jemand, der dir seit dem Boot nicht aus dem Kopf geht.",
    choices: [
      {
        id: "mila",
        label: "Dich neben Mila legen",
        risk: "flirty",
        outcome:
          "Ihr redet bis vier Uhr morgens über Eltern, Angst und Vinyasa-Flow. Nichts passiert. Es fühlt sich trotzdem nach etwas an.",
        effects: { setCrush: "mila", connection: 18, growth: 4 },
      },
      {
        id: "jonas",
        label: "Dich neben Jonas legen",
        risk: "flirty",
        outcome:
          "Jonas erklärt dir 40 Minuten lang Proteinsynthese und schläft dann mitten im Satz ein. Es ist merkwürdig sympathisch.",
        effects: { setCrush: "jonas", connection: 15, growth: 2 },
      },
      {
        id: "aylin2",
        label: "Dich neben Aylin legen",
        risk: "flirty",
        outcome:
          "Aylin dreht dir den Rücken zu, greift nach hinten und nimmt deine Hand. Kein Wort. Die Kamera über euch fährt langsam heran.",
        effects: { setCrush: "aylin", connection: 18, trust: -2 },
      },
      {
        id: "allein",
        label: "Allein auf der Couch schlafen",
        risk: "growth",
        outcome:
          "Du gehst dem Ganzen aus dem Weg und schläfst allein. Morgens bist du der Einzige, der ausgeruht ist – und der Einzige, den alle für mysteriös halten.",
        effects: { growth: 8, trust: 6 },
      },
    ],
  },

  // ───────────────────────── TAG 2 ─────────────────────────
  {
    id: "d2-fruehstueck",
    day: 2,
    title: "Frühstück mit Konsequenzen",
    speaker: "narrator",
    text: "Beim Frühstück wird klar: In der Nacht ist etwas passiert. Noah grinst zu breit, Bea schweigt zu laut. Lanas Auge leuchtet blau, während alle so tun, als würden sie Rührei interessant finden.",
    choices: [
      {
        id: "nachfragen",
        label: "Direkt nachfragen, was los war",
        risk: "safe",
        outcome:
          "Bea gibt zu, dass sie Noah geküsst hat. 3.000 € weg, bevor jemand den Kaffee ausgetrunken hat. Immerhin ist es raus.",
        effects: { money: -3000, trust: 6, growth: 3 },
        lana: "Danke für die Ehrlichkeit. Sie ändert nichts am Betrag.",
      },
      {
        id: "decken",
        label: "Nichts sagen und die beiden decken",
        risk: "flirty",
        outcome:
          "Du hältst dicht. Bea sieht dich an, als hättest du ihr das Leben gerettet. Das Preisgeld sieht das anders – Lana rechnet ohnehin ab.",
        effects: { money: -3000, trust: -5, target: "bea", connection: 14 },
        lana: "Der Abzug erfolgt mit oder ohne euer Geständnis. Schweigen ist nur teurer für eure Beziehungen.",
      },
      {
        id: "predigen",
        label: "Der Gruppe eine Moralpredigt halten",
        risk: "safe",
        outcome:
          "Du erklärst allen, worum es hier eigentlich geht. Die Hälfte nickt. Die andere Hälfte hasst dich ab jetzt ein bisschen.",
        effects: { money: -3000, growth: 5, trust: -6 },
      },
    ],
  },
  {
    id: "d2-workshop",
    day: 2,
    title: "Workshop: Die Mauer",
    speaker: "lana",
    text: "Heute baut ihr aus Pappkartons eine Mauer, die für alles steht, was ihr nicht fühlen wollt. Danach tretet ihr sie ein. Ich habe die Übung nicht erfunden. Ich setze sie nur durch.",
    choices: [
      {
        id: "ernst",
        label: "Es ernst nehmen und wirklich reingehen",
        risk: "growth",
        outcome:
          "Du schreibst den Namen auf den Karton, den du seit Monaten vermeidest. Beim Eintreten bricht dir die Stimme. Kenji legt dir wortlos eine Hand auf die Schulter.",
        effects: { growth: 16, trust: 10, target: "kenji", connection: 8 },
      },
      {
        id: "witz",
        label: "Alles ins Lächerliche ziehen",
        risk: "safe",
        outcome:
          "Du machst Witze über Pappkartons und Achtsamkeit. Es ist lustig. Es ist auch offensichtlich, dass du gerade eine echte Mauer verteidigst.",
        effects: { growth: -6, trust: -2 },
        lana: "Humor ist eine Mauer mit besserer Verpackung.",
      },
      {
        id: "halb",
        label: "Mitmachen, aber nur an der Oberfläche",
        risk: "safe",
        outcome:
          "Du sagst genug, um nicht aufzufallen, und nichts, was weh tut. Der Workshop geht vorbei. Du auch.",
        effects: { growth: 3 },
      },
    ],
  },
  {
    id: "d2-abend",
    day: 2,
    title: "Der Whirlpool",
    speaker: "narrator",
    text: "Nach Mitternacht seid ihr zu zweit im Whirlpool. Das Wasser ist zu warm, das Gespräch zu leise, und beide wisst ihr genau, was gerade passieren würde, wenn Lana kein Auge hätte.",
    condition: (s) => s.crush !== null,
    choices: [
      {
        id: "kuss",
        label: "Küssen. Egal was es kostet.",
        risk: "rulebreak",
        outcome:
          "Ihr küsst euch. Es ist gut. Es ist teuer. Beides ist unstrittig. Die Villa erfährt es acht Minuten später von Lana persönlich.",
        effects: { ruleBreak: "kuss", connection: 24, trust: -8, growth: -2 },
        lana: "Regelverstoß. 3.000 €. Ich hoffe, es war die Sekunde wert.",
      },
      {
        id: "reden",
        label: "Stattdessen über etwas Echtes reden",
        risk: "growth",
        outcome:
          "Du erzählst, warum du normalerweise genau in diesem Moment gehst. Ihr redet, bis das Wasser kalt ist. Es ist intimer als jeder Kuss und niemand glaubt euch das am nächsten Morgen.",
        effects: { growth: 14, connection: 16, trust: 6 },
      },
      {
        id: "raus",
        label: "Aufstehen und ins Bett gehen",
        risk: "safe",
        outcome:
          "Du steigst aus dem Wasser und gehst. Es ist die vernünftigste Entscheidung des Abends und fühlt sich trotzdem wie eine Niederlage an.",
        effects: { growth: 6, connection: -8 },
      },
    ],
  },

  // ───────────────────────── TAG 3 ─────────────────────────
  {
    id: "d3-date",
    day: 3,
    title: "Das erste Date",
    speaker: "lana",
    text: "Eine Person darf heute ein Date vergeben. Diese Person bist du. Am Strand steht ein gedeckter Tisch. Es gibt Wein, Sonnenuntergang und eine Kamera, die auf jede Mikrobewegung wartet.",
    choices: [
      {
        id: "crush",
        label: "Die Person einladen, für die du gekommen bist",
        risk: "flirty",
        outcome:
          "Ihr sitzt am Strand und redet, als wärt ihr die Einzigen hier. Für zwei Stunden ist die Show weg und es sind nur zwei Menschen an einem Tisch.",
        effects: { connection: 20, growth: 6 },
        requires: (s) => s.crush !== null,
      },
      {
        id: "sofia",
        label: "Sofia einladen – ihr habt euch noch nie richtig unterhalten",
        risk: "safe",
        outcome:
          "Sofia zerlegt in 20 Minuten deine gesamte Beziehungsbiografie und schenkt dir dann nach. Es ist das ehrlichste Gespräch, das du seit Jahren hattest.",
        effects: { target: "sofia", connection: 22, growth: 10, trust: 4 },
      },
      {
        id: "rafa",
        label: "Rafa einladen und die Villa verwirren",
        risk: "safe",
        outcome:
          "Rafa erzählt vom Meer, du erzählst von zuhause, und irgendwann sagt er den Satz, den du dir aufschreiben willst: „Wellen kann man nicht festhalten, nur reiten.“",
        effects: { target: "rafa", connection: 22, growth: 8 },
      },
    ],
  },
  {
    id: "d3-drama",
    day: 3,
    title: "Rückkehr in die Villa",
    speaker: "narrator",
    text: "Ihr kommt zurück und die Stimmung ist eisig. Wer nicht mitgedurft hat, hat die zwei Stunden damit verbracht, sich das Date in schlimmstmöglicher Version vorzustellen.",
    choices: [
      {
        id: "offen",
        label: "Sofort und offen erzählen, was war",
        risk: "growth",
        outcome:
          "Du berichtest ehrlich, inklusive der Teile, die dich schlecht dastehen lassen. Die Anspannung fällt ab wie ein nasses Handtuch.",
        effects: { growth: 8, trust: 12 },
      },
      {
        id: "geheim",
        label: "Es vage halten und geheimnisvoll tun",
        risk: "flirty",
        outcome:
          "Du sagst „war nett“ und gehst duschen. In der Küche entsteht innerhalb von zehn Minuten eine Verschwörungstheorie mit drei Beteiligten.",
        effects: { trust: -8, flags: ["geruecht"] },
      },
      {
        id: "aufwiegeln",
        label: "Die Eifersucht bewusst anheizen",
        risk: "flirty",
        outcome:
          "Du erzählst gerade so viel, dass es weh tut. Es funktioniert. Es funktioniert sogar zu gut, und du bist dir nicht sicher, ob du das wolltest.",
        effects: { trust: -14, connection: 10, growth: -6, flags: ["intrigant"] },
      },
    ],
  },

  // ───────────────────────── TAG 4 ─────────────────────────
  {
    id: "d4-nachtszene",
    day: 4,
    title: "Die lange Nacht",
    speaker: "narrator",
    text: "Es ist halb drei. Die Villa schläft. Ihr liegt nebeneinander und beide atmet ihr zu bewusst. Es gibt einen Punkt, an dem eine Entscheidung nicht mehr rückgängig zu machen ist. Ihr steht ziemlich genau davor.",
    condition: (s) => s.crush !== null && (s.connections[s.crush] ?? 0) > 25,
    choices: [
      {
        id: "allesoder",
        label: "Alles riskieren",
        risk: "rulebreak",
        outcome:
          "Ihr schlaft miteinander. Es ist die teuerste Nacht in der Geschichte dieser Villa und keiner von euch bereut sie in diesem Moment. Das kommt später.",
        effects: { ruleBreak: "sex", connection: 30, trust: -20, growth: -8, flags: ["nacht4"] },
        lana: "Regelverstoß der schwersten Kategorie. 20.000 €. Ich informiere die Gruppe beim Frühstück.",
      },
      {
        id: "petting",
        label: "Nicht ganz, aber auch nicht nichts",
        risk: "rulebreak",
        outcome:
          "Ihr hört auf, bevor es das ganz große Ding wird. Es kostet trotzdem, und die Diskussion über die genaue Definition wird morgen zwei Stunden dauern.",
        effects: { ruleBreak: "petting", connection: 18, trust: -10 },
        lana: "Heavy Petting. 6.000 €. Meine Definitionen sind bewusst großzügig.",
      },
      {
        id: "aufhoeren",
        label: "Innehalten und laut aussprechen, warum",
        risk: "growth",
        outcome:
          "Du sagst: „Ich will das. Deshalb will ich es nicht so.“ Es bleibt still. Dann nickt die Person neben dir, und irgendwas verschiebt sich zum Guten.",
        effects: { growth: 20, connection: 14, trust: 10, flags: ["standhaft"] },
        lana: "Ich habe zugesehen. Das war die schwierigere Entscheidung. Sie wird sich auszahlen.",
      },
    ],
  },
  {
    id: "d4-gruppe",
    day: 4,
    title: "Kassensturz",
    speaker: "lana",
    text: "Ich zeige euch den aktuellen Stand des Preisgeldes. Manche von euch werden überrascht sein. Andere wissen genau, warum die Zahl so aussieht.",
    choices: [
      {
        id: "verantwortung",
        label: "Öffentlich Verantwortung für deinen Anteil übernehmen",
        risk: "growth",
        outcome:
          "Du stehst auf und sagst, welcher Teil des fehlenden Geldes auf dein Konto geht. Niemand hatte damit gerechnet. Jonas steht danach auch auf.",
        effects: { growth: 14, trust: 16 },
      },
      {
        id: "andere",
        label: "Auf die anderen zeigen",
        risk: "safe",
        outcome:
          "Du benennst, wer wie viel gekostet hat. Faktisch korrekt. Sozial katastrophal. Bea verlässt den Raum, bevor du fertig bist.",
        effects: { trust: -16, growth: -6, target: "bea", connection: -20 },
      },
      {
        id: "schweigen",
        label: "Schweigen und abwarten",
        risk: "safe",
        outcome:
          "Du sagst nichts. Es fällt niemandem auf. Das ist gleichzeitig die gute und die schlechte Nachricht.",
        effects: { growth: -2 },
      },
    ],
  },

  // ───────────────────────── TAG 5 ─────────────────────────
  {
    id: "d5-luca",
    day: 5,
    title: "Neuzugang: Luca",
    speaker: "narrator",
    text: "Ein Boot legt an. Luca betritt die Villa in Sonnenbrille und mit dem Selbstbewusstsein eines Menschen, der noch nie eine Rechnung gesehen hat. Er kündigt an, zwei Dates mitzunehmen. Eines davon könnte deins sein.",
    choices: [
      {
        id: "revier",
        label: "Sofort dein Revier markieren",
        risk: "flirty",
        outcome:
          "Du machst unmissverständlich klar, wer hier mit wem. Luca lächelt nur. Genau darauf hat er gewartet, und jetzt hat er ein Ziel.",
        effects: { trust: -6, connection: 8, target: "luca", flags: ["luca-rivale"] },
      },
      {
        id: "gelassen",
        label: "Gelassen bleiben und ihm zuhören",
        risk: "growth",
        outcome:
          "Du gibst Luca eine echte Chance. Nach zwanzig Minuten stellt sich heraus: Hinter der Sonnenbrille steckt jemand, der noch nie gefragt wurde, wie es ihm geht.",
        effects: { growth: 12, trust: 8, target: "luca", connection: 14 },
      },
      {
        id: "bündnis",
        label: "Ihn direkt in ein Bündnis holen",
        risk: "safe",
        outcome:
          "Du bietest Luca einen Deal an: keine gegenseitigen Sabotagen. Er willigt ein. Ob er sich daran hält, ist eine andere Geschichte.",
        effects: { trust: 4, target: "luca", connection: 10, flags: ["luca-pakt"] },
      },
    ],
  },
  {
    id: "d5-eifersucht",
    day: 5,
    title: "Lucas erstes Date",
    speaker: "narrator",
    text: "Luca nimmt genau die Person mit, von der du gehofft hattest, dass er sie nicht mitnimmt. Zwei Stunden lang sitzt du am Pool und beobachtest, wie deine Fantasie sich selbst überholt.",
    condition: (s) => s.crush !== null,
    choices: [
      {
        id: "warten",
        label: "Warten und danach ruhig fragen",
        risk: "growth",
        outcome:
          "Du wartest bis zum nächsten Morgen und fragst dann ohne Vorwurf. Die Antwort ist ehrlicher, als sie es gestern Abend gewesen wäre.",
        effects: { growth: 12, trust: 8, connection: 10 },
      },
      {
        id: "szene",
        label: "Eine Szene machen, sobald sie zurück sind",
        risk: "flirty",
        outcome:
          "Du empfängst die beiden am Tor. Es wird laut. Es wird gefilmt. Es wird eine der Szenen, die später in jeden Trailer kommen.",
        effects: { trust: -14, growth: -8, connection: -6, flags: ["szene"] },
      },
      {
        id: "rache",
        label: "Aus Trotz mit jemand anderem flirten",
        risk: "flirty",
        outcome:
          "Du setzt dich demonstrativ zu Nadia — die noch gar nicht da ist — also zu Aylin. Es wirkt. Es fühlt sich nur nach nichts an.",
        effects: { target: "aylin", connection: 14, trust: -6, growth: -6, flags: ["rache"] },
      },
    ],
  },

  // ───────────────────────── TAG 6 ─────────────────────────
  {
    id: "d6-nadia",
    day: 6,
    title: "Neuzugang: Nadia",
    speaker: "narrator",
    text: "Nadia kommt an und begrüßt zwei Leute in der Villa mit einem Blick, der eine ganze Vorgeschichte transportiert. Beim Abendessen setzt sie sich neben dich.",
    choices: [
      {
        id: "offen2",
        label: "Neugierig sein, ohne zu flirten",
        risk: "safe",
        outcome:
          "Ihr redet über Rotterdam, Nachtschichten und Menschen, die nicht zurückschreiben. Es entsteht eine Freundschaft, die in diesem Format ungewöhnlich ist.",
        effects: { target: "nadia", connection: 16, growth: 8, trust: 6 },
      },
      {
        id: "flirt",
        label: "Voll auf sie einsteigen",
        risk: "flirty",
        outcome:
          "Es funkt sofort. Das Problem: Die Person, mit der du seit Tag 1 unterwegs bist, sitzt drei Stühle weiter und rührt seit einer Minute in einem leeren Teller.",
        effects: { setCrush: "nadia", target: "nadia", connection: 24, trust: -12, flags: ["doppelspiel"] },
      },
      {
        id: "distanz",
        label: "Höflich, aber auf Abstand bleiben",
        risk: "growth",
        outcome:
          "Du bleibst freundlich und klar. Deine Person sieht das vom anderen Tischende und sagt später leise: „Danke.“",
        effects: { growth: 12, connection: 16, trust: 8 },
      },
    ],
  },
  {
    id: "d6-workshop",
    day: 6,
    title: "Workshop: Der Spiegel",
    speaker: "lana",
    text: "Ihr setzt euch paarweise gegenüber und sagt der anderen Person drei Minuten lang nur die Wahrheit. Kein Humor, keine Ausweichmanöver. Ich messe eure Herzfrequenz.",
    choices: [
      {
        id: "ganz",
        label: "Wirklich alles sagen",
        risk: "growth",
        outcome:
          "Du sagst den Satz, den du seit zehn Jahren nicht ausgesprochen hast. Danach ist die Villa still und du bist leichter.",
        effects: { growth: 20, trust: 12, connection: 12 },
        lana: "Deine Herzfrequenz ist gestiegen und dann gefallen. Genau das ist der Punkt.",
      },
      {
        id: "teilweise",
        label: "Die halbe Wahrheit",
        risk: "safe",
        outcome:
          "Du gibst genug preis, um durchzukommen. Dein Gegenüber merkt es und sagt nichts. Das ist fast schlimmer.",
        effects: { growth: 4, trust: 2 },
      },
      {
        id: "abbrechen",
        label: "Den Workshop abbrechen",
        risk: "safe",
        outcome:
          "Du stehst mitten in der Übung auf und gehst raus. Draußen sitzt Rafa auf der Mauer und sagt: „Ich bin auch rausgegangen. Beim ersten Mal.“",
        effects: { growth: -8, target: "rafa", connection: 8 },
      },
    ],
  },

  // ───────────────────────── TAG 7 ─────────────────────────
  {
    id: "d7-gruenes-licht",
    day: 7,
    title: "Grünes Licht?",
    speaker: "lana",
    text: "Ich habe eure Entwicklung analysiert. Eine Verbindung in dieser Villa hat sich weit genug entwickelt, um einen ehrlichen Moment zu verdienen. Ihr habt heute Abend die Möglichkeit, grünes Licht zu erhalten.",
    condition: (s) => s.growth >= 45 && s.crush !== null,
    choices: [
      {
        id: "annehmen",
        label: "Den Moment annehmen",
        risk: "growth",
        outcome:
          "Lanas Licht wird grün. Ihr küsst euch, und zum ersten Mal kostet es nichts. Die ganze Villa jubelt, als hätte jemand ein Tor geschossen.",
        effects: { growth: 14, connection: 26, trust: 12, flags: ["gruenes-licht"] },
        lana: "Grünes Licht. Genießt es. Es ist verdient — und es ist zeitlich begrenzt.",
      },
      {
        id: "verschieben",
        label: "Ablehnen – es soll nicht auf Kommando passieren",
        risk: "growth",
        outcome:
          "Ihr sagt Lana ab. Die Villa versteht es nicht. Ihr beide schon, und das ist der eigentliche Fortschritt.",
        effects: { growth: 18, connection: 12, trust: 6, flags: ["abgelehnt"] },
        lana: "Interessant. Das haben in sechs Staffeln vier Personen getan. Alle vier sind zusammengeblieben.",
      },
    ],
  },
  {
    id: "d7-krise",
    day: 7,
    title: "Die Krise",
    speaker: "narrator",
    text: "Es kracht. Ein Gerücht, ein falscher Satz, ein Blick zu lang — und plötzlich steht die halbe Villa in der Küche und schreit. Alle schauen zu dir, weil du der Einzige bist, der noch nicht laut geworden ist.",
    choices: [
      {
        id: "moderieren",
        label: "Vermitteln und beide Seiten anhören",
        risk: "growth",
        outcome:
          "Du gehst dazwischen und stellst die eine Frage, die keiner gestellt hat. Nach zehn Minuten sitzen alle. Nach zwanzig lacht jemand.",
        effects: { growth: 16, trust: 20 },
      },
      {
        id: "partei",
        label: "Klar Partei ergreifen",
        risk: "safe",
        outcome:
          "Du stellst dich auf eine Seite. Diese Seite liebt dich jetzt. Die andere merkt es sich bis zur letzten Zeremonie.",
        effects: { trust: -8, connection: 16, growth: 2 },
      },
      {
        id: "rausgehen",
        label: "Rausgehen und es aussitzen",
        risk: "safe",
        outcome:
          "Du gehst an den Strand. Als du zurückkommst, ist alles geklärt und niemand weiß mehr, worum es ging. Auch eine Strategie.",
        effects: { growth: 2, trust: -4 },
      },
    ],
  },

  // ───────────────────────── TAG 8 ─────────────────────────
  {
    id: "d8-versuchung",
    day: 8,
    title: "Die Versuchungssuite",
    speaker: "lana",
    text: "Es gibt eine Suite im Nordflügel. Kein Kamerablick, keine Aufsicht, kein Regelwerk. Ich biete sie euch heute Nacht an. Ich empfehle sie nicht. Ich biete sie nur an.",
    condition: (s) => s.crush !== null && (s.connections[s.crush] ?? 0) > 35,
    choices: [
      {
        id: "reingehen",
        label: "Die Suite nutzen",
        risk: "rulebreak",
        outcome:
          "Ihr geht rein. Die Tür schließt. Am nächsten Morgen sind alle wach, bevor ihr rauskommt, und der Pott ist deutlich leichter.",
        effects: { ruleBreak: "sex", connection: 26, trust: -22, growth: -10, flags: ["suite"] },
        lana: "Die Suite hat keine Kameras. Sie hat Sensoren. 20.000 €.",
      },
      {
        id: "reden2",
        label: "Reingehen, aber nur reden",
        risk: "growth",
        outcome:
          "Ihr nutzt die einzige kamerafreie Nacht des Retreats zum Reden. Es ist die intimste Nacht bisher und es kostet keinen Cent.",
        effects: { growth: 22, connection: 22, trust: 14, flags: ["suite-clean"] },
        lana: "Keine Sensordaten von Belang. Das ist die beste Nachricht, die ich seit Tag 1 hatte.",
      },
      {
        id: "ablehnen",
        label: "Das Angebot ablehnen",
        risk: "growth",
        outcome:
          "Ihr sagt gemeinsam ab, vor der ganzen Gruppe. Jonas klatscht. Dann klatschen alle. Es ist albern und großartig.",
        effects: { growth: 16, trust: 18, connection: 10 },
      },
    ],
  },
  {
    id: "d8-abrechnung",
    day: 8,
    title: "Die Abrechnung",
    speaker: "narrator",
    text: "Zwei Tage vor Schluss zieht die Gruppe Bilanz. Jeder muss sagen, wer das Preisgeld am meisten verdient hat — und wer am wenigsten.",
    choices: [
      {
        id: "selbst",
        label: "Dich selbst nennen",
        risk: "flirty",
        outcome:
          "Du nennst dich selbst und begründest es. Es ist mutig oder dreist, je nachdem, wen man fragt. Sofia fragt nach. Du hast eine Antwort.",
        effects: { trust: -4, growth: 6 },
      },
      {
        id: "crush2",
        label: "Deine Person nennen",
        risk: "safe",
        outcome:
          "Du nennst die Person, mit der du hier durchgegangen bist, und sagst warum. Sie schaut nicht auf. Sie hat feuchte Augen.",
        effects: { connection: 18, trust: 8, growth: 8 },
        requires: (s) => s.crush !== null,
      },
      {
        id: "kenji2",
        label: "Kenji nennen – er hat alle zusammengehalten",
        risk: "growth",
        outcome:
          "Du nennst den, der nie etwas für sich verlangt hat. Kenji sagt nichts, geht in die Küche und kocht für zwölf Leute.",
        effects: { target: "kenji", connection: 20, trust: 16, growth: 10 },
      },
    ],
  },

  // ───────────────────────── TAG 9 ─────────────────────────
  {
    id: "d9-entscheidung",
    day: 9,
    title: "Die letzte Nacht",
    speaker: "narrator",
    text: "Morgen ist alles vorbei. Draußen wartet ein Leben, in dem niemand von euch dem anderen begegnen muss. Ihr steht am Steg und beide wisst ihr, dass jetzt der Moment für den einen Satz ist.",
    condition: (s) => s.crush !== null,
    choices: [
      {
        id: "sagen",
        label: "Sagen, was du wirklich willst – auch nach der Villa",
        risk: "growth",
        outcome:
          "Du sagst es. Ohne Absicherung, ohne Witz am Ende. Die Antwort dauert drei Sekunden und diese drei Sekunden sind länger als die ganze Woche.",
        effects: { growth: 20, connection: 26, trust: 10, flags: ["bekenntnis"] },
      },
      {
        id: "offenlassen",
        label: "Es bewusst offenlassen",
        risk: "safe",
        outcome:
          "Ihr einigt euch darauf, nichts zu entscheiden. Es ist erwachsen. Es ist auch feige. Manchmal ist es beides.",
        effects: { growth: 6, connection: 4 },
      },
      {
        id: "letztenacht",
        label: "Die letzte Nacht nehmen, was ihr wollt",
        risk: "rulebreak",
        outcome:
          "Ihr entscheidet, dass es morgen egal ist. Es ist nicht egal. Lana rechnet bis zur letzten Minute mit.",
        effects: { ruleBreak: "sex", connection: 20, trust: -18, growth: -12, flags: ["finalbruch"] },
        lana: "Auch die letzte Nacht zählt. 20.000 €. Ich schließe die Bücher morgen früh.",
      },
    ],
  },
  {
    id: "d9-brief",
    day: 9,
    title: "Der Brief",
    speaker: "lana",
    text: "Schreibt einen Brief an die Person, die ihr an Tag 1 wart. Ihr müsst ihn nicht vorlesen. Die meisten tun es trotzdem.",
    choices: [
      {
        id: "vorlesen",
        label: "Vorlesen",
        risk: "growth",
        outcome:
          "Du liest laut vor. Bei der dritten Zeile bricht deine Stimme. Bea, die seit Tag 1 sagt, dass sie so etwas albern findet, weint als Erste.",
        effects: { growth: 22, trust: 16 },
      },
      {
        id: "behalten",
        label: "Für dich behalten",
        risk: "safe",
        outcome:
          "Du faltest den Brief und steckst ihn ein. Was drinsteht, weiß nur du. Das reicht auch.",
        effects: { growth: 10 },
      },
    ],
  },
];

export function scenesForDay(day: number): Scene[] {
  return SCENES.filter((s) => s.day === day);
}
