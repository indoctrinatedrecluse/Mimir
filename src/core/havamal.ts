export interface HavamalStanza {
  id: number;
  stanzaNumber: number;
  oldNorse: string;
  english: string;
  context: string;
}

export const HAVAMAL_STANZAS: HavamalStanza[] = [
  {
    id: 1,
    stanzaNumber: 10,
    oldNorse: "Byrði betri berrat maðr brautu at en sé manvit mikit.",
    english: "A better burden may no man bear upon the way than much wisdom.",
    context: "On Knowledge & Wisdom"
  },
  {
    id: 2,
    stanzaNumber: 16,
    oldNorse: "Ósnjallr maðr hyggsk munu ey lifa, ef hann við víg varask.",
    english: "The foolish man thinks he will live forever if he avoids struggle; but old age gives him no peace, though spears may spare him.",
    context: "On Courage & Time"
  },
  {
    id: 3,
    stanzaNumber: 27,
    oldNorse: "Ósnotr maðr, er með aldir kemr, þat er betst, at hann þegi.",
    english: "The unwise man who comes among people does best to keep silent; for no one knows how little he knows unless he speaks too much.",
    context: "On Prudence & Silence"
  },
  {
    id: 4,
    stanzaNumber: 47,
    oldNorse: "Ungr var ek forðum, fór ek einn saman, þá varð ek villr vega.",
    english: "Young was I once, I traveled alone, and lost my way; wealthy did I deem myself when I met another: man is man's delight.",
    context: "On Companionship & Unity"
  },
  {
    id: 5,
    stanzaNumber: 76,
    oldNorse: "Deyr fé, deyja frændr, deyr sjalfr it sama; en orðstírr deyr aldregi, hveim er sér góðan getr.",
    english: "Cattle die, kinsmen die, and you yourself shall likewise die; but a good name never dies for him who has earned it.",
    context: "On Immortality through Honor"
  },
  {
    id: 6,
    stanzaNumber: 138,
    oldNorse: "Veit ek, at ek hekk vindga meiði á nætr allar níu, geiri undaðr ok gefinn Óðni, sjálfr sjálfum mér.",
    english: "I know that I hung on the windswept tree all of nine nights, wounded by a spear and given to Odin, myself to myself.",
    context: "On Sacrifice for Insight"
  },
  {
    id: 7,
    stanzaNumber: 139,
    oldNorse: "Næsta ek niðr, nam ek upp rúnar, æpandi nam, fell ek aptr þaðan.",
    english: "Downward I peered, I took up the runes, screaming I took them, and fell back thence.",
    context: "On the Unlocking of Runes"
  }
];

export const getRandomHavamal = (): HavamalStanza => {
  return HAVAMAL_STANZAS[Math.floor(Math.random() * HAVAMAL_STANZAS.length)];
};
