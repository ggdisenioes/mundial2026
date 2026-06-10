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

export const MATCHES: [string, string, string][] = [
  ["MEX","ZAF","A"],["KOR","CZE","A"],["CZE","ZAF","A"],["MEX","KOR","A"],["CZE","MEX","A"],["ZAF","KOR","A"],
  ["CAN","BIH","B"],["QAT","SUI","B"],["SUI","BIH","B"],["CAN","QAT","B"],["SUI","CAN","B"],["BIH","QAT","B"],
  ["BRA","MAR","C"],["HAI","SCO","C"],["BRA","HAI","C"],["SCO","MAR","C"],["SCO","BRA","C"],["MAR","HAI","C"],
  ["USA","PAR","D"],["AUS","TUR","D"],["TUR","PAR","D"],["USA","AUS","D"],["TUR","USA","D"],["PAR","AUS","D"],
  ["GER","CUW","E"],["CIV","ECU","E"],["GER","CIV","E"],["ECU","CUW","E"],["ECU","GER","E"],["CUW","CIV","E"],
  ["NED","JPN","F"],["SWE","TUN","F"],["NED","SWE","F"],["TUN","JPN","F"],["TUN","NED","F"],["JPN","SWE","F"],
  ["BEL","EGY","G"],["IRN","NZL","G"],["BEL","IRN","G"],["NZL","EGY","G"],["NZL","BEL","G"],["EGY","IRN","G"],
  ["ESP","CPV","H"],["KSA","URU","H"],["ESP","KSA","H"],["URU","CPV","H"],["URU","ESP","H"],["CPV","KSA","H"],
  ["FRA","SEN","I"],["IRQ","NOR","I"],["FRA","IRQ","I"],["NOR","SEN","I"],["NOR","FRA","I"],["SEN","IRQ","I"],
  ["ARG","ALG","J"],["AUT","JOR","J"],["ARG","AUT","J"],["JOR","ALG","J"],["JOR","ARG","J"],["ALG","AUT","J"],
  ["POR","CGO","K"],["UZB","COL","K"],["POR","UZB","K"],["COL","CGO","K"],["COL","POR","K"],["CGO","UZB","K"],
  ["ENG","CRO","L"],["GHA","PAN","L"],["ENG","GHA","L"],["PAN","CRO","L"],["PAN","ENG","L"],["CRO","GHA","L"],
];

export const SPAIN_IDX = [42, 44, 46];

export const GROUPS = "ABCDEFGHIJKL".split("");

export const TEAM_LIST = Object.values(TEAMS).map(t => t.name).sort((a, b) => a.localeCompare(b, "es"));

export const API_NAME_TO_CODE: Record<string, string> = {
  "Mexico": "MEX", "South Africa": "ZAF", "Korea Republic": "KOR", "Czech Republic": "CZE",
  "Canada": "CAN", "Bosnia and Herzegovina": "BIH", "Qatar": "QAT", "Switzerland": "SUI",
  "Brazil": "BRA", "Morocco": "MAR", "Haiti": "HAI", "Scotland": "SCO",
  "United States": "USA", "Paraguay": "PAR", "Australia": "AUS", "Turkey": "TUR",
  "Germany": "GER", "Curacao": "CUW", "Ivory Coast": "CIV", "Ecuador": "ECU",
  "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
  "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "New Zealand": "NZL",
  "Spain": "ESP", "Cape Verde": "CPV", "Saudi Arabia": "KSA", "Uruguay": "URU",
  "France": "FRA", "Senegal": "SEN", "Iraq": "IRQ", "Norway": "NOR",
  "Argentina": "ARG", "Algeria": "ALG", "Austria": "AUT", "Jordan": "JOR",
  "Portugal": "POR", "Congo DR": "CGO", "Uzbekistan": "UZB", "Colombia": "COL",
  "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
};
