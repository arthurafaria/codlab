// English version of the demo codebook. Same keys and structure as the
// Portuguese one; only the text changes, so the two never drift apart.

import * as pt from "./codebook-demo";

const GROUPS = {
  "Origem da mensagem": "Message origin",
  "Não preencher": "Do not fill in",
  Caracterização: "Characterization",
  Enquadramento: "Framing",
  "Efeitos esperados": "Expected effects",
  Observação: "Notes",
};

const TOPICS = {
  "Gestão Municipal": "Local government",
  "Saúde e Bem-estar": "Health and wellbeing",
  "Segurança Urbana": "Public safety",
  "Direitos e Cidadania": "Rights and citizenship",
  "Cultura e Tradição": "Culture and tradition",
  "Meio Ambiente": "Environment",
  "Economia Local": "Local economy",
  Educação: "Education",
  "Ciência e Tecnologia": "Science and technology",
  "Esporte e Celebridades": "Sports and celebrities",
  Outro: "Other",
};

const SOURCE_TYPES = {
  "Veículo Jornalístico": "News outlet",
  "Plataformas e Mensageria": "Platforms and messaging",
  Institucional: "Institutional",
  "Não identificada": "Unidentified",
  Aberto: "Open",
  Restrito: "Restricted",
};

const TEXT = {

  Assunto_1: { q: "Main topic of the message", help: "Pick the topic that organizes the message as a whole. If two compete, the main one is the one the conclusion rests on." },
  Assunto_2: { q: "Secondary topic (if any)", help: "Fill in only when a second topic is clearly brought up. Otherwise leave blank." },
  Conteudo_Institucional: { q: "Does the message mention a public agency or service?", help: "Counts a name (city hall, clinic, school, council) or an unmistakable reference to a public service." },
  Conteudo_Sensivel: { q: "Is the message about a specific social group?", help: "Tick when a group is the subject of the message, not when it appears in passing." },

  Marco_Imprecisao: { q: "Presents inaccurate or incomplete information?", help: "Checkable claims that omit an essential condition, confuse cause with correlation, or generalize from a single case." },
  Marco_Numeros: { q: "Uses numbers or statistics as an argument?", help: "Percentages, counts, rankings or numerical comparisons used to back the claim, with or without a source." },
  Marco_Contestacao: { q: "Disputes established technical consensus?", help: "Explicitly rejects a settled position from a technical, scientific or regulatory field." },
  Marco_Apelo: { q: "Relies on emotional appeal?", help: "Uses fear, outrage, pity or hope as the main route to persuasion, above argument." },
  Marco_Parcialidade: { q: "Presents only one side of the issue?", help: "Where a recognized controversy exists, the message treats only one position as real or legitimate." },
  Marco_Polarizacao: { q: "Splits the scene into two opposing camps?", help: "Frames the story as 'us against them', with no middle position possible." },
  Marco_Figura: { q: "Pins the explanation on a single person?", help: "Attributes the cause or the solution of a collective or structural process to one individual." },
  Marco_Descredito: { q: "Discredits whoever disagrees?", help: "Attacks the person, the group or the motive of the opponent instead of the argument." },
  Marco_Descontexto: { q: "Uses material out of its original context?", help: "A real quote, image or figure presented in a different situation, date or purpose from the original." },
  Marco_Pressa: { q: "Creates urgency to act or forward?", help: "Asks for immediate sharing, suggests a short window of time, or warns it 'will be deleted'." },
  Marco_Trama: { q: "Suggests a hidden plan or secret coordination?", help: "Proposes that a group is acting in secret and in concert to produce the outcome described." },
  Marco_Autoridade: { q: "Invokes authority to validate the message?", help: "Leans on an expert, a title, an institution or an 'inside source' as the guarantee for the claim." },

  Reacao_Alarme: { q: "Likely to alarm the reader?", help: "The predictable outcome of reading is apprehension about an imminent risk to oneself or one's own." },
  Reacao_Rejeicao: { q: "Likely to feed rejection of a group?", help: "Builds a collective as a threat, a burden or an adversary, even without an explicit slur." },
  Reacao_Mobilizacao: { q: "Calls for a concrete action?", help: "Asks for a signature, attendance, a boycott, a report, a vote or organized forwarding." },
  Reacao_Opiniao: { q: "Tries to shift opinion on a topic?", help: "The apparent goal is to change the reader's judgment, not just to inform." },
  Reacao_Confianca: { q: "Tries to reduce trust in institutions?", help: "Presents public agencies, technical bodies or the press as incapable, captured or ill-intentioned." },
  Reacao_Extremos: { q: "Reinforces uncompromising positions?", help: "Treats negotiation and middle ground as weakness or betrayal." },

  OBS: { header: "NOTES", q: "Coding notes", help: "Free text for doubts, exceptions or comments to the supervisor." },
};

export const idField = pt.idField;
export const textField = pt.textField;

export const metaFields = [
  { key: "ID", label: "ID" },
  { key: "dia", label: "Date" },
  { key: "hora", label: "Time" },
  { key: "grupo", label: "Channel" },
  { key: "telefone", label: "Sender" },
  { key: "Outlet", label: "Platform" },
  { key: "Link", label: "Link" },
];

export const editableFields = pt.editableFields.map((field) => {
  const t = TEXT[field.key] || {};
  return {
    ...field,
    header: t.header || field.header,
    group: GROUPS[field.group] || field.group,
    question: t.q || field.question,
    help: t.help || field.help,
    options: field.options
      ? field.options.map((o) => TOPICS[o] || SOURCE_TYPES[o] || o)
      : field.options,
  };
});

export const exportColumns = editableFields.map((field) => field.key);
export const exportHeaders = editableFields.map((field) => field.header);
export { BINARY_FORMATS as binaryFormats, DEFAULT_BINARY_FORMAT as defaultBinaryFormat } from "../../lib/coding";

// Para traduzir valores já preenchidos nos registros (assuntos, categorias).
export const translateValue = (value) => TOPICS[value] || SOURCE_TYPES[value] || value;
