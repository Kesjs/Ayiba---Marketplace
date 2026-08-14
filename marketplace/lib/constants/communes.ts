// Les 77 communes du Bénin, groupées par département. Couverture nationale
// (avant : liste limitée à Cotonou/Calavi — étendue le jour où le service
// est passé à tout le pays). "Calavi" est gardé en plus du nom officiel
// "Abomey-Calavi" pour rester compatible avec les adresses déjà enregistrées
// sous ce nom courant ; detecterCommune() dans useGeolocationAdresse.ts fait
// déjà le lien entre les deux via son fallback par inclusion.
export const COMMUNES_COUVERTES = [
  // Alibori
  "Banikoara", "Gogounou", "Kandi", "Karimama", "Malanville", "Segbana",
  // Atacora
  "Boukoumbé", "Cobly", "Kérou", "Kouandé", "Matéri", "Natitingou", "Péhunco", "Tanguiéta", "Toucountouna",
  // Atlantique
  "Abomey-Calavi", "Calavi", "Allada", "Kpomassè", "Ouidah", "Sô-Ava", "Toffo", "Tori-Bossito", "Zè",
  // Borgou
  "Bembéréké", "Kalalé", "N'Dali", "Nikki", "Parakou", "Pèrèrè", "Sinendé", "Tchaourou",
  // Collines
  "Bantè", "Dassa-Zoumè", "Glazoué", "Ouèssè", "Savalou", "Savè",
  // Couffo
  "Aplahoué", "Djakotomey", "Dogbo-Tota", "Klouékanmè", "Lalo", "Toviklin",
  // Donga
  "Bassila", "Copargo", "Djougou", "Ouaké",
  // Littoral
  "Cotonou",
  // Mono
  "Athiémé", "Bopa", "Comè", "Grand-Popo", "Houéyogbé", "Lokossa",
  // Ouémé
  "Adjarra", "Adjohoun", "Aguégués", "Akpro-Missérété", "Avrankou", "Bonou", "Dangbo", "Porto-Novo", "Sèmè-Kpodji",
  // Plateau
  "Adja-Ouèrè", "Ifangni", "Kétou", "Pobè", "Sakété",
  // Zou
  "Abomey", "Agbangnizoun", "Bohicon", "Covè", "Djidja", "Ouinhi", "Za-Kpota", "Zagnanado", "Zogbodomey",
] as const;

export type CommuneCouverte = (typeof COMMUNES_COUVERTES)[number];
