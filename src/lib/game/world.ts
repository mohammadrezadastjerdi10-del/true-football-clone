// Static world data for the game: countries, leagues, clubs, name pools and a
// handful of marquee real-world stars for the biggest clubs. Original data set
// modelled on the structure of classic football manager games.

import type { Pos } from "./types";

export interface CountryDef {
  id: string;
  name: string;
  flag: string;
}

export const COUNTRIES: CountryDef[] = [
  { id: "eng", name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "esp", name: "Spain", flag: "🇪🇸" },
  { id: "ita", name: "Italy", flag: "🇮🇹" },
  { id: "ger", name: "Germany", flag: "🇩🇪" },
  { id: "fra", name: "France", flag: "🇫🇷" },
  { id: "por", name: "Portugal", flag: "🇵🇹" },
  { id: "ned", name: "Netherlands", flag: "🇳🇱" },
  { id: "sco", name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { id: "tur", name: "Turkey", flag: "🇹🇷" },
  { id: "gre", name: "Greece", flag: "🇬🇷" },
  { id: "pol", name: "Poland", flag: "🇵🇱" },
  { id: "bel", name: "Belgium", flag: "🇧🇪" },
  { id: "bra", name: "Brazil", flag: "🇧🇷" },
  { id: "arg", name: "Argentina", flag: "🇦🇷" },
  { id: "usa", name: "United States", flag: "🇺🇸" },
  { id: "mex", name: "Mexico", flag: "🇲🇽" },
];

// Additional nationalities used for the transfer market and squad variety.
export const EXTRA_COUNTRIES: CountryDef[] = [
  { id: "nig", name: "Nigeria", flag: "🇳🇬" },
  { id: "sen", name: "Senegal", flag: "🇸🇳" },
  { id: "civ", name: "Ivory Coast", flag: "🇨🇮" },
  { id: "mar", name: "Morocco", flag: "🇲🇦" },
  { id: "egy", name: "Egypt", flag: "🇪🇬" },
  { id: "jpn", name: "Japan", flag: "🇯🇵" },
  { id: "kor", name: "South Korea", flag: "🇰🇷" },
  { id: "cro", name: "Croatia", flag: "🇭🇷" },
  { id: "srb", name: "Serbia", flag: "🇷🇸" },
  { id: "den", name: "Denmark", flag: "🇩🇰" },
  { id: "nor", name: "Norway", flag: "🇳🇴" },
  { id: "swe", name: "Sweden", flag: "🇸🇪" },
  { id: "ukr", name: "Ukraine", flag: "🇺🇦" },
  { id: "uru", name: "Uruguay", flag: "🇺🇾" },
  { id: "col", name: "Colombia", flag: "🇨🇴" },
  { id: "chi", name: "Chile", flag: "🇨🇱" },
  { id: "per", name: "Peru", flag: "🇵🇪" },
  { id: "par", name: "Paraguay", flag: "🇵🇾" },
  { id: "ecu", name: "Ecuador", flag: "🇪🇨" },
  { id: "aus", name: "Australia", flag: "🇦🇺" },
  { id: "irn", name: "Iran", flag: "🇮🇷" },
  { id: "sui", name: "Switzerland", flag: "🇨🇭" },
  { id: "aut", name: "Austria", flag: "🇦🇹" },
  { id: "cze", name: "Czechia", flag: "🇨🇿" },
  { id: "rou", name: "Romania", flag: "🇷🇴" },
  { id: "hun", name: "Hungary", flag: "🇭🇺" },
  { id: "can", name: "Canada", flag: "🇨🇦" },
];

export const ALL_COUNTRIES: CountryDef[] = [...COUNTRIES, ...EXTRA_COUNTRIES];

export function countryById(id: string): CountryDef {
  return ALL_COUNTRIES.find((c) => c.id === id) ?? { id, name: id.toUpperCase(), flag: "🏳️" };
}

export interface ClubDef {
  id: string;
  name: string;
  short: string;
  league: string;
  country: string;
  p1: string;
  p2: string;
  stadium: string;
  tier: number; // 1 = strongest club in the league
}

export interface LeagueDef {
  id: string;
  name: string;
  countryId: string;
  flag: string;
  clubs: ClubDef[];
}

// [slug, name, short, primary, secondary, stadium, tier]
type ClubTuple = [string, string, string, string, string, string, number];

function buildClubs(league: string, country: string, rows: ClubTuple[]): ClubDef[] {
  return rows.map(([slug, name, short, p1, p2, stadium, tier]) => ({
    id: `${league}-${slug}`,
    name,
    short,
    league,
    country,
    p1,
    p2,
    stadium,
    tier,
  }));
}

export const LEAGUES: LeagueDef[] = [
  {
    id: "eng",
    name: "Premier League",
    countryId: "eng",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    clubs: buildClubs("eng", "eng", [
      ["man-city", "Manchester City", "MCI", "#6CABDD", "#1C2C5B", "Etihad Stadium", 1],
      ["arsenal", "Arsenal", "ARS", "#EF0107", "#FFFFFF", "Emirates Stadium", 1],
      ["liverpool", "Liverpool", "LIV", "#C8102E", "#F6EB61", "Anfield", 1],
      ["man-utd", "Manchester United", "MUN", "#DA291C", "#FBE122", "Old Trafford", 1],
      ["chelsea", "Chelsea", "CHE", "#034694", "#FFFFFF", "Stamford Bridge", 1],
      ["tottenham", "Tottenham Hotspur", "TOT", "#132257", "#FFFFFF", "Tottenham Hotspur Stadium", 2],
      ["newcastle", "Newcastle United", "NEW", "#241F20", "#FFFFFF", "St James' Park", 2],
      ["aston-villa", "Aston Villa", "AVL", "#670E36", "#95BFE5", "Villa Park", 2],
      ["brighton", "Brighton", "BHA", "#0057B8", "#FFFFFF", "Amex Stadium", 2],
      ["west-ham", "West Ham United", "WHU", "#7A263A", "#1BB1E7", "London Stadium", 2],
      ["everton", "Everton", "EVE", "#003399", "#FFFFFF", "Goodison Park", 3],
      ["crystal-palace", "Crystal Palace", "CRY", "#1B458F", "#C4122E", "Selhurst Park", 3],
    ]),
  },
  {
    id: "esp",
    name: "La Liga",
    countryId: "esp",
    flag: "🇪🇸",
    clubs: buildClubs("esp", "esp", [
      ["real-madrid", "Real Madrid", "RMA", "#FEBE10", "#231F20", "Santiago Bernabéu", 1],
      ["barcelona", "FC Barcelona", "BAR", "#A50044", "#004D98", "Camp Nou", 1],
      ["atletico", "Atlético Madrid", "ATM", "#CB3524", "#FFFFFF", "Metropolitano", 1],
      ["athletic", "Athletic Bilbao", "ATH", "#EE2523", "#FFFFFF", "San Mamés", 2],
      ["real-sociedad", "Real Sociedad", "RSO", "#0067B1", "#FFFFFF", "Anoeta", 2],
      ["villarreal", "Villarreal", "VIL", "#FFE667", "#005187", "Estadio de la Cerámica", 2],
      ["betis", "Real Betis", "BET", "#00954C", "#FFFFFF", "Benito Villamarín", 2],
      ["sevilla", "Sevilla", "SEV", "#D8121A", "#FFFFFF", "Ramón Sánchez-Pizjuán", 2],
      ["valencia", "Valencia", "VAL", "#EE7F00", "#000000", "Mestalla", 3],
      ["girona", "Girona", "GIR", "#CD2534", "#FFFFFF", "Montilivi", 2],
      ["osasuna", "Osasuna", "OSA", "#D91A21", "#0A3468", "El Sadar", 3],
      ["mallorca", "Mallorca", "MLL", "#E30613", "#000000", "Son Moix", 3],
    ]),
  },
  {
    id: "ita",
    name: "Serie A",
    countryId: "ita",
    flag: "🇮🇹",
    clubs: buildClubs("ita", "ita", [
      ["inter", "Inter Milan", "INT", "#00529F", "#000000", "San Siro", 1],
      ["milan", "AC Milan", "MIL", "#FB090B", "#000000", "San Siro", 1],
      ["juventus", "Juventus", "JUV", "#000000", "#FFFFFF", "Allianz Stadium", 1],
      ["napoli", "Napoli", "NAP", "#009CDE", "#FFFFFF", "Diego Armando Maradona", 1],
      ["roma", "Roma", "ROM", "#8E1F2F", "#F0BC42", "Stadio Olimpico", 2],
      ["lazio", "Lazio", "LAZ", "#7BB7D4", "#FFFFFF", "Stadio Olimpico", 2],
      ["atalanta", "Atalanta", "ATA", "#1E71B8", "#000000", "Gewiss Stadium", 1],
      ["fiorentina", "Fiorentina", "FIO", "#582C83", "#FFFFFF", "Artemio Franchi", 2],
      ["bologna", "Bologna", "BOL", "#A61B29", "#000000", "Renato Dall'Ara", 2],
      ["torino", "Torino", "TOR", "#881F2F", "#FFFFFF", "Olimpico Grande Torino", 3],
      ["genoa", "Genoa", "GEN", "#C30E2E", "#003399", "Luigi Ferraris", 3],
      ["udinese", "Udinese", "UDI", "#000000", "#FFFFFF", "Bluenergy Stadium", 3],
    ]),
  },
  {
    id: "ger",
    name: "Bundesliga",
    countryId: "ger",
    flag: "🇩🇪",
    clubs: buildClubs("ger", "ger", [
      ["bayern", "Bayern Munich", "BAY", "#DC052D", "#FFFFFF", "Allianz Arena", 1],
      ["dortmund", "Borussia Dortmund", "BVB", "#FDE100", "#000000", "Signal Iduna Park", 1],
      ["leverkusen", "Bayer Leverkusen", "B04", "#E32221", "#000000", "BayArena", 1],
      ["leipzig", "RB Leipzig", "RBL", "#DD0741", "#FFFFFF", "Red Bull Arena", 1],
      ["frankfurt", "Eintracht Frankfurt", "SGE", "#E1000F", "#000000", "Deutsche Bank Park", 2],
      ["stuttgart", "VfB Stuttgart", "VFB", "#E32219", "#FFFFFF", "MHPArena", 2],
      ["wolfsburg", "Wolfsburg", "WOB", "#65B32E", "#FFFFFF", "Volkswagen Arena", 2],
      ["gladbach", "Borussia M'gladbach", "BMG", "#000000", "#FFFFFF", "Borussia-Park", 3],
      ["freiburg", "SC Freiburg", "SCF", "#E0002C", "#000000", "Europa-Park Stadion", 2],
      ["hoffenheim", "Hoffenheim", "TSG", "#1961B5", "#FFFFFF", "PreZero Arena", 3],
      ["werder", "Werder Bremen", "SVW", "#1D9053", "#FFFFFF", "Weserstadion", 3],
      ["mainz", "Mainz 05", "M05", "#C3141E", "#FFFFFF", "Mewa Arena", 3],
    ]),
  },
  {
    id: "fra",
    name: "Ligue 1",
    countryId: "fra",
    flag: "🇫🇷",
    clubs: buildClubs("fra", "fra", [
      ["psg", "Paris Saint-Germain", "PSG", "#004170", "#DA291C", "Parc des Princes", 1],
      ["marseille", "Marseille", "OM", "#2FAEE0", "#FFFFFF", "Stade Vélodrome", 1],
      ["monaco", "Monaco", "ASM", "#E63312", "#FFFFFF", "Stade Louis II", 2],
      ["lyon", "Lyon", "OL", "#1B458F", "#DA001A", "Groupama Stadium", 2],
      ["lille", "Lille", "LIL", "#E01E13", "#FFFFFF", "Stade Pierre-Mauroy", 2],
      ["nice", "Nice", "NIC", "#D71920", "#000000", "Allianz Riviera", 2],
      ["rennes", "Rennes", "REN", "#E13324", "#FFFFFF", "Roazhon Park", 2],
      ["lens", "Lens", "RCL", "#FFD700", "#C8102E", "Stade Bollaert-Delelis", 2],
      ["nantes", "Nantes", "NAN", "#FFD700", "#00843D", "Stade de la Beaujoire", 3],
      ["strasbourg", "Strasbourg", "STR", "#009FE3", "#FFFFFF", "Stade de la Meinau", 3],
      ["toulouse", "Toulouse", "TFC", "#5C1F8F", "#FFFFFF", "Stadium de Toulouse", 3],
      ["reims", "Reims", "REI", "#C8102E", "#FFFFFF", "Stade Auguste-Delaune", 3],
    ]),
  },
  {
    id: "por",
    name: "Primeira Liga",
    countryId: "por",
    flag: "🇵🇹",
    clubs: buildClubs("por", "por", [
      ["benfica", "Benfica", "BEN", "#E30613", "#FFFFFF", "Estádio da Luz", 1],
      ["porto", "Porto", "POR", "#00428C", "#FFFFFF", "Estádio do Dragão", 1],
      ["sporting", "Sporting CP", "SPO", "#008057", "#FFFFFF", "Estádio José Alvalade", 1],
      ["braga", "Braga", "BRA", "#C8102E", "#FFFFFF", "Estádio Municipal de Braga", 2],
      ["guimaraes", "Vitória Guimarães", "VSC", "#FFFFFF", "#000000", "Estádio D. Afonso Henriques", 2],
      ["boavista", "Boavista", "BOA", "#000000", "#FFFFFF", "Estádio do Bessa", 3],
      ["famalicao", "Famalicão", "FAM", "#4B0082", "#FFFFFF", "Estádio Municipal de Famalicão", 3],
      ["gil-vicente", "Gil Vicente", "GIL", "#B22222", "#FFFFFF", "Estádio Cidade de Barcelos", 3],
      ["estoril", "Estoril", "EST", "#FFFF00", "#000000", "Estádio António Coimbra da Mota", 3],
      ["rio-ave", "Rio Ave", "RAV", "#008000", "#FFFFFF", "Estádio dos Arcos", 3],
      ["arouca", "Arouca", "ARO", "#DAA520", "#000000", "Estádio Municipal de Arouca", 4],
      ["casa-pia", "Casa Pia", "CSP", "#000000", "#FFFFFF", "Estádio Pina Manique", 4],
    ]),
  },
  {
    id: "ned",
    name: "Eredivisie",
    countryId: "ned",
    flag: "🇳🇱",
    clubs: buildClubs("ned", "ned", [
      ["ajax", "Ajax", "AJA", "#D2122E", "#FFFFFF", "Johan Cruyff Arena", 1],
      ["psv", "PSV Eindhoven", "PSV", "#ED1C24", "#FFFFFF", "Philips Stadion", 1],
      ["feyenoord", "Feyenoord", "FEY", "#D71920", "#FFFFFF", "De Kuip", 1],
      ["az", "AZ Alkmaar", "AZ", "#C8102E", "#FFFFFF", "AFAS Stadion", 2],
      ["twente", "Twente", "TWE", "#D71920", "#FFFFFF", "De Grolsch Veste", 2],
      ["utrecht", "FC Utrecht", "UTR", "#FFFFFF", "#D71920", "Stadion Galgenwaard", 2],
      ["vitesse", "Vitesse", "VIT", "#FFFF00", "#000000", "GelreDome", 3],
      ["heerenveen", "Heerenveen", "HEE", "#0067B1", "#FFFFFF", "Abe Lenstra Stadion", 3],
      ["groningen", "Groningen", "GRO", "#008A44", "#FFFFFF", "Euroborg", 3],
      ["sparta", "Sparta Rotterdam", "SPA", "#C8102E", "#FFFFFF", "Het Kasteel", 3],
      ["nec", "NEC Nijmegen", "NEC", "#C8102E", "#000000", "Goffertstadion", 3],
      ["go-ahead", "Go Ahead Eagles", "GAE", "#D71920", "#FFFFFF", "De Adelaarshorst", 3],
    ]),
  },
  {
    id: "sco",
    name: "Premiership",
    countryId: "sco",
    flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    clubs: buildClubs("sco", "sco", [
      ["celtic", "Celtic", "CEL", "#018749", "#FFFFFF", "Celtic Park", 1],
      ["rangers", "Rangers", "RAN", "#1B458F", "#FFFFFF", "Ibrox Stadium", 1],
      ["aberdeen", "Aberdeen", "ABE", "#E21C22", "#FFFFFF", "Pittodrie", 2],
      ["hearts", "Heart of Midlothian", "HEA", "#6B1F3A", "#FFFFFF", "Tynecastle Park", 2],
      ["hibs", "Hibernian", "HIB", "#007A33", "#FFFFFF", "Easter Road", 2],
      ["dundee-utd", "Dundee United", "DUN", "#EE7F00", "#000000", "Tannadice Park", 3],
      ["st-mirren", "St Mirren", "STM", "#000000", "#FFFFFF", "SMiSA Stadium", 3],
      ["motherwell", "Motherwell", "MOT", "#C8102E", "#FFB81C", "Fir Park", 3],
      ["kilmarnock", "Kilmarnock", "KIL", "#005EB8", "#FFFFFF", "Rugby Park", 3],
      ["st-johnstone", "St Johnstone", "STJ", "#007B3E", "#FFFFFF", "McDiarmid Park", 3],
      ["ross-county", "Ross County", "ROS", "#002B5C", "#FFFFFF", "Victoria Park", 4],
      ["dundee", "Dundee", "DND", "#003399", "#FFFFFF", "Dens Park", 4],
    ]),
  },
  {
    id: "tur",
    name: "Süper Lig",
    countryId: "tur",
    flag: "🇹🇷",
    clubs: buildClubs("tur", "tur", [
      ["galatasaray", "Galatasaray", "GAL", "#E30A17", "#FDB913", "Rams Park", 1],
      ["fenerbahce", "Fenerbahçe", "FEN", "#FFED00", "#001F5C", "Ülker Stadyumu", 1],
      ["besiktas", "Beşiktaş", "BES", "#000000", "#FFFFFF", "Vodafone Park", 1],
      ["trabzonspor", "Trabzonspor", "TRA", "#6C1D45", "#0067B1", "Şenol Güneş Spor Kompleksi", 2],
      ["basaksehir", "İstanbul Başakşehir", "BAS", "#F5821F", "#000000", "Başakşehir Fatih Terim", 2],
      ["alanyaspor", "Alanyaspor", "ALA", "#ED1C24", "#FFFFFF", "Bahçeşehir Okulları Stadyumu", 3],
      ["sivasspor", "Sivasspor", "SIV", "#C8102E", "#FFFFFF", "Yeni 4 Eylül Stadyumu", 3],
      ["konyaspor", "Konyaspor", "KON", "#00843D", "#FFFFFF", "Konya Büyükşehir Stadyumu", 3],
      ["kasimpasa", "Kasımpaşa", "KAS", "#00008B", "#FFFFFF", "Recep Tayyip Erdoğan Stadyumu", 3],
      ["antalyaspor", "Antalyaspor", "ANT", "#E30613", "#FFFFFF", "Corendon Airlines Park", 3],
      ["gaziantep", "Gaziantep FK", "GFK", "#ED1C24", "#000000", "Kalyon Stadyumu", 3],
      ["adana-demir", "Adana Demirspor", "ADS", "#0078BF", "#FFD700", "Yeni Adana Stadyumu", 3],
    ]),
  },
  {
    id: "gre",
    name: "Super League",
    countryId: "gre",
    flag: "🇬🇷",
    clubs: buildClubs("gre", "gre", [
      ["olympiacos", "Olympiacos", "OLY", "#D71920", "#FFFFFF", "Karaiskakis Stadium", 1],
      ["panathinaikos", "Panathinaikos", "PAO", "#00843D", "#FFFFFF", "Apostolos Nikolaidis", 1],
      ["aek", "AEK Athens", "AEK", "#FFD700", "#000000", "OPAP Arena", 1],
      ["paok", "PAOK", "PAOK", "#000000", "#FFFFFF", "Toumba Stadium", 1],
      ["aris", "Aris", "ARI", "#FFFF00", "#000000", "Kleanthis Vikelidis", 2],
      ["asteras", "Asteras Tripolis", "AST", "#1B458F", "#FFFFFF", "Theodoros Kolokotronis", 3],
      ["atromitos", "Atromitos", "ATR", "#0000FF", "#FFFFFF", "Peristeri Stadium", 3],
      ["ofi", "OFI Crete", "OFI", "#000000", "#FFFFFF", "Theodoros Vardinogiannis", 3],
      ["volos", "Volos", "VOL", "#1E90FF", "#FFFFFF", "Panthessaliko Stadium", 3],
      ["lamia", "Lamia", "LAM", "#0066CC", "#FFFFFF", "Lamia Municipal Stadium", 4],
      ["panserraikos", "Panserraikos", "PAN", "#FF0000", "#000000", "Serres Municipal Stadium", 4],
      ["levadiakos", "Levadiakos", "LEV", "#008000", "#FFFFFF", "Levadia Municipal Stadium", 4],
    ]),
  },
  {
    id: "pol",
    name: "Ekstraklasa",
    countryId: "pol",
    flag: "🇵🇱",
    clubs: buildClubs("pol", "pol", [
      ["legia", "Legia Warsaw", "LEG", "#00843D", "#FFFFFF", "Stadion Wojska Polskiego", 1],
      ["lech", "Lech Poznań", "LEC", "#0033A0", "#FFFFFF", "Enea Stadion", 1],
      ["rakow", "Raków Częstochowa", "RAK", "#ED1C24", "#002B5C", "Miejski Stadion Piłki Nożnej", 1],
      ["gornik", "Górnik Zabrze", "GOR", "#0000A0", "#FFFFFF", "Arena Zabrze", 2],
      ["pogon", "Pogoń Szczecin", "POG", "#6A2C91", "#FFFFFF", "Stadion Miejski", 2],
      ["jagiellonia", "Jagiellonia Białystok", "JAG", "#FFD700", "#000000", "Chorten Arena", 2],
      ["lechia", "Lechia Gdańsk", "LGD", "#00A651", "#FFFFFF", "Polsat Plus Arena", 2],
      ["widzew", "Widzew Łódź", "WID", "#ED1C24", "#FFFFFF", "Stadion Widzewa", 3],
      ["cracovia", "Cracovia", "CRA", "#ED1C24", "#FFFFFF", "Stadion Cracovii", 3],
      ["korona", "Korona Kielce", "KOR", "#ED1C24", "#FFFFFF", "Suzuki Arena", 3],
      ["stal", "Stal Mielec", "STM2", "#0033A0", "#FFFFFF", "Stadion Stali Mielec", 3],
      ["slask", "Śląsk Wrocław", "SLA", "#1B458F", "#FFFFFF", "Tarczyński Arena", 3],
    ]),
  },
  {
    id: "bel",
    name: "Pro League",
    countryId: "bel",
    flag: "🇧🇪",
    clubs: buildClubs("bel", "bel", [
      ["club-brugge", "Club Brugge", "BRU", "#0057B8", "#000000", "Jan Breydelstadion", 1],
      ["anderlecht", "Anderlecht", "AND", "#4B0082", "#FFFFFF", "Lotto Park", 1],
      ["genk", "Genk", "GNK", "#0067B1", "#FFFFFF", "Cegeka Arena", 1],
      ["antwerp", "Royal Antwerp", "ANT", "#ED1C24", "#FFFFFF", "Bosuilstadion", 1],
      ["gent", "Gent", "GNT", "#0067B1", "#FFFFFF", "Ghelamco Arena", 2],
      ["standard", "Standard Liège", "STL", "#E30613", "#FFFFFF", "Stade Maurice Dufrasne", 2],
      ["union-sg", "Union SG", "USG", "#FFD700", "#000000", "Stade Joseph Marien", 1],
      ["charleroi", "Charleroi", "CHA", "#000000", "#FFFFFF", "Stade du Pays de Charleroi", 3],
      ["mechelen", "Mechelen", "MEC", "#FFD700", "#000000", "AFAS Stadion", 3],
      ["sint-truiden", "Sint-Truiden", "STV", "#FFD700", "#000000", "Stayen", 3],
      ["cercle", "Cercle Brugge", "CER", "#000000", "#00843D", "Jan Breydelstadion", 3],
      ["westerlo", "Westerlo", "WES", "#0067B1", "#FFFFFF", "Het Kuipje", 4],
    ]),
  },
  {
    id: "bra",
    name: "Série A",
    countryId: "bra",
    flag: "🇧🇷",
    clubs: buildClubs("bra", "bra", [
      ["flamengo", "Flamengo", "FLA", "#C8102E", "#000000", "Maracanã", 1],
      ["palmeiras", "Palmeiras", "PAL", "#00843D", "#FFFFFF", "Allianz Parque", 1],
      ["corinthians", "Corinthians", "COR", "#000000", "#FFFFFF", "Neo Química Arena", 1],
      ["sao-paulo", "São Paulo", "SAO", "#FFFFFF", "#C8102E", "Morumbis", 1],
      ["santos", "Santos", "SAN", "#FFFFFF", "#000000", "Vila Belmiro", 2],
      ["gremio", "Grêmio", "GRE", "#1B458F", "#000000", "Arena do Grêmio", 2],
      ["internacional", "Internacional", "INT2", "#C8102E", "#FFFFFF", "Beira-Rio", 2],
      ["fluminense", "Fluminense", "FLU", "#7B2D8E", "#FFFFFF", "Maracanã", 2],
      ["botafogo", "Botafogo", "BOT", "#000000", "#FFFFFF", "Nilton Santos", 2],
      ["atletico-mg", "Atlético Mineiro", "CAM", "#000000", "#FFFFFF", "Arena MRV", 2],
      ["cruzeiro", "Cruzeiro", "CRU", "#0033A0", "#FFFFFF", "Mineirão", 3],
      ["vasco", "Vasco da Gama", "VAS", "#000000", "#FFFFFF", "São Januário", 3],
    ]),
  },
  {
    id: "arg",
    name: "Primera División",
    countryId: "arg",
    flag: "🇦🇷",
    clubs: buildClubs("arg", "arg", [
      ["river", "River Plate", "RIV", "#C8102E", "#FFFFFF", "Monumental", 1],
      ["boca", "Boca Juniors", "BOC", "#0033A0", "#FFD700", "La Bombonera", 1],
      ["independiente", "Independiente", "IND", "#C8102E", "#FFFFFF", "Estadio Libertadores de América", 2],
      ["racing", "Racing Club", "RAC", "#00AEEF", "#FFFFFF", "El Cilindro", 2],
      ["san-lorenzo", "San Lorenzo", "SLO", "#1B458F", "#FFFFFF", "Pedro Bidegain", 2],
      ["velez", "Vélez Sarsfield", "VEL", "#0067B1", "#FFFFFF", "José Amalfitani", 2],
      ["estudiantes", "Estudiantes", "EST", "#C8102E", "#FFFFFF", "Jorge Luis Hirschi", 2],
      ["newells", "Newell's Old Boys", "NOB", "#000000", "#C8102E", "Marcelo Bielsa", 3],
      ["lanus", "Lanús", "LAN", "#C8102E", "#FFFFFF", "La Fortaleza", 3],
      ["talleres", "Talleres", "TAL", "#0067B1", "#FFFFFF", "Mario Alberto Kempes", 2],
      ["gimnasia", "Gimnasia LP", "GIM", "#000000", "#FFFFFF", "Juan Carmelo Zerillo", 3],
      ["rosario", "Rosario Central", "ROS", "#0033A0", "#FFD700", "Gigante de Arroyito", 2],
    ]),
  },
  {
    id: "usa",
    name: "MLS",
    countryId: "usa",
    flag: "🇺🇸",
    clubs: buildClubs("usa", "usa", [
      ["inter-miami", "Inter Miami", "MIA", "#E6007E", "#000000", "Chase Stadium", 1],
      ["la-galaxy", "LA Galaxy", "LAG", "#0033A0", "#FFD700", "Dignity Health Sports Park", 1],
      ["lafc", "LAFC", "LAF", "#000000", "#FFB81C", "BMO Stadium", 1],
      ["seattle", "Seattle Sounders", "SEA", "#005C9E", "#77BC1F", "Lumen Field", 1],
      ["atlanta", "Atlanta United", "ATL", "#C8102E", "#000000", "Mercedes-Benz Stadium", 2],
      ["nycfc", "New York City FC", "NYC", "#6CACE4", "#F26522", "Yankee Stadium", 2],
      ["dc-united", "DC United", "DCU", "#000000", "#C8102E", "Audi Field", 2],
      ["portland", "Portland Timbers", "POR", "#C8102E", "#000000", "Providence Park", 2],
      ["chicago", "Chicago Fire", "CHI", "#C8102E", "#000000", "Soldier Field", 3],
      ["toronto", "Toronto FC", "TOR", "#C8102E", "#FFFFFF", "BMO Field", 3],
      ["austin", "Austin FC", "ATX", "#007B3E", "#000000", "Q2 Stadium", 2],
      ["columbus", "Columbus Crew", "CLB", "#FFD700", "#000000", "Lower.com Field", 2],
    ]),
  },
  {
    id: "mex",
    name: "Liga MX",
    countryId: "mex",
    flag: "🇲🇽",
    clubs: buildClubs("mex", "mex", [
      ["america", "Club América", "AME", "#FFD700", "#0033A0", "Estadio Azteca", 1],
      ["chivas", "Chivas Guadalajara", "GUA", "#C8102E", "#FFFFFF", "Estadio Akron", 1],
      ["cruz-azul", "Cruz Azul", "CAZ", "#0067B1", "#FFFFFF", "Estadio Ciudad de los Deportes", 1],
      ["tigres", "Tigres UANL", "TIG", "#FFD700", "#0033A0", "Estadio Universitario", 1],
      ["monterrey", "Monterrey", "MTY", "#0067B1", "#FFFFFF", "Estadio BBVA", 1],
      ["pumas", "Pumas UNAM", "PUM", "#0033A0", "#FFD700", "Estadio Olímpico Universitario", 2],
      ["toluca", "Toluca", "TOL", "#C8102E", "#FFFFFF", "Estadio Nemesio Díez", 2],
      ["leon", "León", "LEO", "#00843D", "#FFFFFF", "Estadio León", 2],
      ["santos", "Santos Laguna", "SLA", "#00843D", "#FFFFFF", "Estadio Corona", 2],
      ["pachuca", "Pachuca", "PAC", "#0033A0", "#FFFFFF", "Estadio Hidalgo", 2],
      ["atlas", "Atlas", "ATL2", "#C8102E", "#000000", "Estadio Jalisco", 3],
      ["tijuana", "Tijuana", "TIJ", "#C8102E", "#000000", "Estadio Caliente", 3],
    ]),
  },
];

export function leagueById(id: string): LeagueDef {
  return LEAGUES.find((l) => l.id === id) ?? LEAGUES[0];
}

export function clubById(id: string): ClubDef {
  for (const l of LEAGUES) {
    const c = l.clubs.find((c) => c.id === id);
    if (c) return c;
  }
  return LEAGUES[0].clubs[0];
}

export const ALL_CLUBS: ClubDef[] = LEAGUES.flatMap((l) => l.clubs);

// ---------------------------------------------------------------------------
// Player name pools per nationality
// ---------------------------------------------------------------------------

export const NAME_POOLS: Record<string, { f: string[]; l: string[] }> = {
  eng: {
    f: ["Harry", "Jack", "Ollie", "Mason", "Declan", "Phil", "Bukayo", "Cole", "Jarrod", "Conor", "Trent", "Kyle", "James", "Marcus", "Jordan", "Reece", "Ben", "Callum", "Aaron", "Lewis"],
    l: ["Kane", "Bellingham", "Saka", "Rice", "Foden", "Palmer", "Rashford", "Watkins", "Maddison", "Gallagher", "Alexander", "Bowen", "Gordon", "Eze", "Trippier", "Shaw", "White", "Sterling", "Grealish", "Toney"],
  },
  esp: {
    f: ["Pedri", "Gavi", "Lamine", "Nico", "Dani", "Mikel", "Rodri", "Álvaro", "Marco", "Pau", "Fabián", "Mikel", "Unai", "Marcos", "Sergio", "Iñaki", "Mikel", "Bryan", "Alejandro", "Jesús"],
    l: ["Yamal", "Olmo", "Merino", "Oyarzabal", "Carvajal", "Morata", "Asensio", "Fati", "Ruiz", "Torres", "Navas", "Llorente", "Simón", "Remiro", "Laporte", "Zubimendi", "Vivian", "Cucurella", "Baena", "Navas"],
  },
  ita: {
    f: ["Gianluigi", "Nicolò", "Sandro", "Federico", "Lorenzo", "Marco", "Matteo", "Davide", "Alessandro", "Giacomo", "Manuel", "Bryan", "Riccardo", "Gianluca", "Andrea", "Nicolò", "Raoul", "Samuele", "Wilfried", "Guglielmo"],
    l: ["Donnarumma", "Barella", "Tonali", "Chiesa", "Pellegrini", "Veratti", "Locatelli", "Frattesi", "Bastoni", "Raspadori", "Scalvini", "Cristante", "Calafiori", "Mancini", "Bellanova", "Cambiaso", "Zaniolo", "Ricci", "Udogie", "Vicario"],
  },
  ger: {
    f: ["Jamal", "Florian", "Joshua", "Kai", "Leroy", "Niklas", "Antonio", "Pascal", "David", "Leon", "Serge", "Robin", "Jonas", "Nico", "Julian", "Karim", "Felix", "Maximilian", "Timo", "Kevin"],
    l: ["Wirtz", "Musiala", "Kimmich", "Havertz", "Sane", "Fulkrug", "Rudiger", "Gross", "Raum", "Goretzka", "Gnabry", "Koch", "Hofmann", "Schlotterbeck", "Brandt", "Adeyemi", "Nmecha", "Mittelstadt", "Werner", "Trapp"],
  },
  fra: {
    f: ["Kylian", "Antoine", "Aurélien", "Eduardo", "Ousmane", "William", "Jules", "Ibrahima", "Dayot", "Adrien", "Matteo", "Marcus", "Randal", "Bradley", "Michael", "Youssouf", "Warren", "Kingsley", "Lucas", "Théo"],
    l: ["Mbappé", "Griezmann", "Tchouaméni", "Camavinga", "Dembélé", "Saliba", "Koundé", "Konaté", "Upamecano", "Rabiot", "Guendouzi", "Thuram", "Kolo Muani", "Barcola", "Olise", "Fofana", "Zaïre-Emery", "Coman", "Hernández", "Digne"],
  },
  por: {
    f: ["Bruno", "Bernardo", "João", "Rafael", "Diogo", "Rúben", "Vitinha", "Gonçalo", "Nuno", "Pedro", "Francisco", "Rúben", "João", "Otávio", "Ricardo", "Tiago", "André", "Gonçalo", "João", "Nélson"],
    l: ["Fernandes", "Silva", "Félix", "Leão", "Jota", "Dias", "Ramos", "Inácio", "Mendes", "Neto", "Conceição", "Neves", "Palhinha", "Horta", "Horta", "Santos", "Gomes", "Guedes", "Cancelo", "Semedo"],
  },
  ned: {
    f: ["Virgil", "Frenkie", "Memphis", "Cody", "Xavi", "Tijjani", "Denzel", "Daley", "Steven", "Jeremie", "Wout", "Jurriën", "Micky", "Joey", "Quinten", "Ryan", "Teun", "Brian", "Donyell", "Mats"],
    l: ["van Dijk", "de Jong", "Depay", "Gakpo", "Simons", "Reijnders", "Dumfries", "Blind", "Bergwijn", "Frimpong", "Weghorst", "Timber", "van de Ven", "Veerman", "Timber", "Gravenberch", "Koopmeiners", "Brobbey", "Malen", "Wieffer"],
  },
  sco: {
    f: ["Andrew", "John", "Scott", "Kieran", "Billy", "Ryan", "Stuart", "Callum", "Grant", "Lewis", "James", "David", "Kenny", "Lyndon", "Lawrence", "Aaron", "Nathan", "Kevin", "Craig", "Josh"],
    l: ["Robertson", "McGinn", "McTominay", "Tierney", "Gilmour", "Christie", "Armstrong", "McGregor", "Hanley", "Ferguson", "Forrest", "Marshall", "McLean", "Dykes", "Shankland", "Hickey", "Patterson", "Nisbet", "Gordon", "Doig"],
  },
  tur: {
    f: ["Hakan", "Arda", "Kenan", "Cengiz", "Yusuf", "Kerem", "Orkun", "Merih", "Barış", "İsmail", "Salih", "Kaan", "Zeki", "Ferdi", "Sacha", "Semih", "Berkay", "Emre", "Uğurcan", "Altay"],
    l: ["Çalhanoğlu", "Güler", "Yıldız", "Ünder", "Yazıcı", "Aktürkoğlu", "Kökçü", "Demiral", "Alper Yılmaz", "Yüksek", "Özcan", "Ayhan", "Çelik", "Kadıoğlu", "Bozey", "Kılıçsoy", "Öztürk", "Mor", "Çakır", "Bayındır"],
  },
  gre: {
    f: ["Anastasios", "Kostas", "Georgios", "Dimitris", "Christos", "Panagiotis", "Petros", "Vangelis", "Fotis", "Giannis", "Marios", "Sotiris", "Andreas", "Charalampos", "Lazaros", "Dimitrios", "Vasilis", "Taxiarchis", "Giorgos", "Manolis"],
    l: ["Bakasetas", "Tsimikas", "Mavropanos", "Pelkas", "Mantalos", "Fortounis", "Kourbelis", "Pavildis", "Ioannidis", "Masouras", "Vlachodimos", "Sokratis", "Bouchalakis", "Giannoulis", "Rota", "Hatzidiakos", "Kostas", "Siopis", "Douvikas", "Tzolakis"],
  },
  pol: {
    f: ["Robert", "Piotr", "Jakub", "Krzysztof", "Bartosz", "Karol", "Mateusz", "Jan", "Tomasz", "Michał", "Szymon", "Przemysław", "Kamil", "Rafał", "Sebastian", "Wojciech", "Łukasz", "Adam", "Marcin", "Paweł"],
    l: ["Lewandowski", "Zieliński", "Kiwior", "Świderski", "Frankowski", "Szymański", "Skóraś", "Bogusz", "Buksa", "Kędziora", "Zalewski", "Moder", "Piątek", "Glik", "Krychowiak", "Szczęsny", "Kamiński", "Błaszczykowski", "Milik", "Grosicki"],
  },
  bel: {
    f: ["Kevin", "Romelu", "Thibaut", "Youri", "Amadou", "Charles", "Jeremy", "Dodi", "Loïs", "Johan", "Arthur", "Zeno", "Maxim", "Orel", "Koni", "Aster", "Mats", "Cédric", "Leandro", "Alexis"],
    l: ["De Bruyne", "Lukaku", "Courtois", "Tielemans", "Onana", "De Ketelaere", "Doku", "Lukebakio", "Openda", "Bakayoko", "Vermeeren", "Debast", "De Cuyper", "Mangala", "Saelemaekers", "Vranckx", "Rits", "Castagne", "Trossard", "Siquet"],
  },
  bra: {
    f: ["Vinícius", "Rodrygo", "Endrick", "Casemiro", "Alisson", "Gabriel", "Bruno", "Raphinha", "Neymar", "Éder", "Marquinhos", "Thiago", "Richarlison", "Antony", "Martinelli", "André", "João", "Wendell", "Murillo", "Estevão"],
    l: ["Júnior", "Silva", "Gomes", "Guimarães", "Martinelli", "Jesus", "Paquetá", "Cunha", "Militao", "Rodrigo", "Vanderson", "Bremer", "Casemiro", "Anthony", "Luiz", "Pedro", "Éverton", "Douglas", "Weverton", "Alisson"],
  },
  arg: {
    f: ["Lionel", "Julián", "Emiliano", "Enzo", "Alexis", "Nicolás", "Cristian", "Lautaro", "Ángel", "Rodrigo", "Leandro", "Gonzalo", "Marcos", "Giovani", "Thiago", "Valentín", "Exequiel", "Guido", "Paulo", "Franco"],
    l: ["Messi", "Álvarez", "Martínez", "Fernández", "Mac Allister", "Otamendi", "Romero", "Martínez", "Di María", "De Paul", "Paredes", "Montiel", "Acuña", "Lo Celso", "Almada", "Barco", "Palacios", "Rodríguez", "Dybala", "Carboni"],
  },
  usa: {
    f: ["Christian", "Weston", "Tyler", "Gio", "Tim", "Antonee", "Chris", "Folarin", "Malik", "Ricardo", "Miles", "Walker", "Brenden", "Djordje", "Jordan", "Matt", "Zack", "Paxton", "Diego", "Cade"],
    l: ["Pulisic", "McKennie", "Adams", "Reyna", "Weah", "Robinson", "Richards", "Balogun", "Tillman", "Pepi", "Robinson", "Zimmerman", "Aaronson", "Mihailovic", "Morris", "Turner", "Steffen", "Aaronson", "Luna", "Cowell"],
  },
  mex: {
    f: ["Hirving", "Santiago", "Edson", "Luis", "Raúl", "Jesús", "Orbelín", "César", "Johan", "Gilberto", "Alexis", "Erick", "Guillermo", "Carlos", "Uriel", "Roberto", "Sebastián", "Andrés", "Rodrigo", "Israel"],
    l: ["Lozano", "Giménez", "Álvarez", "Chávez", "Jiménez", "Gallardo", "Pineda", "Montes", "Vásquez", "Sepúlveda", "Vega", "Sánchez", "Ochoa", "Rodríguez", "Antuna", "Alvarado", "Córdova", "Guardado", "Aguirre", "Reyes"],
  },
  nig: { f: ["Victor", "Ademola", "Alex", "Samuel", "Kelechi", "Wilfred", "Wilfred", "Calvin", "Ola", "Frank", "Taiwo", "Terem", "Sadiq", "Joe", "Rashid", "Semi"], l: ["Osimhen", "Lookman", "Iwobi", "Chukwueze", "Iheanacho", "Ndidi", "Onana", "Bassey", "Aina", "Onuoha", "Awoniyi", "Moffi", "Umar", "Aribo", "Ajayi", "Ajayi"] },
  sen: { f: ["Sadio", "Ismaila", "Kalidou", "Pape", "Iliman", "Nicolas", "Cheikhou", "Idrissa", "Abdou", "Boulaye", "Habib", "Moussa", "Pathé", "Mamadou", "Bamba"], l: ["Mané", "Sarr", "Koulibaly", "Matar Sarr", "Ndiaye", "Jackson", "Kouyaté", "Gueye", "Diallo", "Dia", "Dieng", "Niakhaté", "Ciss", "Loum", "Dieng"] },
  civ: { f: ["Sébastien", "Franck", "Ibrahim", "Nicolas", "Simon", "Jean", "Max", "Oumar", "Seko", "Christian", "Wilfried", "Amad", "Yahia", "Hamed", "Ismaël"], l: ["Haller", "Kessié", "Sangaré", "Pépé", "Adingra", "Seri", "Gradel", "Diakité", "Fofana", "Kouamé", "Singo", "Diallo", "Bamba", "Traorè", "Koné"] },
  mar: { f: ["Achraf", "Yassine", "Hakim", "Azzedine", "Sofyan", "Romain", "Amine", "Bilal", "Ismaël", "Zakaria", "Nayef", "Eliesse", "Ilias", "Oussama", "Youssef"], l: ["Hakimi", "Bounou", "Ziyech", "Ounahi", "Amrabat", "Saïss", "Adli", "El Khannouss", "Sabiri", "Ammallah", "Aguerd", "Ben Seghir", "Chair", "Tarabt", "En-Nesyri"] },
  egy: { f: ["Mohamed", "Omar", "Mostafa", "Mahmoud", "Ahmed", "Karim", "Trezeguet", "Emam", "Hussein", "Zizo", "Marwan", "Mohamed", "Ramadan", "Ahmed", "Eslam"], l: ["Salah", "Marmoush", "Mohamed", "Hassan", "Hegazi", "Benzema", "El Shenawy", "Ashour", "El Shahat", "Fattah", "Attia", "Elneny", "Sobhi", "Fathi", "Tarek"] },
  jpn: { f: ["Takefusa", "Kaoru", "Ritsu", "Daichi", "Wataru", "Hidemasa", "Junya", "Takumi", "Ayase", "Ko", "Yukinari", "Koki", "Ao", "Kubota", "Takuhiro"], l: ["Kubo", "Mitoma", "Doan", "Kamada", "Endo", "Morita", "Ito", "Minamino", "Ueda", "Itakura", "Sugawara", "Machida", "Tanaka", "Tomiyasu", "Nakamura"] },
  kor: { f: ["Heung-min", "Min-jae", "Lee", "Hwang", "Kim", "Cho", "Jung", "Song", "Park", "Kang", "Hong", "Han", "Yun", "Jeong", "Baek"], l: ["Son", "Kim", "Kang-in", "Hee-chan", "Min-jae", "Gue-sung", "Woo-young", "Min-kyu", "Jin-seob", "In-beom", "Hyun-beom", "Seung-ho", "Jun-ho", "Sang-ho", "Seung-woo"] },
  cro: { f: ["Luka", "Mateo", "Josip", "Marcelo", "Andrej", "Ivan", "Mario", "Lovro", "Nikola", "Borna", "Josip", "Petar", "Martin", "Ante", "Marko"], l: ["Modrić", "Kovačić", "Gvardiol", "Brozović", "Kramarić", "Perišić", "Pašalić", "Majer", "Vlašić", "Sosa", "Šutalo", "Livaja", "Erlić", "Budimir", "Livaković"] },
  srb: { f: ["Dušan", "Aleksandar", "Sergej", "Filip", "Nemanja", "Luka", "Strahinja", "Miloš", "Andrija", "Svetozar", "Ivan", "Nikola", "Veljko", "Uroš", "Milan"], l: ["Vlahović", "Mitrović", "Milinković-Savić", "Kostić", "Gudelj", "Jović", "Pavlović", "Veljković", "Živković", "Marković", "Ilić", "Milenković", "Simić", "Spajić", "Gajić"] },
  den: { f: ["Christian", "Pierre-Emile", "Rasmus", "Mikkel", "Joakim", "Andreas", "Jesper", "Morten", "Kasper", "Jonas", "Alexander", "Victor", "Mathias", "Rasmus", "Conrad"], l: ["Eriksen", "Højbjerg", "Højlund", "Damsgaard", "Mæhle", "Christensen", "Lindstrøm", "Hjulmand", "Schmeichel", "Wind", "Bah", "Kristiansen", "Jensen", "Nissen", "Harder"] },
  nor: { f: ["Erling", "Martin", "Alexander", "Sander", "Antonio", "Kristian", "Fredrik", "Jørgen", "Leo", "Oscar", "Emil", "Morten", "Bård", "Sondre", "Håkon"], l: ["Haaland", "Ødegaard", "Sørloth", "Berge", "Nusa", "Thorstvedt", "Aursnes", "Larsen", "Östigård", "Bobb", "Botheim", "Haugen", "Finne", "Rossbach", "Evjen"] },
  swe: { f: ["Alexander", "Emil", "Viktor", "Dejan", "Anthony", "Robin", "Jesper", "Hugo", "Lucas", "Isak", "Gustav", "Mattias", "Joel", "Samuel", "Filip"], l: ["Isak", "Forsberg", "Lindelöf", "Kulusevski", "Elanga", "Olsen", "Karlström", "Larsson", "Bergvall", "Gyökeres", "Nilsson", "Svensson", "Asoro", "Gustafson", "Helander"] },
  ukr: { f: ["Oleksandr", "Andriy", "Viktor", "Mykola", "Roman", "Taras", "Yaroslav", "Ilya", "Yukhym", "Vladyslav", "Danylo", "Maksym", "Artem", "Bohdan", "Oleksiy"], l: ["Zinchenko", "Yarmolenko", "Tsygankov", "Matviyenko", "Yaremchuk", "Stepanenko", "Rakitskyi", "Zabarnyi", "Konoplya", "Sudakov", "Sikan", "Talovyerov", "Dovbyk", "Mykhaylichenko", "Shevchenko"] },
  uru: { f: ["Federico", "Darwin", "Ronald", "Manuel", "Rodrigo", "Matías", "Nicolás", "Facundo", "Sebastián", "Giorgian", "Maximiliano", "Agustín", "Franco", "Emiliano", "Brian"], l: ["Valverde", "Núñez", "Araújo", "Ugarte", "Bentancur", "Vecino", "Olivera", "Torres", "Cáceres", "De Arrascaeta", "Araújo", "Canobbio", "Pellistri", "Martínez", "Rodríguez"] },
  col: { f: ["Luis", "James", "Juan", "Rafael", "Jhon", "Dávinson", "Richard", "Wilmar", "Jefferson", "Mateus", "Daniel", "Yerry", "Carlos", "Jorge", "Santiago"], l: ["Díaz", "Rodríguez", "Cuadrado", "Santos Borré", "Arias", "Sánchez", "Ríos", "Barrios", "Lerma", "Uribe", "Muñoz", "Mina", "Cuesta", "Carrascal", "Araujo"] },
  chi: { f: ["Alexis", "Arturo", "Claudio", "Eduardo", "Gary", "Charles", "Ben", "Diego", "Mauricio", "Víctor", "Felipe", "Jean", "Iván", "Marcelo", "Esteban"], l: ["Sánchez", "Vidal", "Bravo", "Vargas", "Medel", "Aránguiz", "Brereton", "Valdés", "Isla", "Dávila", "Mora", "Meneses", "Morales", "Díaz", "Pavez"] },
  per: { f: ["Paolo", "André", "Renato", "Yoshimar", "Luis", "Christian", "Gianluca", "Pedro", "Sergio", "Miguel", "Alexander", "Carlos", "Marcos", "Edison", "Wilder"], l: ["Guerrero", "Carrillo", "Tapia", "Yotún", "Advíncula", "Cueva", "Lapadula", "Aquino", "Peña", "Trauco", "Callens", "Zambrano", "López", "Flores", "Cartagena"] },
  par: { f: ["Miguel", "Gustavo", "Julio", "Antonio", "Derlis", "Ángel", "Mathías", "Robert", "Carlos", "Richard", "Junior", "Braian", "Juan", "Omar", "Alberto"], l: ["Almirón", "Gómez", "Enciso", "Sanabria", "González", "Romero", "Villazán", "Rojas", "Coronel", "Ortiz", "Alonso", "Samudio", "Escobar", "Alderete", "Espínola"] },
  ecu: { f: ["Moisés", "Enner", "Pervis", "Piero", "Kendry", "Jhegson", "Ángelo", "Gonzalo", "Carlos", "Marlon", "Jeremy", "Alan", "Joao", "Kevin", "Óscar"], l: ["Caicedo", "Valencia", "Estupiñán", "Hincapié", "Páez", "Méndez", "Preciado", "Plata", "Gruezo", "Franco", "Sarmiento", "Minda", "Ortiz", "Rodríguez", "Zambrano"] },
  aus: { f: ["Mathew", "Jackson", "Harry", "Aaron", "Connor", "Riley", "Mitchell", "Ajdin", "Nestory", "Cameron", "Jason", "Garang", "Kusini", "Martin", "Thomas"], l: ["Ryan", "Irvine", "Souttar", "Mooy", "Metcalfe", "McGree", "Duke", "Hrustic", "Irankunda", "Burgess", "Cummings", "Kuol", "Yengi", "Boyle", "Deng"] },
  irn: { f: ["Mehdi", "Sardar", "Alireza", "Saeid", "Ali", "Saman", "Mohammad", "Karim", "Omid", "Hossein", "Amir", "Ramin", "Milad", "Ehsan", "Payam"], l: ["Taremi", "Azmoun", "Jahanbakhsh", "Ezzatollahi", "Gholizadeh", "Ghoddos", "Beiranvand", "Ansarifard", "Noorafkan", "Kanaani", "Jalali", "Rezaeian", "Mohammadi", "Hajsafi", "Niazmand"] },
  sui: { f: ["Granit", "Yann", "Manuel", "Dan", "Remo", "Breel", "Silvan", "Nico", "Fabian", "Ruben", "Michel", "Kevin", "Gregor", "Cedric", "Zeki"], l: ["Xhaka", "Sommer", "Akanji", "Ndoye", "Freuler", "Embolo", "Widmer", "Elvedi", "Schar", "Vargas", "Aebischer", "Rodriguez", "Kobel", "Itten", "Amdouni"] },
  aut: { f: ["David", "Marcel", "Konrad", "Christoph", "Xaver", "Patrick", "Florian", "Michael", "Nicolas", "Kevin", "Marko", "Alexander", "Stefan", "Roman", "Marco"], l: ["Alaba", "Sabitzer", "Laimer", "Baumgartner", "Schlager", "Wimmer", "Gregoritsch", "Arnautović", "Seiwald", "Danz", "Grüll", "Prass", "Posch", "Pentz", "Friedl"] },
  cze: { f: ["Tomáš", "Patrik", "Adam", "Václav", "Lukáš", "Ondřej", "Antonín", "Jan", "Jakub", "Michal", "Pavel", "Martin", "Tomáš", "Matěj", "Vladimír"], l: ["Souček", "Schick", "Hložek", "Černý", "Provod", "Krejčí", "Barák", "Kuchta", "Zima", "Jurásek", "Holeš", "Coufal", "Chorý", "Jurečka", "Covil"] },
  rou: { f: ["Nicolae", "Răzvan", "Dennis", "Ianis", "Vlad", "Florin", "Andrei", "Alexandru", "George", "Marius", "Bogdan", "Valentin", "Claudiu", "Cristian", "Radu"], l: ["Stanciu", "Marin", "Man", "Hagi", "Drăgușin", "Coman", "Rațiu", "Cicaldău", "Pușcaș", "Tănase", "Mihăilă", "Mogoș", "Burlacu", "Alibec", "Drăguș"] },
  hun: { f: ["Dominik", "Péter", "Roland", "Márton", "Attila", "Balázs", "Ádám", "Zsolt", "László", "Milos", "Kevin", "Bendegúz", "Barnabás", "Dávid", "Tamás"], l: ["Szoboszlai", "Gulácsi", "Sallai", "Dárdai", "Fiola", "Dzsudzsák", "Szalai", "Nagy", "Kleinheisler", "Kerkez", "Csoboth", "Bolla", "Varga", "Schäfer", "Kádár"] },
  can: { f: ["Alphonso", "Jonathan", "Tajon", "Cyle", "Stephen", "Liam", "Ismaël", "Dayne", "Samuel", "Lucas", "Mathieu", "Maxime", "Joel", "Richie", "Mark-Anthony"], l: ["Davies", "David", "Buchanan", "Larin", "Eustáquio", "Millar", "Koné", "St. Clair", "Adekugbe", "Cavallini", "Choinière", "Crèpeau", "Waterman", "Laryea", "Kaye"] },
};

// ---------------------------------------------------------------------------
// Marquee real-world stars (approximate 2025/26 squads) for the biggest clubs
// ---------------------------------------------------------------------------

export interface StarRec {
  first: string;
  last: string;
  pos: Pos;
  age: number;
  ovr: number;
}

export const STARS: Record<string, StarRec[]> = {
  "eng-man-city": [
    { first: "Erling", last: "Haaland", pos: "FW", age: 25, ovr: 92 },
    { first: "Rodri", last: "", pos: "MF", age: 29, ovr: 90 },
    { first: "Phil", last: "Foden", pos: "MF", age: 25, ovr: 88 },
    { first: "Rúben", last: "Dias", pos: "DF", age: 28, ovr: 87 },
    { first: "Ederson", last: "", pos: "GK", age: 32, ovr: 87 },
    { first: "Jérémy", last: "Doku", pos: "FW", age: 23, ovr: 84 },
    { first: "Joško", last: "Gvardiol", pos: "DF", age: 23, ovr: 86 },
    { first: "Oscar", last: "Bobb", pos: "FW", age: 22, ovr: 82 },
  ],
  "eng-arsenal": [
    { first: "Bukayo", last: "Saka", pos: "FW", age: 23, ovr: 88 },
    { first: "Martin", last: "Ødegaard", pos: "MF", age: 26, ovr: 88 },
    { first: "William", last: "Saliba", pos: "DF", age: 24, ovr: 87 },
    { first: "Declan", last: "Rice", pos: "MF", age: 26, ovr: 87 },
    { first: "David", last: "Raya", pos: "GK", age: 29, ovr: 86 },
    { first: "Gabriel", last: "Magalhães", pos: "DF", age: 27, ovr: 86 },
    { first: "Kai", last: "Havertz", pos: "FW", age: 26, ovr: 84 },
    { first: "Martin", last: "Ødegaard", pos: "MF", age: 26, ovr: 88 },
  ],
  "eng-liverpool": [
    { first: "Mohamed", last: "Salah", pos: "FW", age: 33, ovr: 90 },
    { first: "Virgil", last: "van Dijk", pos: "DF", age: 34, ovr: 89 },
    { first: "Alisson", last: "Becker", pos: "GK", age: 32, ovr: 89 },
    { first: "Alexis", last: "Mac Allister", pos: "MF", age: 26, ovr: 86 },
    { first: "Trent", last: "Alexander-Arnold", pos: "DF", age: 26, ovr: 86 },
    { first: "Luis", last: "Díaz", pos: "FW", age: 28, ovr: 85 },
    { first: "Dominik", last: "Szoboszlai", pos: "MF", age: 24, ovr: 84 },
  ],
  "eng-man-utd": [
    { first: "Bruno", last: "Fernandes", pos: "MF", age: 30, ovr: 87 },
    { first: "Lisandro", last: "Martínez", pos: "DF", age: 27, ovr: 85 },
    { first: "Kobbie", last: "Mainoo", pos: "MF", age: 20, ovr: 83 },
    { first: "André", last: "Onana", pos: "GK", age: 29, ovr: 84 },
    { first: "Marcus", last: "Rashford", pos: "FW", age: 27, ovr: 84 },
    { first: "Alejandro", last: "Garnacho", pos: "FW", age: 21, ovr: 82 },
  ],
  "eng-chelsea": [
    { first: "Cole", last: "Palmer", pos: "MF", age: 23, ovr: 87 },
    { first: "Enzo", last: "Fernández", pos: "MF", age: 24, ovr: 85 },
    { first: "Moisés", last: "Caicedo", pos: "MF", age: 23, ovr: 85 },
    { first: "Robert", last: "Sánchez", pos: "GK", age: 27, ovr: 82 },
    { first: "Nicolas", last: "Jackson", pos: "FW", age: 24, ovr: 82 },
    { first: "Marc", last: "Cucurella", pos: "DF", age: 27, ovr: 84 },
  ],
  "eng-tottenham": [
    { first: "Son", last: "Heung-min", pos: "FW", age: 33, ovr: 86 },
    { first: "James", last: "Maddison", pos: "MF", age: 28, ovr: 85 },
    { first: "Guglielmo", last: "Vicario", pos: "GK", age: 28, ovr: 84 },
    { first: "Cristian", last: "Romero", pos: "DF", age: 27, ovr: 85 },
  ],
  "esp-real-madrid": [
    { first: "Kylian", last: "Mbappé", pos: "FW", age: 26, ovr: 92 },
    { first: "Vinícius", last: "Júnior", pos: "FW", age: 25, ovr: 91 },
    { first: "Jude", last: "Bellingham", pos: "MF", age: 22, ovr: 91 },
    { first: "Federico", last: "Valverde", pos: "MF", age: 27, ovr: 89 },
    { first: "Thibaut", last: "Courtois", pos: "GK", age: 33, ovr: 89 },
    { first: "Antonio", last: "Rüdiger", pos: "DF", age: 32, ovr: 87 },
    { first: "Eduardo", last: "Camavinga", pos: "MF", age: 22, ovr: 85 },
    { first: "Rodrygo", last: "Goes", pos: "FW", age: 24, ovr: 86 },
  ],
  "esp-barcelona": [
    { first: "Lamine", last: "Yamal", pos: "FW", age: 18, ovr: 90 },
    { first: "Pedri", last: "González", pos: "MF", age: 22, ovr: 88 },
    { first: "Robert", last: "Lewandowski", pos: "FW", age: 37, ovr: 88 },
    { first: "Gavi", last: "Páez", pos: "MF", age: 21, ovr: 86 },
    { first: "Marc-André", last: "ter Stegen", pos: "GK", age: 33, ovr: 87 },
    { first: "Raphinha", last: "Dias", pos: "FW", age: 28, ovr: 86 },
    { first: "Ronald", last: "Araújo", pos: "DF", age: 26, ovr: 85 },
  ],
  "esp-atletico": [
    { first: "Antoine", last: "Griezmann", pos: "FW", age: 34, ovr: 87 },
    { first: "Jan", last: "Oblak", pos: "GK", age: 32, ovr: 88 },
    { first: "Julián", last: "Álvarez", pos: "FW", age: 25, ovr: 85 },
    { first: "Marcos", last: "Llorente", pos: "MF", age: 30, ovr: 85 },
    { first: "Pablo", last: "Barrios", pos: "MF", age: 22, ovr: 83 },
  ],
  "esp-athletic": [
    { first: "Nico", last: "Williams", pos: "FW", age: 23, ovr: 86 },
    { first: "Iñaki", last: "Williams", pos: "FW", age: 31, ovr: 84 },
    { first: "Unai", last: "Simón", pos: "GK", age: 28, ovr: 85 },
  ],
  "ita-inter": [
    { first: "Lautaro", last: "Martínez", pos: "FW", age: 28, ovr: 88 },
    { first: "Nicolò", last: "Barella", pos: "MF", age: 28, ovr: 87 },
    { first: "Alessandro", last: "Bastoni", pos: "DF", age: 26, ovr: 86 },
    { first: "Yann", last: "Sommer", pos: "GK", age: 36, ovr: 86 },
    { first: "Marcus", last: "Thuram", pos: "FW", age: 28, ovr: 85 },
    { first: "Hakan", last: "Çalhanoğlu", pos: "MF", age: 31, ovr: 86 },
  ],
  "ita-milan": [
    { first: "Rafael", last: "Leão", pos: "FW", age: 26, ovr: 87 },
    { first: "Mike", last: "Maignan", pos: "GK", age: 30, ovr: 87 },
    { first: "Theo", last: "Hernández", pos: "DF", age: 28, ovr: 86 },
    { first: "Christian", last: "Pulisic", pos: "FW", age: 27, ovr: 84 },
    { first: "Tijjani", last: "Reijnders", pos: "MF", age: 27, ovr: 85 },
  ],
  "ita-juventus": [
    { first: "Dušan", last: "Vlahović", pos: "FW", age: 25, ovr: 85 },
    { first: "Gleison", last: "Bremer", pos: "DF", age: 28, ovr: 86 },
    { first: "Kenan", last: "Yıldız", pos: "FW", age: 20, ovr: 84 },
    { first: "Manuel", last: "Locatelli", pos: "MF", age: 27, ovr: 84 },
    { first: "Michele", last: "Di Gregorio", pos: "GK", age: 28, ovr: 84 },
  ],
  "ita-napoli": [
    { first: "Khvicha", last: "Kvaratskhelia", pos: "FW", age: 24, ovr: 87 },
    { first: "Victor", last: "Osimhen", pos: "FW", age: 26, ovr: 88 },
    { first: "Stanislav", last: "Lobotka", pos: "MF", age: 30, ovr: 85 },
    { first: "Alex", last: "Meret", pos: "GK", age: 28, ovr: 83 },
  ],
  "ger-bayern": [
    { first: "Harry", last: "Kane", pos: "FW", age: 32, ovr: 91 },
    { first: "Jamal", last: "Musiala", pos: "MF", age: 22, ovr: 89 },
    { first: "Florian", last: "Wirtz", pos: "MF", age: 22, ovr: 89 },
    { first: "Joshua", last: "Kimmich", pos: "MF", age: 30, ovr: 88 },
    { first: "Manuel", last: "Neuer", pos: "GK", age: 39, ovr: 86 },
    { first: "Alphonso", last: "Davies", pos: "DF", age: 24, ovr: 86 },
    { first: "Jamal", last: "Musiala", pos: "MF", age: 22, ovr: 89 },
  ],
  "ger-dortmund": [
    { first: "Serhou", last: "Guirassy", pos: "FW", age: 29, ovr: 84 },
    { first: "Julian", last: "Brandt", pos: "MF", age: 29, ovr: 84 },
    { first: "Gregor", last: "Kobel", pos: "GK", age: 27, ovr: 85 },
    { first: "Jamie", last: "Gittens", pos: "FW", age: 21, ovr: 83 },
  ],
  "ger-leverkusen": [
    { first: "Jeremie", last: "Frimpong", pos: "DF", age: 24, ovr: 84 },
    { first: "Granit", last: "Xhaka", pos: "MF", age: 32, ovr: 85 },
    { first: "Lukáš", last: "Hrádecký", pos: "GK", age: 35, ovr: 83 },
    { first: "Victor", last: "Boniface", pos: "FW", age: 24, ovr: 84 },
  ],
  "fra-psg": [
    { first: "Ousmane", last: "Dembélé", pos: "FW", age: 28, ovr: 88 },
    { first: "Achraf", last: "Hakimi", pos: "DF", age: 26, ovr: 87 },
    { first: "Gianluigi", last: "Donnarumma", pos: "GK", age: 26, ovr: 87 },
    { first: "Vitinha", last: "", pos: "MF", age: 25, ovr: 86 },
    { first: "Bradley", last: "Barcola", pos: "FW", age: 22, ovr: 85 },
    { first: "Warren", last: "Zaïre-Emery", pos: "MF", age: 19, ovr: 84 },
  ],
  "fra-marseille": [
    { first: "Mason", last: "Greenwood", pos: "FW", age: 23, ovr: 84 },
    { first: "Adrien", last: "Rabiot", pos: "MF", age: 30, ovr: 85 },
    { first: "Geronimo", last: "Rulli", pos: "GK", age: 33, ovr: 84 },
  ],
  "fra-lyon": [
    { first: "Alexandre", last: "Lacazette", pos: "FW", age: 34, ovr: 84 },
    { first: "Rayan", last: "Cherki", pos: "FW", age: 22, ovr: 84 },
  ],
  "por-benfica": [
    { first: "Ángel", last: "Di María", pos: "FW", age: 37, ovr: 84 },
    { first: "Nicolás", last: "Otamendi", pos: "DF", age: 37, ovr: 84 },
    { first: "Anatoliy", last: "Trubin", pos: "GK", age: 24, ovr: 84 },
    { first: "Orkun", last: "Kökçü", pos: "MF", age: 24, ovr: 84 },
  ],
  "por-porto": [
    { first: "Diogo", last: "Costa", pos: "GK", age: 25, ovr: 84 },
    { first: "Wendell", last: "", pos: "DF", age: 32, ovr: 82 },
    { first: "Pepê", last: "", pos: "FW", age: 28, ovr: 82 },
  ],
  "por-sporting": [
    { first: "Viktor", last: "Gyökeres", pos: "FW", age: 27, ovr: 88 },
    { first: "Gonçalo", last: "Inácio", pos: "DF", age: 24, ovr: 84 },
    { first: "Franco", last: "Israel", pos: "GK", age: 25, ovr: 82 },
  ],
  "ned-ajax": [
    { first: "Steven", last: "Bergwijn", pos: "FW", age: 27, ovr: 84 },
    { first: "Brian", last: "Brobbey", pos: "FW", age: 23, ovr: 83 },
    { first: "Remko", last: "Pasveer", pos: "GK", age: 41, ovr: 81 },
    { first: "Jorrel", last: "Hato", pos: "DF", age: 19, ovr: 82 },
  ],
  "ned-psv": [
    { first: "Luuk", last: "de Jong", pos: "FW", age: 34, ovr: 83 },
    { first: "Jerdy", last: "Schouten", pos: "MF", age: 28, ovr: 84 },
    { first: "Walter", last: "Benítez", pos: "GK", age: 32, ovr: 83 },
    { first: "Johan", last: "Bakayoko", pos: "FW", age: 22, ovr: 82 },
  ],
  "ned-feyenoord": [
    { first: "Santiago", last: "Giménez", pos: "FW", age: 24, ovr: 83 },
    { first: "Quinten", last: "Timber", pos: "MF", age: 24, ovr: 84 },
    { first: "Justin", last: "Bijlow", pos: "GK", age: 27, ovr: 83 },
  ],
  "sco-celtic": [
    { first: "Callum", last: "McGregor", pos: "MF", age: 31, ovr: 82 },
    { first: "Daizen", last: "Maeda", pos: "FW", age: 27, ovr: 82 },
    { first: "Kasper", last: "Schmeichel", pos: "GK", age: 38, ovr: 82 },
    { first: "Nicolas", last: "Kühn", pos: "FW", age: 25, ovr: 80 },
  ],
  "sco-rangers": [
    { first: "James", last: "Tavernier", pos: "DF", age: 33, ovr: 81 },
    { first: "Jack", last: "Butland", pos: "GK", age: 32, ovr: 82 },
    { first: "Cyriel", last: "Dessers", pos: "FW", age: 30, ovr: 80 },
  ],
  "tur-galatasaray": [
    { first: "Mauro", last: "Icardi", pos: "FW", age: 32, ovr: 84 },
    { first: "Dries", last: "Mertens", pos: "FW", age: 38, ovr: 83 },
    { first: "Fernando", last: "Muslera", pos: "GK", age: 39, ovr: 82 },
    { first: "Barış", last: "Alper Yılmaz", pos: "MF", age: 25, ovr: 82 },
  ],
  "tur-fenerbahce": [
    { first: "Dušan", last: "Tadić", pos: "FW", age: 36, ovr: 84 },
    { first: "Fred", last: "Rodrigues", pos: "MF", age: 32, ovr: 84 },
    { first: "Dominik", last: "Livaković", pos: "GK", age: 30, ovr: 82 },
  ],
  "tur-besiktas": [
    { first: "Ciro", last: "Immobile", pos: "FW", age: 35, ovr: 83 },
    { first: "Milot", last: "Rashica", pos: "FW", age: 29, ovr: 81 },
    { first: "Mert", last: "Günok", pos: "GK", age: 36, ovr: 81 },
  ],
  "gre-olympiacos": [
    { first: "Ayoub", last: "El Kaabi", pos: "FW", age: 32, ovr: 82 },
    { first: "Konstantinos", last: "Tzolakis", pos: "GK", age: 22, ovr: 81 },
    { first: "Sotiris", last: "Alexandropoulos", pos: "MF", age: 24, ovr: 80 },
  ],
  "gre-panathinaikos": [
    { first: "Fotis", last: "Ioannidis", pos: "FW", age: 25, ovr: 80 },
    { first: "Filip", last: "Đuričić", pos: "MF", age: 33, ovr: 79 },
  ],
  "pol-legia": [
    { first: "Bartosz", last: "Kapustka", pos: "MF", age: 29, ovr: 79 },
    { first: "Gabriel", last: "Kobyłak", pos: "GK", age: 23, ovr: 78 },
  ],
  "pol-lech": [
    { first: "Mikael", last: "Ishak", pos: "FW", age: 27, ovr: 80 },
    { first: "Radosław", last: "Murawski", pos: "MF", age: 31, ovr: 79 },
  ],
  "pol-rakow": [
    { first: "Ivi", last: "López", pos: "FW", age: 30, ovr: 78 },
    { first: "Vladan", last: "Kovačević", pos: "GK", age: 27, ovr: 78 },
  ],
  "bra-flamengo": [
    { first: "Giorgian", last: "De Arrascaeta", pos: "MF", age: 31, ovr: 84 },
    { first: "Pedro", last: "Guilherme", pos: "FW", age: 28, ovr: 85 },
    { first: "Agustín", last: "Rossi", pos: "GK", age: 31, ovr: 83 },
    { first: "Wesley", last: "França", pos: "DF", age: 22, ovr: 81 },
  ],
  "bra-palmeiras": [
    { first: "Estevão", last: "Willian", pos: "FW", age: 18, ovr: 85 },
    { first: "Raphael", last: "Veiga", pos: "MF", age: 30, ovr: 84 },
    { first: "Weverton", last: "Pereira", pos: "GK", age: 37, ovr: 82 },
  ],
  "bra-botafogo": [
    { first: "Luiz", last: "Henrique", pos: "FW", age: 24, ovr: 84 },
    { first: "John", last: "Victor", pos: "GK", age: 29, ovr: 81 },
  ],
  "arg-river": [
    { first: "Sebastián", last: "Driussi", pos: "FW", age: 28, ovr: 82 },
    { first: "Franco", last: "Armani", pos: "GK", age: 39, ovr: 81 },
    { first: "Claudio", last: "Echeverri", pos: "MF", age: 19, ovr: 82 },
  ],
  "arg-boca": [
    { first: "Edinson", last: "Cavani", pos: "FW", age: 38, ovr: 82 },
    { first: "Leandro", last: "Brey", pos: "GK", age: 26, ovr: 80 },
    { first: "Kevin", last: "Zenón", pos: "MF", age: 24, ovr: 81 },
  ],
  "usa-inter-miami": [
    { first: "Lionel", last: "Messi", pos: "FW", age: 38, ovr: 91 },
    { first: "Luis", last: "Suárez", pos: "FW", age: 38, ovr: 86 },
    { first: "Sergio", last: "Busquets", pos: "MF", age: 37, ovr: 85 },
    { first: "Jordi", last: "Alba", pos: "DF", age: 36, ovr: 84 },
    { first: "Drake", last: "Callender", pos: "GK", age: 27, ovr: 80 },
  ],
  "usa-la-galaxy": [
    { first: "Joseph", last: "Paintsil", pos: "FW", age: 27, ovr: 81 },
    { first: "Riqui", last: "Puig", pos: "MF", age: 26, ovr: 82 },
  ],
  "mex-america": [
    { first: "Alejandro", last: "Zendejas", pos: "MF", age: 27, ovr: 82 },
    { first: "Luis", last: "Maldonado", pos: "GK", age: 29, ovr: 81 },
    { first: "Henry", last: "Martín", pos: "FW", age: 32, ovr: 81 },
  ],
  "mex-cruz-azul": [
    { first: "Carlos", last: "Romo", pos: "MF", age: 29, ovr: 81 },
    { first: "Kevin", last: "Mier", pos: "FW", age: 25, ovr: 80 },
  ],
  "mex-tigres": [
    { first: "André-Pierre", last: "Gignac", pos: "FW", age: 39, ovr: 82 },
    { first: "Nahuel", last: "Guzmán", pos: "GK", age: 39, ovr: 80 },
    { first: "Juan", last: "Brunetta", pos: "MF", age: 27, ovr: 80 },
  ],
  "mex-monterrey": [
    { first: "Sergio", last: "Canales", pos: "MF", age: 34, ovr: 83 },
    { first: "Esteban", last: "Andrada", pos: "GK", age: 34, ovr: 81 },
  ],
};

export function starsFor(clubId: string): StarRec[] {
  return STARS[clubId] ?? [];
}

export const SEASON_START_YEAR = 2025;
