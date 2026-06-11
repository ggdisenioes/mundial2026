import type { TeamAbbr } from "@/types";

export const TEAMS: Record<string, TeamAbbr> = {
  MEX:{name:"México",flag:"🇲🇽"}, ZAF:{name:"Sudáfrica",flag:"🇿🇦"}, KOR:{name:"Corea del Sur",flag:"🇰🇷"}, CZE:{name:"Rep. Checa",flag:"🇨🇿"},
  CAN:{name:"Canadá",flag:"🇨🇦"}, BIH:{name:"Bosnia",flag:"🇧🇦"}, QAT:{name:"Catar",flag:"🇶🇦"}, SUI:{name:"Suiza",flag:"🇨🇭"},
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

export const MATCHES: [string, string, string, string, string][] = [
  // Grupo A — Jornada 1: 11/06 | Jornada 2: 19/06 | Jornada 3: 26/06
  ["MEX","ZAF","A","11/06","14:00"],["KOR","CZE","A","11/06","17:00"],
  ["CZE","ZAF","A","19/06","14:00"],["MEX","KOR","A","19/06","17:00"],
  ["CZE","MEX","A","26/06","19:00"],["ZAF","KOR","A","26/06","19:00"],
  // Grupo B — Jornada 1: 11/06 | Jornada 2: 19/06 | Jornada 3: 26/06
  ["CAN","BIH","B","11/06","20:00"],["QAT","SUI","B","11/06","23:00"],
  ["SUI","BIH","B","19/06","20:00"],["CAN","QAT","B","19/06","23:00"],
  ["SUI","CAN","B","26/06","23:00"],["BIH","QAT","B","26/06","23:00"],
  // Grupo C — Jornada 1: 12/06 | Jornada 2: 20/06 | Jornada 3: 27/06
  ["BRA","MAR","C","12/06","14:00"],["HAI","SCO","C","12/06","17:00"],
  ["BRA","HAI","C","20/06","14:00"],["SCO","MAR","C","20/06","17:00"],
  ["SCO","BRA","C","27/06","19:00"],["MAR","HAI","C","27/06","19:00"],
  // Grupo D — Jornada 1: 12/06 | Jornada 2: 20/06 | Jornada 3: 27/06
  ["USA","PAR","D","12/06","20:00"],["AUS","TUR","D","12/06","23:00"],
  ["TUR","PAR","D","20/06","20:00"],["USA","AUS","D","20/06","23:00"],
  ["TUR","USA","D","27/06","23:00"],["PAR","AUS","D","27/06","23:00"],
  // Grupo E — Jornada 1: 13/06 | Jornada 2: 21/06 | Jornada 3: 28/06
  ["GER","CUW","E","13/06","14:00"],["CIV","ECU","E","13/06","17:00"],
  ["GER","CIV","E","21/06","14:00"],["ECU","CUW","E","21/06","17:00"],
  ["ECU","GER","E","28/06","19:00"],["CUW","CIV","E","28/06","19:00"],
  // Grupo F — Jornada 1: 13/06 | Jornada 2: 21/06 | Jornada 3: 28/06
  ["NED","JPN","F","13/06","20:00"],["SWE","TUN","F","13/06","23:00"],
  ["NED","SWE","F","21/06","20:00"],["TUN","JPN","F","21/06","23:00"],
  ["TUN","NED","F","28/06","23:00"],["JPN","SWE","F","28/06","23:00"],
  // Grupo G — Jornada 1: 14/06 | Jornada 2: 22/06 | Jornada 3: 29/06
  ["BEL","EGY","G","14/06","14:00"],["IRN","NZL","G","14/06","17:00"],
  ["BEL","IRN","G","22/06","14:00"],["NZL","EGY","G","22/06","17:00"],
  ["NZL","BEL","G","29/06","19:00"],["EGY","IRN","G","29/06","19:00"],
  // Grupo H — Jornada 1: 14/06 | Jornada 2: 22/06 | Jornada 3: 29/06
  ["ESP","CPV","H","14/06","20:00"],["KSA","URU","H","14/06","23:00"],
  ["ESP","KSA","H","22/06","20:00"],["URU","CPV","H","22/06","23:00"],
  ["URU","ESP","H","29/06","23:00"],["CPV","KSA","H","29/06","23:00"],
  // Grupo I — Jornada 1: 15/06 | Jornada 2: 23/06 | Jornada 3: 30/06
  ["FRA","SEN","I","15/06","14:00"],["IRQ","NOR","I","15/06","17:00"],
  ["FRA","IRQ","I","23/06","14:00"],["NOR","SEN","I","23/06","17:00"],
  ["NOR","FRA","I","30/06","19:00"],["SEN","IRQ","I","30/06","19:00"],
  // Grupo J — Jornada 1: 15/06 | Jornada 2: 23/06 | Jornada 3: 30/06
  ["ARG","ALG","J","15/06","20:00"],["AUT","JOR","J","15/06","23:00"],
  ["ARG","AUT","J","23/06","20:00"],["JOR","ALG","J","23/06","23:00"],
  ["JOR","ARG","J","30/06","23:00"],["ALG","AUT","J","30/06","23:00"],
  // Grupo K — Jornada 1: 16/06 | Jornada 2: 24/06 | Jornada 3: 02/07
  ["POR","CGO","K","16/06","14:00"],["UZB","COL","K","16/06","17:00"],
  ["POR","UZB","K","24/06","14:00"],["COL","CGO","K","24/06","17:00"],
  ["COL","POR","K","02/07","19:00"],["CGO","UZB","K","02/07","19:00"],
  // Grupo L — Jornada 1: 16/06 | Jornada 2: 24/06 | Jornada 3: 02/07
  ["ENG","CRO","L","16/06","20:00"],["GHA","PAN","L","16/06","23:00"],
  ["ENG","GHA","L","24/06","20:00"],["PAN","CRO","L","24/06","23:00"],
  ["PAN","ENG","L","02/07","23:00"],["CRO","GHA","L","02/07","23:00"],
];

export const SPAIN_IDX = [42, 44, 46];

export const GROUPS = "ABCDEFGHIJKL".split("");

export const TEAM_LIST = Object.values(TEAMS).map(t => t.name).sort((a, b) => a.localeCompare(b, "es"));

// football-data.org team names → internal code
export const FDORG_NAME_TO_CODE: Record<string, string> = {
  "Mexico": "MEX", "South Africa": "South Africa ZAF", "Korea Republic": "KOR", "Korea Rep.": "KOR",
  "Czech Republic": "CZE", "Czechia": "CZE",
  "Canada": "CAN", "Bosnia and Herzegovina": "BIH", "Bosnia-Herzegovina": "BIH", "Qatar": "QAT", "Switzerland": "SUI",
  "Brazil": "BRA", "Morocco": "MAR", "Haiti": "HAI", "Scotland": "SCO",
  "United States": "USA", "USA": "USA", "Paraguay": "PAR", "Australia": "AUS", "Turkey": "TUR", "Türkiye": "TUR",
  "Germany": "GER", "Curaçao": "CUW", "Curacao": "CUW",
  "Ivory Coast": "CIV", "Côte d'Ivoire": "CIV", "Cote d'Ivoire": "CIV",
  "Ecuador": "ECU", "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
  "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "New Zealand": "NZL",
  "Spain": "ESP", "Cape Verde": "CPV", "Saudi Arabia": "KSA", "Uruguay": "URU",
  "France": "FRA", "Senegal": "SEN", "Iraq": "IRQ", "Norway": "NOR",
  "Argentina": "ARG", "Algeria": "ALG", "Austria": "AUT", "Jordan": "JOR",
  "Portugal": "POR", "DR Congo": "CGO", "Congo DR": "CGO", "Congo": "CGO", "Democratic Republic of Congo": "CGO",
  "Uzbekistan": "UZB", "Colombia": "COL",
  "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
};
