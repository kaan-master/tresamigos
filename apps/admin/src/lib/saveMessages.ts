const SAVE_LOADING = [
  "Taco's worden gevuld met content...",
  "De lucha libre ring wordt opgebouwd...",
  "Salsa wordt gemixt — even geduld...",
  "De mariachi band stemt af...",
  "Guacamole wordt vers geprakt...",
  "El campeón bereidt je wijzigingen voor..."
];

const SAVE_SUCCESS = [
  "¡Olé! Opgeslagen als een kampioen!",
  "¡Arriba! Je content staat klaar — ¡viva!",
  "¡Sí señor! Taco's zijn geserveerd in de cloud.",
  "¡Lucha libre win! Alles veilig opgeslagen.",
  "¡Qué rico! Wijzigingen zijn live klaar.",
  "¡Andale! De ring is schoon — opgeslagen!"
];

const SAVE_ERROR = [
  "¡Ay caramba! Opslaan mislukt — probeer opnieuw.",
  "De luchador is gevallen — opslaan lukte niet.",
  "Taco's zijn omgevallen. Probeer het nog eens."
];

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function randomSaveLoading() {
  return { title: "Opslaan...", message: pick(SAVE_LOADING) };
}

export function randomSaveSuccess() {
  return { title: pick(SAVE_SUCCESS), message: "Alle wijzigingen staan klaar in de API." };
}

export function randomSaveError(fallback: string) {
  return { title: pick(SAVE_ERROR), message: fallback };
}
