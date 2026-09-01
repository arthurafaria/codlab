// English version of the demo sample. Same fictional town, same IDs, dates,
// senders and links as the Portuguese file; only the text and labels change.

import { records as ptRecords, project as ptProject } from "./texts-demo";
import { translateValue } from "./codebook-demo.en";

export const project = {
  ...ptProject,
  eyebrow: "Showcase Project · demo sample",
  title: "Framing Analysis: Vila Aurora",
  storageKey: "codifica-colab:demo:en:v1",
};

const CHANNELS = {
  "Moradores · Vila Aurora": "Vila Aurora Residents",
  "Bairro Novo Horizonte": "Novo Horizonte Neighborhood",
  "Comércio Central AV": "Downtown Merchants",
  "Escola Meridiano · Responsáveis": "Meridiano School Parents",
  "Torcida Aurora FC": "Aurora FC Supporters",
  "Família Andrade": "Andrade Family",
};

const OUTLETS = {
  "Portal Aurora": "Aurora Portal",
  "Rede Meridiano": "Meridian Network",
  "Canal Bússola": "Compass Channel",
  "Diário do Vale": "Valley Daily",
  "TV Alvorada": "Alvorada TV",
  WhatsApp: "WhatsApp",
};

const TEXTS = {
  1: "Folks, Aurora Portal just reported it: the Córrego Fundo bridge repair got pushed back again. Third time this year. Anyone who depends on it to get to work will keep driving the 12 km detour. Has anyone in the neighborhood managed to talk to city hall?",
  2: "URGENT!! Just got this from a mom who works at the education office: they're cutting the afternoon school meal starting next week. Not official yet but she saw the document. FORWARD BEFORE THEY DELETE IT.",
  3: "Meridian Network piece on the new opening hours for the street market. Worth reading before Thursday's meeting. The full text of the decree is at the bottom of the page.",
  4: "Good morning. Heads up that the Novo Horizonte clinic reopens on Saturdays starting this month, 8am to noon. I confirmed at the front desk today. Pass it on to anyone who works during the week.",
  5: "They installed 14 cameras in the main square and crime fell 60% in two months, according to Compass Channel. So it works. What are the people who opposed it going to say now? It's long past time to roll it out across the whole neighborhood.",
  6: "Grandma, that voice note you sent about guava leaf tea curing diabetes is old and has already been debunked. Please don't stop taking your medication. We can talk to Dr. Helena at Tuesday's appointment.",
  7: "Alvorada TV report showing the state of the Aurora FC locker room. The renovation money came through in January and nobody knows where it went. Where's the money? Someone needs to answer for this.",
  8: "Good grief, look at the line at the clinic today. This is pure neglect. Meanwhile the council members voted themselves a raise last week. Everyone looks after their own, right. Let the people fend for themselves.",
  9: "Re-enrollment deadline is the 18th, per the Valley Daily. Required documents are listed in the article. Miss the deadline and you go into the reassignment queue.",
  10: "I found out why they keep pushing the landfill next to Novo Horizonte. Big players have been quietly buying land there for two years. Once the landfill goes in, prices crash and they buy the rest. It was all arranged from the start.",
  11: "Reminder: the merchants' association meeting is Friday at 7pm, in the back room of Nilo's bakery. Single item on the agenda: paid parking. If you can't make it, send your position in writing.",
  12: "The university study on the Córrego Fundo spring came out today. It says recovery is feasible in five years if the illegal dumping stops. Aurora Portal published the summary with the maps.",
  13: "ATTENTION! There's a new scam going around the region. They call claiming to be from the bank and ask for your card code. DO NOT GIVE THE CODE TO ANYONE. My neighbor lost everything yesterday. Warn the older folks in the family NOW.",
  14: "Replacement of the streetlights on Rua das Acácias starts Monday, per Compass Channel. 40 points. Expected to finish in two weeks, weather permitting.",
  15: "Who still believes opinion polls in this town? They commission them, pay for them and get the number they want. Then they come out saying the public supports it. The public I talk to every day supports none of this.",
  16: "Ms. Marlene retires Friday after 31 years at Meridiano. The classes are organizing a tribute in the courtyard at 10am. If you can stop by, she'll appreciate it.",
  17: "The new service tax bracket takes effect in July. Meridian Network made a table comparing what changes by business size. Worth checking your bracket before closing the quarter.",
  18: "Got this from a group in the next neighborhood and I'm forwarding without confirming. They say the Vila Aurora clinic is closing and everything moves to the district. If true, that's 4,000 people with no care nearby. Can anyone check with someone on the inside before this turns into panic?",
  19: "Recycling pickup moves to Tuesdays and Fridays starting the 20th. Aurora Portal published the route map by street.",
  20: "If Aurora FC doesn't get promoted this year, it's entirely the coach's fault. His alone. Hold me to it in December. Same squad that won in 2024, only the coaching changed, and look at the result.",
  21: "Meridiano went up 0.4 points in the basic education index, from 5.1 to 5.5. Biggest gain in the municipality. The Valley Daily talked to the coordinators about what changed in the morning tutoring.",
  22: "Nobody in the press will publish this because they all take advertising money from city hall. It's up to us to spread it. While the people sleep, everything gets decided behind closed doors. Wake up, Vila Aurora.",
  23: "Seedling swap on Sunday, 9am to 1pm, in the square. Bring a seedling, take another. Mrs. Iracema is bringing her basil and pepper plants.",
  24: "60 temporary end-of-year jobs open downtown. Sign up at the association counter through the 30th, per Compass Channel. Priority for local residents.",
  25: "A security expert who worked 20 years in the capital said on the radio yesterday: a town that doesn't put gated entrances on its neighborhoods becomes a hostage within five years. He knows what he's talking about. We've been warned.",
  26: "Public hearing on the master plan is on the 22nd, 6pm, at the council chamber. Sign-up to speak opens an hour before. Alvorada TV will stream it live.",
  27: "Parents, has anyone else gotten a call from an unknown number asking for student details to 'confirm the school registration'? The office says they aren't calling anyone. Be careful.",
  28: "Vaccination campaign starts Monday at three sites: the central clinic, Meridiano school and the Novo Horizonte community center. Runs through the end of the month, 8am to 5pm.",
  29: "Bus to Saturday's game: leaves the square at 1pm, R$20 round trip. Confirm here by Thursday so I can close with the company.",
  30: "Participatory budget results: the Novo Horizonte square came first with 1,240 votes, followed by the covered court with 980. Meridian Network published the full count by region.",
};

export const records = ptRecords.map((row) => {
  const text = TEXTS[row.id] || row.texto;
  const out = {
    ...row,
    grupo: CHANNELS[row.grupo] || row.grupo,
    Outlet: OUTLETS[row.Outlet] || row.Outlet,
    texto: row.Link && !text.includes(row.Link) ? `${text}\n\n${row.Link}` : text,
  };
  // Valores já codificados (assunto, categoria) aparecem no idioma da interface.
  for (const key of ["Assunto_1", "Assunto_2", "Categoria_Fonte_2"]) {
    if (out[key]) out[key] = translateValue(out[key]);
  }
  return out;
});
