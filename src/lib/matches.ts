import type { TeamAbbr } from "@/types";

export const TEAMS: Record<string, TeamAbbr> = {
  MEX:{name:"México",flag:"🇲🇽"}, ZAF:{name:"Sudáfrica",flag:"🇿🇦"}, KOR:{name:"Corea del Sur",flag:"🇰🇷"}, CZE:{name:"Rep. Checa",flag:"🇨🇿"},
  CAN:{name:"Canadá",flag:"🇨🇦"}, BIH:{name:"Bosnia",flag:"🇧🇦"}, QAT:{name:"Qatar",flag:"🇶🇦"}, SUI:{name:"Suiza",flag:"🇨🇭"},
  BRA:{name:"Brasil",flag:"🇧🇷"}, MAR:{name:"Marruecos",flag:"🇲🇦"}, HAI:{name:"Haití",flag:"🇭🇹"}, SCO:{name:"Escocia",flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿"},
  USA:{name:"Estados Unidos",flag:"🇺🇸"}, PAR:{name:"Paraguay",flag:"🇵🇾"}, AUS:{name:"Australia",flag:"🇦🇺"}, TUR:{name:"Turquía",flag:"🇹🇷"},
  GER:{name:"Alemania",flag:"🇩🇪"}, CUW:{name:"Curazao",flag:"🇨🇼"}, CIV:{name:"C. de Marfil",flag:"🇨🇮"}, ECU:{name:"Ecuador",flag:"🇪🇨"},
  NED:{name:"Países Bajos",flag:"🇳🇱"}, JPN:{name:"Japón",flag:"🇯🇵"}, SWE:{name:"Suecia",flag:"🇸🇪"}, TUN:{name:"Túnez",flag:"🇹🇳"},
  BEL:{name:"Bélgica",flag:"🇧🇪"}, EGY:{name:"Egipto",flag:"🇪🇬"}, IRN:{name:"Irán",flag:"🇮🇷"}, NZL:{name:"Nueva Zelanda",flag:"🇳🇿"},
  ESP:{name:"España",flag:"🇪🇸"}, CPV:{name:"Cabo Verde",flag:"🇨🇻"}, KSA:{name:"Arabia Saudí",flag:"🇸🇦"}, URU:{name:"Uruguay",flag:"🇺🇾"},
  FRA:{name:"Francia",flag:"🇫🇷"}, SEN:{name:"Senegal",flag:"🇸🇳"}, IRQ:{name:"Irak",flag:"🇮🇶"}, NOR:{name:"Noruega",flag:"🇳🇴"},
  ARG:{name:"Argentina",flag:"🇦🇷"}, ALG:{name:"Argelia",flag:"🇩🇿"}, AUT:{name:"Austria",flag:"🇦🇹"}, JOR:{name:"Jordania",flag:"🇯🇴"},
  POR:{name:"Portugal",flag:"🇵🇹"}, CGO:{name:"Congo",flag:"🇨🇬"}, UZB:{name:"Uzbekistán",flag:"🇺🇿"}, COL:{name:"Colombia",flag:"🇨🇴"},
  ENG:{name:"Inglaterra",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"}, CRO:{name:"Croacia",flag:"🇭🇷"}, GHA:{name:"Ghana",flag:"🇬🇭"}, PAN:{name:"Panamá",flag:"🇵🇦"},
};

// Horarios en hora peninsular española (CEST). Jornada 1 y partidos de España
// verificados en fuentes españolas (RTVE/DAZN/eldiario); el resto estimado por
// franja local (12/15/18/21h) + huso horario de la sede.
export const MATCHES: [string, string, string, string, string][] = [
  // Grupo A
  ["MEX","ZAF","A","11/06","21:00"],["KOR","CZE","A","12/06","04:00"],
  ["CZE","ZAF","A","18/06","19:00"],["MEX","KOR","A","18/06","21:00"],
  ["CZE","MEX","A","24/06","21:00"],["ZAF","KOR","A","24/06","21:00"],
  // Grupo B
  ["CAN","BIH","B","12/06","21:00"],["QAT","SUI","B","13/06","21:00"],
  ["SUI","BIH","B","18/06","21:00"],["CAN","QAT","B","18/06","18:00"],
  ["SUI","CAN","B","24/06","18:00"],["BIH","QAT","B","24/06","18:00"],
  // Grupo C
  ["BRA","MAR","C","14/06","00:00"],["HAI","SCO","C","14/06","03:00"],
  ["BRA","HAI","C","19/06","21:00"],["SCO","MAR","C","20/06","00:00"],
  ["SCO","BRA","C","25/06","21:00"],["MAR","HAI","C","25/06","21:00"],
  // Grupo D
  ["USA","PAR","D","13/06","03:00"],["AUS","TUR","D","14/06","06:00"],
  ["TUR","PAR","D","19/06","19:00"],["USA","AUS","D","19/06","21:00"],
  ["TUR","USA","D","25/06","03:00"],["PAR","AUS","D","25/06","03:00"],
  // Grupo E
  ["GER","CUW","E","14/06","19:00"],["CIV","ECU","E","15/06","01:00"],
  ["GER","CIV","E","20/06","19:00"],["ECU","CUW","E","20/06","22:00"],
  ["ECU","GER","E","26/06","18:00"],["CUW","CIV","E","26/06","18:00"],
  // Grupo F
  ["NED","JPN","F","14/06","22:00"],["SWE","TUN","F","15/06","04:00"],
  ["NED","SWE","F","20/06","19:00"],["TUN","JPN","F","20/06","22:00"],
  ["TUN","NED","F","26/06","18:00"],["JPN","SWE","F","26/06","18:00"],
  // Grupo G
  ["BEL","EGY","G","15/06","22:00"],["IRN","NZL","G","16/06","03:00"],
  ["BEL","IRN","G","21/06","22:00"],["NZL","EGY","G","21/06","19:00"],
  ["NZL","BEL","G","26/06","21:00"],["EGY","IRN","G","26/06","21:00"],
  // Grupo H (España)
  ["ESP","CPV","H","15/06","18:00"],["KSA","URU","H","16/06","00:00"],
  ["ESP","KSA","H","21/06","18:00"],["URU","CPV","H","21/06","21:00"],
  ["URU","ESP","H","27/06","02:00"],["CPV","KSA","H","27/06","02:00"],
  // Grupo I
  ["FRA","SEN","I","16/06","21:00"],["IRQ","NOR","I","17/06","00:00"],
  ["FRA","IRQ","I","22/06","19:00"],["NOR","SEN","I","22/06","21:00"],
  ["NOR","FRA","I","26/06","21:00"],["SEN","IRQ","I","26/06","21:00"],
  // Grupo J
  ["ARG","ALG","J","17/06","03:00"],["AUT","JOR","J","17/06","00:00"],
  ["ARG","AUT","J","23/06","21:00"],["JOR","ALG","J","23/06","18:00"],
  ["JOR","ARG","J","27/06","21:00"],["ALG","AUT","J","27/06","21:00"],
  // Grupo K
  ["POR","CGO","K","17/06","19:00"],["UZB","COL","K","18/06","04:00"],
  ["POR","UZB","K","24/06","19:00"],["COL","CGO","K","24/06","21:00"],
  ["COL","POR","K","27/06","19:30"],["CGO","UZB","K","27/06","19:30"],
  // Grupo L
  ["ENG","CRO","L","17/06","22:00"],["GHA","PAN","L","18/06","01:00"],
  ["ENG","GHA","L","24/06","22:00"],["PAN","CRO","L","24/06","19:00"],
  ["PAN","ENG","L","27/06","22:00"],["CRO","GHA","L","27/06","22:00"],
];

export const SPAIN_IDX = [42, 44, 46];

export const GROUPS = "ABCDEFGHIJKL".split("");

export const TEAM_LIST = Object.values(TEAMS).map(t => t.name).sort((a, b) => a.localeCompare(b, "es"));

// football-data.org team names → internal code
export const FDORG_NAME_TO_CODE: Record<string, string> = {
  "Mexico": "MEX", "South Africa": "ZAF",
  "Korea Republic": "KOR", "Korea Rep.": "KOR", "Republic of Korea": "KOR", "South Korea": "KOR",
  "Czech Republic": "CZE", "Czechia": "CZE", "Czech Rep.": "CZE",
  "Canada": "CAN", "Bosnia and Herzegovina": "BIH", "Bosnia-Herzegovina": "BIH", "Qatar": "QAT", "Switzerland": "SUI",
  "Brazil": "BRA", "Morocco": "MAR", "Haiti": "HAI", "Scotland": "SCO",
  "United States": "USA", "USA": "USA", "Paraguay": "PAR", "Australia": "AUS", "Turkey": "TUR", "Türkiye": "TUR",
  "Germany": "GER", "Curaçao": "CUW", "Curacao": "CUW",
  "Ivory Coast": "CIV", "Côte d'Ivoire": "CIV", "Cote d'Ivoire": "CIV",
  "Ecuador": "ECU", "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
  "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "New Zealand": "NZL",
  "Spain": "ESP", "Cape Verde": "CPV", "Cabo Verde": "CPV", "Cape Verde Islands": "CPV", "Saudi Arabia": "KSA", "Saudi Arabia U23": "KSA", "Uruguay": "URU",
  "France": "FRA", "Senegal": "SEN", "Iraq": "IRQ", "Norway": "NOR",
  "Argentina": "ARG", "Algeria": "ALG", "Austria": "AUT", "Jordan": "JOR",
  "Portugal": "POR", "DR Congo": "CGO", "Congo DR": "CGO", "Congo": "CGO", "Democratic Republic of Congo": "CGO",
  "Uzbekistan": "UZB", "Colombia": "COL",
  "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
};
