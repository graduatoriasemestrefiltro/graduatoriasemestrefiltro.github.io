export interface UniversityEnrollmentData {
  id: string;
  nome: string;
  iscrittiAppello: number | null;  // Iscritti all'esame
  iscrittiCorso: number | null;    // Iscritti al corso di laurea
  postiDisponibili: number | null; // Posti disponibili nella sede
}

export const universityEnrollments: UniversityEnrollmentData[] = [
  { id: "01", nome: "Università Politecnica delle MARCHE", iscrittiAppello: 883, iscrittiCorso: 1003, postiDisponibili: 389 },
  { id: "02", nome: "Università degli Studi di BARI ALDO MORO", iscrittiAppello: 2337, iscrittiCorso: 2655, postiDisponibili: 534 },
  { id: "03", nome: "Alma Mater Studiorum - Università di BOLOGNA", iscrittiAppello: 2681, iscrittiCorso: 3351, postiDisponibili: 929 },
  { id: "04", nome: "Università degli Studi di CAGLIARI", iscrittiAppello: 1161, iscrittiCorso: 1398, postiDisponibili: 330 },
  { id: "05", nome: "Università della CALABRIA", iscrittiAppello: 718, iscrittiCorso: 865, postiDisponibili: 173 },
  { id: "06", nome: "Università degli Studi di CAMERINO", iscrittiAppello: 86, iscrittiCorso: 96, postiDisponibili: 65 },
  { id: "08", nome: "Università degli Studi di CATANIA", iscrittiAppello: 1896, iscrittiCorso: 2284, postiDisponibili: 526 },
  { id: "09", nome: "Università degli Studi di FERRARA", iscrittiAppello: 874, iscrittiCorso: 1016, postiDisponibili: 616 },
  { id: "10", nome: "Università degli Studi di FIRENZE", iscrittiAppello: 1498, iscrittiCorso: 1643, postiDisponibili: 615 },
  { id: "11", nome: "Università degli Studi di GENOVA", iscrittiAppello: 979, iscrittiCorso: 979, postiDisponibili: 375 },
  { id: "12", nome: "Università del SALENTO", iscrittiAppello: 447, iscrittiCorso: 525, postiDisponibili: 150 },
  { id: "14", nome: "Università degli Studi di MESSINA", iscrittiAppello: 1019, iscrittiCorso: 1119, postiDisponibili: 770 },
  { id: "15", nome: "Università degli Studi di MILANO", iscrittiAppello: 3133, iscrittiCorso: 3560, postiDisponibili: 728 },
  { id: "17", nome: "Università degli Studi di MODENA e REGGIO EMILIA", iscrittiAppello: 770, iscrittiCorso: 875, postiDisponibili: 250 },
  { id: "18", nome: "Università degli Studi di Napoli Federico II", iscrittiAppello: 3149, iscrittiCorso: 3704, postiDisponibili: 911 },
  { id: "19", nome: "Università degli Studi di PADOVA", iscrittiAppello: 3409, iscrittiCorso: 3746, postiDisponibili: 713 },
  { id: "20", nome: "Università degli Studi di PALERMO", iscrittiAppello: 1963, iscrittiCorso: 2365, postiDisponibili: 785 },
  { id: "21", nome: "Università degli Studi di PARMA", iscrittiAppello: 1016, iscrittiCorso: 1181, postiDisponibili: 453 },
  { id: "22", nome: "Università degli Studi di PAVIA", iscrittiAppello: 1087, iscrittiCorso: 1207, postiDisponibili: 450 },
  { id: "23", nome: "Università degli Studi di PERUGIA", iscrittiAppello: 1216, iscrittiCorso: 1366, postiDisponibili: 566 },
  { id: "24", nome: "Università di PISA", iscrittiAppello: 1558, iscrittiCorso: 1764, postiDisponibili: 468 },
  { id: "26", nome: "Università degli Studi di ROMA \"La Sapienza\"", iscrittiAppello: 4021, iscrittiCorso: 5147, postiDisponibili: 1887 },
  { id: "27", nome: "Università degli Studi di ROMA \"Tor Vergata\"", iscrittiAppello: 1624, iscrittiCorso: 2030, postiDisponibili: 822 },
  { id: "28", nome: "Università degli Studi di SALERNO", iscrittiAppello: 1063, iscrittiCorso: 1296, postiDisponibili: 228 },
  { id: "29", nome: "Università degli Studi di SASSARI", iscrittiAppello: 733, iscrittiCorso: 900, postiDisponibili: 312 },
  { id: "30", nome: "Università degli Studi di SIENA", iscrittiAppello: 411, iscrittiCorso: 476, postiDisponibili: 305 },
  { id: "31", nome: "Università degli Studi di TORINO", iscrittiAppello: 2615, iscrittiCorso: 2954, postiDisponibili: 715 },
  { id: "33", nome: "Università degli Studi di TRIESTE", iscrittiAppello: 552, iscrittiCorso: 620, postiDisponibili: 250 },
  { id: "34", nome: "Università degli Studi di UDINE", iscrittiAppello: 373, iscrittiCorso: 404, postiDisponibili: 165 },
  { id: "38", nome: "Università degli Studi della BASILICATA", iscrittiAppello: 230, iscrittiCorso: 272, postiDisponibili: 83 },
  { id: "39", nome: "Università degli Studi del MOLISE", iscrittiAppello: 249, iscrittiCorso: 267, postiDisponibili: 192 },
  { id: "40", nome: "Università degli Studi di VERONA", iscrittiAppello: 996, iscrittiCorso: 1119, postiDisponibili: 365 },
  { id: "41", nome: "Università degli Studi di NAPOLI \"Parthenope\"", iscrittiAppello: 68, iscrittiCorso: 88, postiDisponibili: 88 },
  { id: "46", nome: "Università degli Studi di BRESCIA", iscrittiAppello: 1208, iscrittiCorso: 1327, postiDisponibili: 335 },
  { id: "49", nome: "Università degli Studi della Campania \"Luigi Vanvitelli\"", iscrittiAppello: 1762, iscrittiCorso: 2000, postiDisponibili: 795 },
  { id: "53", nome: "Università degli Studi \"G. d'Annunzio\" CHIETI-PESCARA", iscrittiAppello: 883, iscrittiCorso: 992, postiDisponibili: 356 },
  { id: "55", nome: "Università degli Studi dell'AQUILA", iscrittiAppello: 475, iscrittiCorso: 564, postiDisponibili: 228 },
  { id: "62", nome: "Università degli Studi di TRENTO", iscrittiAppello: 402, iscrittiCorso: 456, postiDisponibili: 80 },
  { id: "A8", nome: "Università degli Studi di TERAMO", iscrittiAppello: 197, iscrittiCorso: 223, postiDisponibili: 80 },
  { id: "C5", nome: "Università degli Studi \"Magna Graecia\" di CATANZARO", iscrittiAppello: 1056, iscrittiCorso: 1213, postiDisponibili: 593 },
  { id: "C6", nome: "Università degli Studi di MILANO-BICOCCA", iscrittiAppello: 974, iscrittiCorso: 1195, postiDisponibili: 211 },
  { id: "C7", nome: "Università degli Studi INSUBRIA Varese-Como", iscrittiAppello: 477, iscrittiCorso: 539, postiDisponibili: 241 },
  { id: "C8", nome: "Università degli Studi del PIEMONTE ORIENTALE", iscrittiAppello: 652, iscrittiCorso: 708, postiDisponibili: 280 },
  { id: "C9", nome: "Università degli Studi di FOGGIA", iscrittiAppello: 633, iscrittiCorso: 733, postiDisponibili: 300 },
];

// Helper function to get enrollment by university ID
export const getEnrollmentById = (id: string): UniversityEnrollmentData | undefined => {
  return universityEnrollments.find(u => u.id === id);
};

// Helper function to get enrollment by university name (partial match)
export const getEnrollmentByName = (name: string): UniversityEnrollmentData | undefined => {
  const normalizedSearch = name.toUpperCase();
  return universityEnrollments.find(u => 
    u.nome.toUpperCase().includes(normalizedSearch) || 
    normalizedSearch.includes(u.nome.toUpperCase())
  );
};
