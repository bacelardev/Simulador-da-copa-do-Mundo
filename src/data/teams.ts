import { NationalTeam, Player } from '../types';

// Raw team details as sent by the user with exact FIFA coefficients
// This serves as the master database for vertices and strengths
export const RAW_TEAMS_CONFIG = [
  { name: 'Argentina', code: 'ARG', coefficient: 1875, primaryColor: '#38BDF8', secondaryColor: '#FFFFFF', formation: '4-3-3' },
  { name: 'Espanha', code: 'ESP', coefficient: 1873, primaryColor: '#EA580C', secondaryColor: '#FACC15', formation: '4-3-3' },
  { name: 'França', code: 'FRA', coefficient: 1869, primaryColor: '#1E3A8A', secondaryColor: '#EF4444', formation: '4-2-3-1' },
  { name: 'Inglaterra', code: 'ENG', coefficient: 1826, primaryColor: '#FFFFFF', secondaryColor: '#1E3A8A', formation: '4-2-3-1' },
  { name: 'Portugal', code: 'POR', coefficient: 1764, primaryColor: '#DC2626', secondaryColor: '#16A34A', formation: '4-3-3' },
  { name: 'Brasil', code: 'BRA', coefficient: 1761, primaryColor: '#FDE047', secondaryColor: '#15803D', formation: '4-3-3' },
  { name: 'Holanda', code: 'NED', coefficient: 1758, primaryColor: '#F97316', secondaryColor: '#1E3A8A', formation: '4-3-3' },
  { name: 'Marrocos', code: 'MAR', coefficient: 1756, primaryColor: '#047857', secondaryColor: '#BE123C', formation: '4-3-3' },
  { name: 'Bélgica', code: 'BEL', coefficient: 1735, primaryColor: '#991B1B', secondaryColor: '#EAB308', formation: '4-3-3' },
  { name: 'Alemanha', code: 'GER', coefficient: 1730, primaryColor: '#111827', secondaryColor: '#EAB308', formation: '4-2-3-1' },
  { name: 'Croácia', code: 'CRO', coefficient: 1717, primaryColor: '#EF4444', secondaryColor: '#2563EB', formation: '4-3-3' },
  { name: 'Colômbia', code: 'COL', coefficient: 1693, primaryColor: '#FACC15', secondaryColor: '#1D4ED8', formation: '4-3-3' },
  { name: 'Senegal', code: 'SEN', coefficient: 1689, primaryColor: '#15803D', secondaryColor: '#EAB308', formation: '4-3-3' },
  { name: 'México', code: 'MEX', coefficient: 1681, primaryColor: '#15803D', secondaryColor: '#FFFFFF', formation: '4-2-3-1' },
  { name: 'Estados Unidos', code: 'USA', coefficient: 1673, primaryColor: '#0F172A', secondaryColor: '#EF4444', formation: '4-3-3' },
  { name: 'Uruguai', code: 'URU', coefficient: 1673, primaryColor: '#0EA5E9', secondaryColor: '#EAB308', formation: '4-3-3' },
  { name: 'Japão', code: 'JPN', coefficient: 1660, primaryColor: '#1E40AF', secondaryColor: '#EF4444', formation: '4-2-3-1' },
  { name: 'Suíça', code: 'SUI', coefficient: 1649, primaryColor: '#E11D48', secondaryColor: '#FFFFFF', formation: '4-2-3-1' },
  { name: 'Irã', code: 'IRN', coefficient: 1615, primaryColor: '#FFFFFF', secondaryColor: '#16A34A', formation: '4-3-3' },
  { name: 'Turquia', code: 'TUR', coefficient: 1599, primaryColor: '#DC2626', secondaryColor: '#FFFFFF', formation: '4-2-3-1' },
  { name: 'Equador', code: 'ECU', coefficient: 1595, primaryColor: '#EAB308', secondaryColor: '#1E40AF', formation: '3-5-2' },
  { name: 'Áustria', code: 'AUT', coefficient: 1593, primaryColor: '#DC2626', secondaryColor: '#FFFFFF', formation: '4-2-3-1' },
  { name: 'Coreia do Sul', code: 'KOR', coefficient: 1589, primaryColor: '#E11D48', secondaryColor: '#1E3A8A', formation: '4-2-3-1' },
  { name: 'Austrália', code: 'AUS', coefficient: 1581, primaryColor: '#EAB308', secondaryColor: '#15803D', formation: '4-3-3' },
  { name: 'Argélia', code: 'ALG', coefficient: 1564, primaryColor: '#16A34A', secondaryColor: '#FFFFFF', formation: '4-3-3' },
  { name: 'Egito', code: 'EGY', coefficient: 1563, primaryColor: '#DC2626', secondaryColor: '#111827', formation: '4-3-3' },
  { name: 'Canadá', code: 'CAN', coefficient: 1556, primaryColor: '#EF4444', secondaryColor: '#FFFFFF', formation: '4-2-3-1' },
  { name: 'Noruega', code: 'NOR', coefficient: 1551, primaryColor: '#DC2626', secondaryColor: '#1E3A8A', formation: '4-3-3' },
  { name: 'Panamá', code: 'PAN', coefficient: 1541, primaryColor: '#EF4444', secondaryColor: '#1E3A8A', formation: '4-2-3-1' },
  { name: 'Costa do Marfim', code: 'CIV', coefficient: 1533, primaryColor: '#F97316', secondaryColor: '#15803D', formation: '4-3-3' },
  { name: 'Suécia', code: 'SWE', coefficient: 1515, primaryColor: '#FACC15', secondaryColor: '#1D4ED8', formation: '4-3-3' },
  { name: 'Paraguai', code: 'PAR', coefficient: 1504, primaryColor: '#EF4444', secondaryColor: '#1E40AF', formation: '4-3-3' },
  { name: 'Tchéquia', code: 'CZE', coefficient: 1501, primaryColor: '#FFFFFF', secondaryColor: '#DC2626', formation: '4-2-3-1' },
  { name: 'Escócia', code: 'SCO', coefficient: 1498, primaryColor: '#1E3A8A', secondaryColor: '#FFFFFF', formation: '3-5-2' },
  { name: 'Tunísia', code: 'TUN', coefficient: 1483, primaryColor: '#EF4444', secondaryColor: '#FFFFFF', formation: '4-3-3' },
  { name: 'RD Congo', code: 'COD', coefficient: 1478, primaryColor: '#1E40AF', secondaryColor: '#FACC15', formation: '4-3-3' },
  { name: 'Uzbequistão', code: 'UZB', coefficient: 1465, primaryColor: '#FFFFFF', secondaryColor: '#3B82F6', formation: '4-2-3-1' },
  { name: 'Catar', code: 'QAT', coefficient: 1455, primaryColor: '#881337', secondaryColor: '#FFFFFF', formation: '4-2-3-1' },
  { name: 'Iraque', code: 'IRQ', coefficient: 1447, primaryColor: '#FFFFFF', secondaryColor: '#15803D', formation: '4-3-3' },
  { name: 'África do Sul', code: 'RSA', coefficient: 1430, primaryColor: '#15803D', secondaryColor: '#EAB308', formation: '4-3-3' },
  { name: 'Arábia Saudita', code: 'KSA', coefficient: 1421, primaryColor: '#15803D', secondaryColor: '#FFFFFF', formation: '4-2-3-1' },
  { name: 'Jordânia', code: 'JOR', coefficient: 1391, primaryColor: '#FFFFFF', secondaryColor: '#DC2626', formation: '4-2-3-1' },
  { name: 'Bósnia e Herzegovina', code: 'BIH', coefficient: 1386, primaryColor: '#1E40AF', secondaryColor: '#EAB308', formation: '4-3-3' },
  { name: 'Cabo Verde', code: 'CPV', coefficient: 1366, primaryColor: '#1E40AF', secondaryColor: '#EF4444', formation: '4-3-3' },
  { name: 'Gana', code: 'GHA', coefficient: 1346, primaryColor: '#FFFFFF', secondaryColor: '#EF4444', formation: '4-3-3' },
  { name: 'Curaçao', code: 'CUW', coefficient: 1295, primaryColor: '#1D4ED8', secondaryColor: '#FACC15', formation: '4-3-3' },
  { name: 'Haiti', code: 'HAI', coefficient: 1292, primaryColor: '#1D4ED8', secondaryColor: '#EF4444', formation: '4-3-3' },
  { name: 'Nova Zelândia', code: 'NZL', coefficient: 1282, primaryColor: '#FFFFFF', secondaryColor: '#111827', formation: '4-3-3' }
];

// Helper dictionaries for immersive cultural/national names generator
const FIRST_NAMES_BY_REGION: { [key: string]: string[] } = {
  latin: ['Carlos', 'Luis', 'José', 'Diego', 'Mateo', 'Santiago', 'Enzo', 'Federico', 'Nicolás', 'Alexis', 'Esteban', 'Julián', 'Rodrigo', 'Andrés', 'Hernán', 'Moisés'],
  english: ['Ethan', 'Liam', 'John', 'Harry', 'Thomas', 'Mason', 'Andrew', 'Tyler', 'Jacob', 'Ryan', 'George', 'Brenden', 'Kyle', 'Jordan', 'Callum'],
  african: ['Sadio', 'Sekou', 'Mohammed', 'Inaki', 'Lamine', 'Idrissa', 'Nicolas', 'Kalidou', 'Youssef', 'Kofi', 'Cédric', 'Chancel', 'Pape', 'Abdou'],
  asian: ['Takumi', 'Kento', 'Yuto', 'Daichi', 'Hyun', 'Min', 'Woo', 'Ji', 'Jung', 'Jin', 'Koki', 'Hiroki', 'Ko', 'Zion'],
  mideast: ['Ahmed', 'Mohammad', 'Mustafa', 'Ali', 'Omar', 'Hassan', 'Salem', 'Saud', 'Ibrahim', 'Hussein', 'Yasser'],
  european: ['Erling', 'Martin', 'Emil', 'Viktor', 'David', 'Marcel', 'Tomas', 'Hakan', 'Arda', 'Alexander', 'Leon', 'Lukas', 'Patrik', 'Scott', 'Andy']
};

const LAST_NAMES_BY_REGION: { [key: string]: string[] } = {
  latin: ['Rodríguez', 'Gómez', 'González', 'Martínez', 'Hernández', 'Díaz', 'Álvarez', 'Giménez', 'Valverde', 'Caicedo', 'Moreno', 'Ochoa', 'Sánchez', 'Paredes', 'Espinosa'],
  english: ['Smith', 'Johnson', 'Davies', 'Macdonald', 'Miller', 'Wilson', 'Taylor', 'Jones', 'Beattie', 'Wood', 'Adams', 'Pulisic', 'Turner', 'Buchanan', 'Eustáquio'],
  african: ['Koulibaly', 'Mendy', 'Diallo', 'Drogba', 'Touré', 'Kudus', 'Williams', 'Salah', 'Atsu', 'Bamba', 'Mbemba', 'Wissa', 'Gueye', 'Jakobs'],
  asian: ['Sato', 'Suzuki', 'Kubo', 'Mitoma', 'Kamada', 'Son', 'Kim', 'Lee', 'Park', 'Ueda', 'Ito', 'Suzuki', 'Sugawara'],
  mideast: ['Al-Dawsari', 'Al-Shahrani', 'Hussein', 'Jassim', 'Yassin', 'Al-Ghamdi', 'Al-Mansour', 'Rezaeian', 'Azmoun', 'Taremi', 'Jahanbakhsh'],
  european: ['Haaland', 'Odegaard', 'Akanji', 'Xhaka', 'Isak', 'Gyökeres', 'Sabitzer', 'Soucek', 'Çalhanoğlu', 'Güler', 'Robertson', 'McTominay', 'Schick', 'Elvedi', 'Sommer']
};

// Map each 3-letter country to which name region makes the most sense
function getRegionForCode(code: string): string {
  const codeLower = code.toLowerCase();
  if (['arg', 'col', 'ecu', 'uru', 'mex', 'pan', 'par', 'cuw'].includes(codeLower)) return 'latin';
  if (['usa', 'can', 'aus', 'sco', 'nzl'].includes(codeLower)) return 'english';
  if (['sen', 'civ', 'gha', 'rsa', 'tun', 'alg', 'egy', 'cod', 'cpv', 'hai'].includes(codeLower)) return 'african';
  if (['jpn', 'kor'].includes(codeLower)) return 'asian';
  if (['ksa', 'irq', 'qat', 'jor', 'irn'].includes(codeLower)) return 'mideast';
  return 'european'; // ESP, FRA, ENG, POR, NED, BEL, GER, CRO, SUI, TUR, AUT, NOR, SWE, CZE, BIH, UZB etc.
}

// Famous real-world star players override to make simulated squads extremely recognizable
const STAR_PLAYERS_OVERRIDE: { [code: string]: { name: string; position: 'Goleiro' | 'Defensor' | 'Meio-Campista' | 'Atacante'; rating: number; club: string }[] } = {
  NOR: [
    { name: 'Erling Haaland', position: 'Atacante', rating: 91, club: 'Manchester City' },
    { name: 'Martin Ødegaard', position: 'Meio-Campista', rating: 89, club: 'Arsenal' }
  ],
  EGY: [
    { name: 'Mohamed Salah', position: 'Atacante', rating: 89, club: 'Liverpool' }
  ],
  KOR: [
    { name: 'Heung-min Son', position: 'Atacante', rating: 87, club: 'Tottenham' }
  ],
  CAN: [
    { name: 'Alphonso Davies', position: 'Defensor', rating: 84, club: 'Bayern de Munique' }
  ],
  COL: [
    { name: 'Luis Díaz', position: 'Atacante', rating: 84, club: 'Liverpool' },
    { name: 'James Rodríguez', position: 'Meio-Campista', rating: 81, club: 'Rayo Vallecano' }
  ],
  ECU: [
    { name: 'Moisés Caicedo', position: 'Meio-Campista', rating: 84, club: 'Chelsea' },
    { name: 'Piero Hincapié', position: 'Defensor', rating: 83, club: 'Bayer Leverkusen' }
  ],
  SWE: [
    { name: 'Viktor Gyökeres', position: 'Atacante', rating: 87, club: 'Sporting CP' },
    { name: 'Alexander Isak', position: 'Atacante', rating: 85, club: 'Newcastle' }
  ],
  TUR: [
    { name: 'Hakan Çalhanoğlu', position: 'Meio-Campista', rating: 85, club: 'Inter de Milão' },
    { name: 'Arda Güler', position: 'Meio-Campista', rating: 81, club: 'Real Madrid' }
  ],
  AUT: [
    { name: 'David Alaba', position: 'Defensor', rating: 84, club: 'Real Madrid' },
    { name: 'Marcel Sabitzer', position: 'Meio-Campista', rating: 83, club: 'Dortmund' }
  ],
  SCO: [
    { name: 'Andrew Robertson', position: 'Defensor', rating: 84, club: 'Liverpool' },
    { name: 'Scott McTominay', position: 'Meio-Campista', rating: 80, club: 'Napoli' }
  ],
  GHA: [
    { name: 'Mohammed Kudus', position: 'Meio-Campista', rating: 83, club: 'West Ham' },
    { name: 'Iñaki Williams', position: 'Atacante', rating: 82, club: 'Athletic Bilbao' }
  ],
  SUI: [
    { name: 'Granit Xhaka', position: 'Meio-Campista', rating: 85, club: 'Bayer Leverkusen' },
    { name: 'Manuel Akanji', position: 'Defensor', rating: 84, club: 'Manchester City' }
  ],
  KSA: [
    { name: 'Salem Al-Dawsari', position: 'Atacante', rating: 80, club: 'Al-Hilal' }
  ]
};

// Hand-made full high-quality squad lists for the 16 major teams
const CUSTOM_SQUADS: { [code: string]: Omit<Player, 'id'>[] } = {
  BRA: [
    { name: 'Alisson', position: 'Goleiro', number: 1, club: 'Liverpool', rating: 89, isStar: true },
    { name: 'Wesley', position: 'Defensor', number: 2, club: 'Roma', rating: 80 },
    { name: 'Gabriel Magalhães', position: 'Defensor', number: 3, club: 'Arsenal', rating: 87, isStar: true },
    { name: 'Marquinhos', position: 'Defensor', number: 4, club: 'PSG', rating: 86, isStar: true },
    { name: 'Casemiro', position: 'Meio-Campista', number: 5, club: 'Manchester United', rating: 84, isStar: true },
    { name: 'Alex Sandro', position: 'Defensor', number: 6, club: 'Flamengo', rating: 79 },
    { name: 'Vinicius', position: 'Atacante', number: 7, club: 'Real Madrid', rating: 91, isStar: true },
    { name: 'Bruno Guimarães', position: 'Meio-Campista', number: 8, club: 'Newcastle', rating: 86, isStar: true },
    { name: 'Matheus Cunha', position: 'Atacante', number: 9, club: 'Manchester United', rating: 82 },
    { name: 'Neymar', position: 'Atacante', number: 10, club: 'Santos', rating: 87, isStar: true },
    { name: 'Raphinha', position: 'Atacante', number: 11, club: 'Barcelona', rating: 89, isStar: true },
    { name: 'Weverton', position: 'Goleiro', number: 12, club: 'Gremio', rating: 81 },
    { name: 'Danilo', position: 'Defensor', number: 13, club: 'Flamengo', rating: 81 },
    { name: 'Bremer', position: 'Defensor', number: 14, club: 'Juventus', rating: 84 },
    { name: 'Léo Pereira', position: 'Defensor', number: 15, club: 'Flamengo', rating: 80 },
    { name: 'Douglas Santos', position: 'Defensor', number: 16, club: 'Zenit', rating: 80 },
    { name: 'Fabinho', position: 'Meio-Campista', number: 17, club: 'Al-Ittihad', rating: 83 },
    { name: 'Danilo Santos', position: 'Meio-Campista', number: 18, club: 'Nottingham Forest', rating: 81 },
    { name: 'Endrick', position: 'Atacante', number: 19, club: 'Real Madrid', rating: 83, isStar: true },
    { name: 'Lucas Paquetá', position: 'Meio-Campista', number: 20, club: 'Flamengo', rating: 84 },
    { name: 'Luiz Henrique', position: 'Atacante', number: 21, club: 'Zenit', rating: 83, isStar: true },
    { name: 'Gabriel Martinelli', position: 'Atacante', number: 22, club: 'Arsenal', rating: 84 },
    { name: 'Ederson', position: 'Goleiro', number: 23, club: 'Fenerbahçe', rating: 88, isStar: true },
    { name: 'Ibañez', position: 'Defensor', number: 24, club: 'Al-Ahli', rating: 81 },
    { name: 'Igor Thiago', position: 'Atacante', number: 25, club: 'Brentford', rating: 79 },
    { name: 'Rayan', position: 'Atacante', number: 26, club: 'Bournemouth', rating: 77 }
  ],
  ARG: [
    { name: 'Emi Martínez', position: 'Goleiro', number: 23, club: 'Aston Villa', rating: 89, isStar: true },
    { name: 'Nahuel Molina', position: 'Defensor', number: 26, club: 'Atlético Madrid', rating: 82 },
    { name: 'Cristian Romero', position: 'Defensor', number: 13, club: 'Tottenham', rating: 88, isStar: true },
    { name: 'Lisandro Martínez', position: 'Defensor', number: 25, club: 'Manchester United', rating: 86, isStar: true },
    { name: 'Nicolás Tagliafico', position: 'Defensor', number: 3, club: 'Lyon', rating: 81 },
    { name: 'Nicolás Otamendi', position: 'Defensor', number: 19, club: 'Benfica', rating: 82 },
    { name: 'Rodrigo De Paul', position: 'Meio-Campista', number: 7, club: 'Atlético Madrid', rating: 84 },
    { name: 'Enzo Fernández', position: 'Meio-Campista', number: 24, club: 'Chelsea', rating: 85 },
    { name: 'Alexis Mac Allister', position: 'Meio-Campista', number: 20, club: 'Liverpool', rating: 87, isStar: true },
    { name: 'Giovani Lo Celso', position: 'Meio-Campista', number: 16, club: 'Betis', rating: 82 },
    { name: 'Leandro Paredes', position: 'Meio-Campista', number: 5, club: 'Roma', rating: 82 },
    { name: 'Lionel Messi', position: 'Atacante', number: 10, club: 'Inter Miami', rating: 90, isStar: true },
    { name: 'Lautaro Martínez', position: 'Atacante', number: 22, club: 'Inter de Milão', rating: 89, isStar: true },
    { name: 'Julián Álvarez', position: 'Atacante', number: 9, club: 'Atlético Madrid', rating: 87, isStar: true },
    { name: 'Alejandro Garnacho', position: 'Atacante', number: 17, club: 'Manchester United', rating: 83 },
    { name: 'Paulo Dybala', position: 'Atacante', number: 21, club: 'Roma', rating: 84 }
  ],
  FRA: [
    { name: 'Mike Maignan', position: 'Goleiro', number: 16, club: 'Milan', rating: 87 },
    { name: 'Lucas Chevalier', position: 'Goleiro', number: 1, club: 'Lille', rating: 82 },
    { name: 'Jules Koundé', position: 'Defensor', number: 5, club: 'Barcelona', rating: 85 },
    { name: 'William Saliba', position: 'Defensor', number: 4, club: 'Arsenal', rating: 89, isStar: true },
    { name: 'Ibrahima Konaté', position: 'Defensor', number: 24, club: 'Liverpool', rating: 86 },
    { name: 'Theo Hernández', position: 'Defensor', number: 22, club: 'Milan', rating: 87, isStar: true },
    { name: 'Dayot Upamecano', position: 'Defensor', number: 14, club: 'Bayern de Munique', rating: 84 },
    { name: 'Benjamin Pavard', position: 'Defensor', number: 2, club: 'Inter de Milão', rating: 82 },
    { name: 'Aurélien Tchouaméni', position: 'Meio-Campista', number: 8, club: 'Real Madrid', rating: 86 },
    { name: 'Eduardo Camavinga', position: 'Meio-Campista', number: 6, club: 'Real Madrid', rating: 86, isStar: true },
    { name: 'Warren Zaïre-Emery', position: 'Meio-Campista', number: 18, club: 'PSG', rating: 83 },
    { name: 'Adrien Rabiot', position: 'Meio-Campista', number: 25, club: 'Marseille', rating: 83 },
    { name: 'Kylian Mbappé', position: 'Atacante', number: 10, club: 'Real Madrid', rating: 92, isStar: true },
    { name: 'Ousmane Dembélé', position: 'Atacante', number: 11, club: 'PSG', rating: 86 },
    { name: 'Bradley Barcola', position: 'Atacante', number: 20, club: 'PSG', rating: 85, isStar: true },
    { name: 'Marcus Thuram', position: 'Atacante', number: 15, club: 'Inter de Milão', rating: 84 },
    { name: 'Michael Olise', position: 'Atacante', number: 12, club: 'Bayern de Munique', rating: 85 },
    { name: 'Christopher Nkunku', position: 'Atacante', number: 19, club: 'Chelsea', rating: 84 }
  ],
  GER: [
    { name: 'Marc-André ter Stegen', position: 'Goleiro', number: 1, club: 'Barcelona', rating: 87, isStar: true },
    { name: 'Oliver Baumann', position: 'Goleiro', number: 12, club: 'Hoffenheim', rating: 81 },
    { name: 'Joshua Kimmich', position: 'Defensor', number: 6, club: 'Bayern de Munique', rating: 87, isStar: true },
    { name: 'Antonio Rüdiger', position: 'Defensor', number: 2, club: 'Real Madrid', rating: 88, isStar: true },
    { name: 'Jonathan Tah', position: 'Defensor', number: 4, club: 'Bayer Leverkusen', rating: 85 },
    { name: 'Nico Schlotterbeck', position: 'Defensor', number: 15, club: 'Dortmund', rating: 84 },
    { name: 'David Raum', position: 'Defensor', number: 3, club: 'RB Leipzig', rating: 82 },
    { name: 'Maximilian Mittelstädt', position: 'Defensor', number: 22, club: 'Stuttgart', rating: 81 },
    { name: 'Robert Andrich', position: 'Meio-Campista', number: 23, club: 'Bayer Leverkusen', rating: 83 },
    { name: 'Aleksandar Pavlović', position: 'Meio-Campista', number: 16, club: 'Bayern de Munique', rating: 83 },
    { name: 'Pascal Groß', position: 'Meio-Campista', number: 5, club: 'Dortmund', rating: 82 },
    { name: 'Angelo Stiller', position: 'Meio-Campista', number: 8, club: 'Stuttgart', rating: 81 },
    { name: 'Florian Wirtz', position: 'Meio-Campista', number: 10, club: 'Bayer Leverkusen', rating: 91, isStar: true },
    { name: 'Jamal Musiala', position: 'Meio-Campista', number: 11, club: 'Bayern de Munique', rating: 91, isStar: true },
    { name: 'Kai Havertz', position: 'Atacante', number: 7, club: 'Arsenal', rating: 86 },
    { name: 'Leroy Sané', position: 'Atacante', number: 19, club: 'Bayern de Munique', rating: 85 },
    { name: 'Deniz Undav', position: 'Atacante', number: 13, club: 'Stuttgart', rating: 83 },
    { name: 'Serge Gnabry', position: 'Atacante', number: 20, club: 'Bayern de Munique', rating: 83 }
  ],
  POR: [
    { name: 'Diogo Costa', position: 'Goleiro', number: 1, club: 'Porto', rating: 86, isStar: true },
    { name: 'Rui Silva', position: 'Goleiro', number: 12, club: 'Betis', rating: 81 },
    { name: 'Diogo Dalot', position: 'Defensor', number: 2, club: 'Manchester United', rating: 83 },
    { name: 'Rúben Dias', position: 'Defensor', number: 4, club: 'Manchester City', rating: 89, isStar: true },
    { name: 'Gonçalo Inácio', position: 'Defensor', number: 14, club: 'Sporting CP', rating: 83 },
    { name: 'Nuno Mendes', position: 'Defensor', number: 19, club: 'PSG', rating: 84, isStar: true },
    { name: 'João Cancelo', position: 'Defensor', number: 20, club: 'Al-Hilal', rating: 84 },
    { name: 'João Neves', position: 'Meio-Campista', number: 15, club: 'PSG', rating: 84 },
    { name: 'Vitinha', position: 'Meio-Campista', number: 23, club: 'PSG', rating: 86, isStar: true },
    { name: 'Bruno Fernandes', position: 'Meio-Campista', number: 8, club: 'Manchester United', rating: 88, isStar: true },
    { name: 'Bernardo Silva', position: 'Meio-Campista', number: 10, club: 'Manchester City', rating: 87 },
    { name: 'João Palhinha', position: 'Meio-Campista', number: 6, club: 'Bayern de Munique', rating: 85, isStar: true },
    { name: 'Cristiano Ronaldo', position: 'Atacante', number: 7, club: 'Al-Nassr', rating: 85, isStar: true },
    { name: 'Rafael Leão', position: 'Atacante', number: 17, club: 'Milan', rating: 88, isStar: true },
    { name: 'Francisco Conceição', position: 'Atacante', number: 11, club: 'Juventus', rating: 83 },
    { name: 'João Félix', position: 'Atacante', number: 18, club: 'Chelsea', rating: 82 },
    { name: 'Pedro Neto', position: 'Atacante', number: 25, club: 'Chelsea', rating: 83 }
  ],
  ESP: [
    { name: 'David Raya', position: 'Goleiro', number: 1, club: 'Arsenal', rating: 86, isStar: true },
    { name: 'Alex Remiro', position: 'Goleiro', number: 13, club: 'Real Sociedad', rating: 82 },
    { name: 'Dani Carvajal', position: 'Defensor', number: 2, club: 'Real Madrid', rating: 86, isStar: true },
    { name: 'Robin Le Normand', position: 'Defensor', number: 3, club: 'Atlético Madrid', rating: 84 },
    { name: 'Aymeric Laporte', position: 'Defensor', number: 14, club: 'Al-Nassr', rating: 84 },
    { name: 'Marc Cucurella', position: 'Defensor', number: 24, club: 'Chelsea', rating: 83 },
    { name: 'Alejandro Grimaldo', position: 'Defensor', number: 12, club: 'Bayer Leverkusen', rating: 85 },
    { name: 'Pau Cubarsí', position: 'Defensor', number: 15, club: 'Barcelona', rating: 82 },
    { name: 'Rodri', position: 'Meio-Campista', number: 16, club: 'Manchester City', rating: 92, isStar: true },
    { name: 'Fabián Ruiz', position: 'Meio-Campista', number: 8, club: 'PSG', rating: 85 },
    { name: 'Pedri', position: 'Meio-Campista', number: 20, club: 'Barcelona', rating: 88, isStar: true },
    { name: 'Dani Olmo', position: 'Meio-Campista', number: 10, club: 'Barcelona', rating: 87, isStar: true },
    { name: 'Gavi', position: 'Meio-Campista', number: 6, club: 'Barcelona', rating: 86, isStar: true },
    { name: 'Martín Zubimendi', position: 'Meio-Campista', number: 4, club: 'Real Sociedad', rating: 84 },
    { name: 'Lamine Yamal', position: 'Atacante', number: 19, club: 'Barcelona', rating: 91, isStar: true },
    { name: 'Nico Williams', position: 'Atacante', number: 17, club: 'Athletic Bilbao', rating: 88, isStar: true },
    { name: 'Álvaro Morata', position: 'Atacante', number: 7, club: 'Milan', rating: 84 },
    { name: 'Samu Omorodion', position: 'Atacante', number: 9, club: 'Porto', rating: 84 }
  ],
  ENG: [
    { name: 'Jordan Pickford', position: 'Goleiro', number: 1, club: 'Everton', rating: 83 },
    { name: 'Dean Henderson', position: 'Goleiro', number: 13, club: 'Crystal Palace', rating: 80 },
    { name: 'Trent Alexander-Arnold', position: 'Defensor', number: 2, club: 'Liverpool', rating: 86, isStar: true },
    { name: 'John Stones', position: 'Defensor', number: 5, club: 'Manchester City', rating: 85 },
    { name: 'Marc Guéhi', position: 'Defensor', number: 6, club: 'Crystal Palace', rating: 84 },
    { name: 'Levi Colwill', position: 'Defensor', number: 3, club: 'Chelsea', rating: 82 },
    { name: 'Kyle Walker', position: 'Defensor', number: 12, club: 'Manchester City', rating: 84 },
    { name: 'Declan Rice', position: 'Meio-Campista', number: 4, club: 'Arsenal', rating: 88, isStar: true },
    { name: 'Jude Bellingham', position: 'Meio-Campista', number: 10, club: 'Real Madrid', rating: 91, isStar: true },
    { name: 'Cole Palmer', position: 'Meio-Campista', number: 20, club: 'Chelsea', rating: 89, isStar: true },
    { name: 'Kobbie Mainoo', position: 'Meio-Campista', number: 18, club: 'Manchester United', rating: 82 },
    { name: 'Conor Gallagher', position: 'Meio-Campista', number: 16, club: 'Atlético Madrid', rating: 83 },
    { name: 'Bukayo Saka', position: 'Atacante', number: 7, club: 'Arsenal', rating: 89, isStar: true },
    { name: 'Phil Foden', position: 'Atacante', number: 11, club: 'Manchester City', rating: 89, isStar: true },
    { name: 'Harry Kane', position: 'Atacante', number: 9, club: 'Bayern de Munique', rating: 90, isStar: true },
    { name: 'Anthony Gordon', position: 'Atacante', number: 17, club: 'Newcastle', rating: 83 },
    { name: 'Ollie Watkins', position: 'Atacante', number: 19, club: 'Aston Villa', rating: 84 }
  ],
  NED: [
    { name: 'Bart Verbruggen', position: 'Goleiro', number: 1, club: 'Brighton', rating: 83 },
    { name: 'Denzel Dumfries', position: 'Defensor', number: 22, club: 'Inter de Milão', rating: 84 },
    { name: 'Virgil van Dijk', position: 'Defensor', number: 4, club: 'Liverpool', rating: 89, isStar: true },
    { name: 'Micky van de Ven', position: 'Defensor', number: 15, club: 'Tottenham', rating: 84, isStar: true },
    { name: 'Nathan Aké', position: 'Defensor', number: 5, club: 'Manchester City', rating: 84 },
    { name: 'Jeremie Frimpong', position: 'Defensor', number: 12, club: 'Bayer Leverkusen', rating: 84 },
    { name: 'Jerdy Schouten', position: 'Meio-Campista', number: 24, club: 'PSV', rating: 82 },
    { name: 'Frenkie de Jong', position: 'Meio-Campista', number: 21, club: 'Barcelona', rating: 86, isStar: true },
    { name: 'Tijjani Reijnders', position: 'Meio-Campista', number: 14, club: 'Milan', rating: 84, isStar: true },
    { name: 'Xavi Simons', position: 'Meio-Campista', number: 7, club: 'RB Leipzig', rating: 86, isStar: true },
    { name: 'Teun Koopmeiners', position: 'Meio-Campista', number: 8, club: 'Juventus', rating: 84 },
    { name: 'Cody Gakpo', position: 'Atacante', number: 11, club: 'Liverpool', rating: 85 },
    { name: 'Joshua Zirkzee', position: 'Atacante', number: 9, club: 'Manchester United', rating: 80 },
    { name: 'Memphis Depay', position: 'Atacante', number: 10, club: 'Corinthians', rating: 82 }
  ],
  URU: [
    { name: 'Sergio Rochet', position: 'Goleiro', number: 1, club: 'Internacional', rating: 82 },
    { name: 'Ronald Araújo', position: 'Defensor', number: 13, club: 'Barcelona', rating: 86, isStar: true },
    { name: 'José María Giménez', position: 'Defensor', number: 2, club: 'Atlético Madrid', rating: 83 },
    { name: 'Mathías Olivera', position: 'Defensor', number: 16, club: 'Napoli', rating: 81 },
    { name: 'Nahitan Nández', position: 'Defensor', number: 4, club: 'Al-Qadsiah', rating: 80 },
    { name: 'Federico Valverde', position: 'Meio-Campista', number: 15, club: 'Real Madrid', rating: 90, isStar: true },
    { name: 'Manuel Ugarte', position: 'Meio-Campista', number: 5, club: 'Manchester United', rating: 84, isStar: true },
    { name: 'Rodrigo Bentancur', position: 'Meio-Campista', number: 6, club: 'Tottenham', rating: 83 },
    { name: 'Nicolás de la Cruz', position: 'Meio-Campista', number: 7, club: 'Flamengo', rating: 83 },
    { name: 'Darwin Núñez', position: 'Atacante', number: 19, club: 'Liverpool', rating: 85, isStar: true },
    { name: 'Facundo Pellistri', position: 'Atacante', number: 11, club: 'Panathinaikos', rating: 80 },
    { name: 'Maximiliano Araújo', position: 'Atacante', number: 20, club: 'Sporting CP', rating: 81 }
  ],
  BEL: [
    { name: 'Koen Casteels', position: 'Goleiro', number: 1, club: 'Al-Qadsiah', rating: 82 },
    { name: 'Timothy Castagne', position: 'Defensor', number: 21, club: 'Fulham', rating: 79 },
    { name: 'Wout Faes', position: 'Defensor', number: 4, club: 'Leicester City', rating: 80 },
    { name: 'Zeno Debast', position: 'Defensor', number: 3, club: 'Sporting CP', rating: 80 },
    { name: 'Arthur Theate', position: 'Defensor', number: 5, club: 'Eintracht Frankfurt', rating: 80 },
    { name: 'Amadou Onana', position: 'Meio-Campista', number: 6, club: 'Aston Villa', rating: 84, isStar: true },
    { name: 'Youri Tielemans', position: 'Meio-Campista', number: 8, club: 'Aston Villa', rating: 83 },
    { name: 'Kevin De Bruyne', position: 'Meio-Campista', number: 7, club: 'Manchester City', rating: 90, isStar: true },
    { name: 'Charles De Ketelaere', position: 'Meio-Campista', number: 18, club: 'Atalanta', rating: 82 },
    { name: 'Jeremy Doku', position: 'Atacante', number: 11, club: 'Manchester City', rating: 85, isStar: true },
    { name: 'Lois Openda', position: 'Atacante', number: 9, club: 'RB Leipzig', rating: 84 },
    { name: 'Romelu Lukaku', position: 'Atacante', number: 10, club: 'Napoli', rating: 83 }
  ],
  CRO: [
    { name: 'Dominik Livaković', position: 'Goleiro', number: 1, club: 'Fenerbahçe', rating: 83 },
    { name: 'Josip Stanišić', position: 'Defensor', number: 2, club: 'Bayern de Munique', rating: 81 },
    { name: 'Josip Šutalo', position: 'Defensor', number: 6, club: 'Ajax', rating: 81 },
    { name: 'Joško Gvardiol', position: 'Defensor', number: 4, club: 'Manchester City', rating: 88, isStar: true },
    { name: 'Borna Sosa', position: 'Defensor', number: 3, club: 'Torino', rating: 79 },
    { name: 'Mateo Kovačić', position: 'Meio-Campista', number: 8, club: 'Manchester City', rating: 84, isStar: true },
    { name: 'Luka Modrić', position: 'Meio-Campista', number: 10, club: 'Real Madrid', rating: 87, isStar: true },
    { name: 'Mario Pašalić', position: 'Meio-Campista', number: 15, club: 'Atalanta', rating: 81 },
    { name: 'Martin Baturina', position: 'Meio-Campista', number: 7, club: 'Dinamo Zagreb', rating: 81 },
    { name: 'Andrej Kramarić', position: 'Atacante', number: 9, club: 'Hoffenheim', rating: 81 },
    { name: 'Ivan Perišić', position: 'Atacante', number: 14, club: 'PSV', rating: 78 }
  ],
  MAR: [
    { name: 'Yassine Bounou', position: 'Goleiro', number: 1, club: 'Al-Hilal', rating: 84 },
    { name: 'Achraf Hakimi', position: 'Defensor', number: 2, club: 'PSG', rating: 88, isStar: true },
    { name: 'Nayef Aguerd', position: 'Defensor', number: 5, club: 'Real Sociedad', rating: 82 },
    { name: 'Romain Saïss', position: 'Defensor', number: 6, club: 'Al-Shabab', rating: 78 },
    { name: 'Noussair Mazraoui', position: 'Defensor', number: 3, club: 'Manchester United', rating: 82 },
    { name: 'Sofyan Amrabat', position: 'Meio-Campista', number: 4, club: 'Fenerbahçe', rating: 81 },
    { name: 'Azzedine Ounahi', position: 'Meio-Campista', number: 8, club: 'Panathinaikos', rating: 80 },
    { name: 'Brahim Díaz', position: 'Meio-Campista', number: 10, club: 'Real Madrid', rating: 85, isStar: true },
    { name: 'Bilal El Khannouss', position: 'Meio-Campista', number: 14, club: 'Leicester', rating: 79 },
    { name: 'Hakim Ziyech', position: 'Atacante', number: 7, club: 'Galatasaray', rating: 80 },
    { name: 'Youssef En-Nesyri', position: 'Atacante', number: 19, club: 'Fenerbahçe', rating: 82 },
    { name: 'Amine Adli', position: 'Atacante', number: 21, club: 'Bayer Leverkusen', rating: 81 }
  ],
  JPN: [
    { name: 'Zion Suzuki', position: 'Goleiro', number: 1, club: 'Parma', rating: 79 },
    { name: 'Yukinari Sugawara', position: 'Defensor', number: 2, club: 'Southampton', rating: 79 },
    { name: 'Ko Itakura', position: 'Defensor', number: 4, club: 'Mönchengladbach', rating: 81 },
    { name: 'Koki Machida', position: 'Defensor', number: 15, club: 'Union SG', rating: 78 },
    { name: 'Hiroki Ito', position: 'Defensor', number: 21, club: 'Bayern de Munique', rating: 80 },
    { name: 'Wataru Endo', position: 'Meio-Campista', number: 6, club: 'Liverpool', rating: 81 },
    { name: 'Hidemasa Morita', position: 'Meio-Campista', number: 5, club: 'Sporting CP', rating: 81 },
    { name: 'Takefusa Kubo', position: 'Atacante', number: 20, club: 'Real Sociedad', rating: 85, isStar: true },
    { name: 'Daichi Kamada', position: 'Meio-Campista', number: 8, club: 'Crystal Palace', rating: 80 },
    { name: 'Kaoru Mitoma', position: 'Atacante', number: 7, club: 'Brighton', rating: 85, isStar: true },
    { name: 'Ayase Ueda', position: 'Atacante', number: 9, club: 'Feyenoord', rating: 79 }
  ],
  USA: [
    { name: 'Matt Turner', position: 'Goleiro', number: 1, club: 'Crystal Palace', rating: 79 },
    { name: 'Joe Scally', position: 'Defensor', number: 22, club: 'Mönchengladbach', rating: 77 },
    { name: 'Chris Richards', position: 'Defensor', number: 4, club: 'Crystal Palace', rating: 78 },
    { name: 'Auston Trusty', position: 'Defensor', number: 13, club: 'Celtic', rating: 76 },
    { name: 'Antonee Robinson', position: 'Defensor', number: 5, club: 'Fulham', rating: 81, isStar: true },
    { name: 'Tyler Adams', position: 'Meio-Campista', number: 4, club: 'Bournemouth', rating: 79 },
    { name: 'Weston McKennie', position: 'Meio-Campista', number: 8, club: 'Juventus', rating: 81 },
    { name: 'Yunus Musah', position: 'Meio-Campista', number: 6, club: 'Milan', rating: 79 },
    { name: 'Timothy Weah', position: 'Atacante', number: 21, club: 'Juventus', rating: 79 },
    { name: 'Christian Pulisic', position: 'Atacante', number: 10, club: 'Milan', rating: 85, isStar: true },
    { name: 'Folarin Balogun', position: 'Atacante', number: 9, club: 'Monaco', rating: 79 }
  ],
  SEN: [
    { name: 'Édouard Mendy', position: 'Goleiro', number: 16, club: 'Al-Ahli', rating: 81 },
    { name: 'Kalidou Koulibaly', position: 'Defensor', number: 3, club: 'Al-Hilal', rating: 83, isStar: true },
    { name: 'Abdou Diallo', position: 'Defensor', number: 22, club: 'Al-Arabi', rating: 78 },
    { name: 'Ismail Jakobs', position: 'Defensor', number: 14, club: 'Galatasaray', rating: 77 },
    { name: 'Formose Mendy', position: 'Defensor', number: 2, club: 'Lorient', rating: 76 },
    { name: 'Lamine Camara', position: 'Meio-Campista', number: 25, club: 'Monaco', rating: 80 },
    { name: 'Pape Gueye', position: 'Meio-Campista', number: 26, club: 'Villarreal', rating: 78 },
    { name: 'Sadio Mané', position: 'Atacante', number: 10, club: 'Al-Nassr', rating: 84, isStar: true },
    { name: 'Nicolas Jackson', position: 'Atacante', number: 9, club: 'Chelsea', rating: 84, isStar: true },
    { name: 'Ismaïla Sarr', position: 'Atacante', number: 18, club: 'Crystal Palace', rating: 79 },
    { name: 'Iliman Ndiaye', position: 'Atacante', number: 11, club: 'Everton', rating: 79 }
  ],
  COL: [
    { name: 'Camilo Vargas', position: 'Goleiro', number: 1, club: 'Atlas', rating: 81 },
    { name: 'Daniel Muñoz', position: 'Defensor', number: 21, club: 'Crystal Palace', rating: 81 },
    { name: 'Davinson Sánchez', position: 'Defensor', number: 23, club: 'Galatasaray', rating: 81 },
    { name: 'Jhon Lucumí', position: 'Defensor', number: 3, club: 'Bologna', rating: 82 },
    { name: 'Johan Mojica', position: 'Defensor', number: 17, club: 'Mallorca', rating: 79 },
    { name: 'Jefferson Lerma', position: 'Meio-Campista', number: 16, club: 'Crystal Palace', rating: 81 },
    { name: 'Richard Ríos', position: 'Meio-Campista', number: 6, club: 'Palmeiras', rating: 81 },
    { name: 'James Rodríguez', position: 'Meio-Campista', number: 10, club: 'Rayo Vallecano', rating: 81, isStar: true },
    { name: 'Jhon Arias', position: 'Atacante', number: 11, club: 'Fluminense', rating: 81 },
    { name: 'Jhon Durán', position: 'Atacante', number: 9, club: 'Aston Villa', rating: 82, isStar: true },
    { name: 'Luis Díaz', position: 'Atacante', number: 7, club: 'Liverpool', rating: 85, isStar: true }
  ],
  MEX: [
    { name: 'Luis Malagón', position: 'Goleiro', number: 1, club: 'América', rating: 80 },
    { name: 'Jorge Sánchez', position: 'Defensor', number: 2, club: 'Cruz Azul', rating: 77 },
    { name: 'César Montes', position: 'Defensor', number: 3, club: 'Lokomotiv Moscou', rating: 79 },
    { name: 'Johan Vásquez', position: 'Defensor', number: 5, club: 'Genoa', rating: 80 },
    { name: 'Gerardo Arteaga', position: 'Defensor', number: 6, club: 'Monterrey', rating: 77 },
    { name: 'Edson Álvarez', position: 'Meio-Campista', number: 4, club: 'West Ham', rating: 83, isStar: true },
    { name: 'Luis Chávez', position: 'Meio-Campista', number: 24, club: 'Dynamo Moscou', rating: 79 },
    { name: 'Orbelín Pineda', position: 'Meio-Campista', number: 17, club: 'AEK Atenas', rating: 78 },
    { name: 'Roberto Alvarado', position: 'Meio-Campista', number: 25, club: 'Chivas Guadalajara', rating: 78 },
    { name: 'César Huerta', position: 'Atacante', number: 21, club: 'Pumas UNAM', rating: 77 },
    { name: 'Santiago Giménez', position: 'Atacante', number: 9, club: 'Feyenoord', rating: 83, isStar: true }
  ],
  ECU: [
    { name: 'Hernán Galíndez', position: 'Goleiro', number: 1, club: 'Huracán', rating: 78 },
    { name: 'Félix Torres', position: 'Defensor', number: 2, club: 'Corinthians', rating: 79 },
    { name: 'Willian Pacho', position: 'Defensor', number: 6, club: 'PSG', rating: 83 },
    { name: 'Piero Hincapié', position: 'Defensor', number: 3, club: 'Bayer Leverkusen', rating: 83, isStar: true },
    { name: 'Angelo Preciado', position: 'Defensor', number: 17, club: 'Sparta Praga', rating: 79 },
    { name: 'Moisés Caicedo', position: 'Meio-Campista', number: 21, club: 'Chelsea', rating: 85, isStar: true },
    { name: 'Alan Franco', position: 'Meio-Campista', number: 8, club: 'Atlético Mineiro', rating: 78 },
    { name: 'Pervis Estupiñán', position: 'Defensor', number: 7, club: 'Brighton', rating: 82 },
    { name: 'Kendry Páez', position: 'Meio-Campista', number: 10, club: 'Independiente del Valle', rating: 80 },
    { name: 'Jeremy Sarmiento', position: 'Atacante', number: 16, club: 'Burnley', rating: 78 },
    { name: 'Enner Valencia', position: 'Atacante', number: 13, club: 'Internacional', rating: 79 }
  ],
  TUR: [
    { name: 'Mert Günok', position: 'Goleiro', number: 1, club: 'Beşiktaş', rating: 80 },
    { name: 'Mert Müldür', position: 'Defensor', number: 18, club: 'Fenerbahçe', rating: 77 },
    { name: 'Merih Demiral', position: 'Defensor', number: 3, club: 'Al-Ahli', rating: 81 },
    { name: 'Abdülkerim Bardakcı', position: 'Defensor', number: 14, club: 'Galatasaray', rating: 79 },
    { name: 'Ferdi Kadıoğlu', position: 'Defensor', number: 20, club: 'Brighton', rating: 81 },
    { name: 'Hakan Çalhanoğlu', position: 'Meio-Campista', number: 10, club: 'Inter de Milão', rating: 85, isStar: true },
    { name: 'Orkun Kökçü', position: 'Meio-Campista', number: 6, club: 'Benfica', rating: 81 },
    { name: 'Arda Güler', position: 'Meio-Campista', number: 8, club: 'Real Madrid', rating: 82, isStar: true },
    { name: 'Kenan Yıldız', position: 'Meio-Campista', number: 19, club: 'Juventus', rating: 82, isStar: true },
    { name: 'Kerem Aktürkoğlu', position: 'Atacante', number: 7, club: 'Benfica', rating: 81 },
    { name: 'Barış Alper Yılmaz', position: 'Atacante', number: 9, club: 'Galatasaray', rating: 80 }
  ],
  CAN: [
    { name: 'Maxime Crépeau', position: 'Goleiro', number: 1, club: 'Portland Timbers', rating: 77 },
    { name: 'Alistair Johnston', position: 'Defensor', number: 2, club: 'Celtic', rating: 79 },
    { name: 'Moïse Bombito', position: 'Defensor', number: 15, club: 'Nice', rating: 78 },
    { name: 'Kamal Miller', position: 'Defensor', number: 4, club: 'Portland Timbers', rating: 75 },
    { name: 'Alphonso Davies', position: 'Defensor', number: 19, club: 'Bayern de Munique', rating: 85, isStar: true },
    { name: 'Stephen Eustáquio', position: 'Meio-Campista', number: 7, club: 'Porto', rating: 80 },
    { name: 'Ismaël Koné', position: 'Meio-Campista', number: 8, club: 'Marseille', rating: 77 },
    { name: 'Tajon Buchanan', position: 'Meio-Campista', number: 11, club: 'Inter de Milão', rating: 77 },
    { name: 'Jonathan Osorio', position: 'Meio-Campista', number: 21, club: 'Toronto FC', rating: 75 },
    { name: 'Jacob Shaffelburg', position: 'Atacante', number: 14, club: 'Nashville SC', rating: 76 },
    { name: 'Jonathan David', position: 'Atacante', number: 9, club: 'Lille', rating: 83, isStar: true }
  ],
  NOR: [
    { name: 'Ørjan Nyland', position: 'Goleiro', number: 1, club: 'Sevilla', rating: 78 },
    { name: 'Julian Ryerson', position: 'Defensor', number: 14, club: 'Dortmund', rating: 80 },
    { name: 'Leo Østigård', position: 'Defensor', number: 4, club: 'Rennes', rating: 78 },
    { name: 'Andreas Hanche-Olsen', position: 'Defensor', number: 21, club: 'Mainz 05', rating: 77 },
    { name: 'David Møller Wolfe', position: 'Defensor', number: 5, club: 'AZ Alkmaar', rating: 75 },
    { name: 'Patrick Berg', position: 'Meio-Campista', number: 6, club: 'Bodø/Glimt', rating: 78 },
    { name: 'Sander Berge', position: 'Meio-Campista', number: 8, club: 'Fulham', rating: 79 },
    { name: 'Martin Ødegaard', position: 'Meio-Campista', number: 10, club: 'Arsenal', rating: 89, isStar: true },
    { name: 'Oscar Bobb', position: 'Atacante', number: 11, club: 'Manchester City', rating: 80 },
    { name: 'Antonio Nusa', position: 'Atacante', number: 20, club: 'RB Leipzig', rating: 80 },
    { name: 'Erling Haaland', position: 'Atacante', number: 9, club: 'Manchester City', rating: 92, isStar: true }
  ],
  EGY: [
    { name: 'Mohamed El Shenawy', position: 'Goleiro', number: 1, club: 'Al-Ahly', rating: 79 },
    { name: 'Mohamed Hany', position: 'Defensor', number: 3, club: 'Al-Ahly', rating: 75 },
    { name: 'Mohamed Abdelmonem', position: 'Defensor', number: 24, club: 'Nice', rating: 78 },
    { name: 'Ahmed Hegazi', position: 'Defensor', number: 6, club: 'Neom SC', rating: 76 },
    { name: 'Mohamed Hamdy', position: 'Defensor', number: 12, club: 'Pyramids FC', rating: 74 },
    { name: 'Hamdi Fathi', position: 'Meio-Campista', number: 5, club: 'Al-Wakrah', rating: 76 },
    { name: 'Marwan Attia', position: 'Meio-Campista', number: 14, club: 'Al-Ahly', rating: 76 },
    { name: 'Mohamed Elneny', position: 'Meio-Campista', number: 17, club: 'Al-Jazira', rating: 75 },
    { name: 'Mostafa Fathi', position: 'Atacante', number: 18, club: 'Pyramids FC', rating: 74 },
    { name: 'Mostafa Mohamed', position: 'Atacante', number: 7, club: 'Nantes', rating: 79 },
    { name: 'Mohamed Salah', position: 'Atacante', number: 10, club: 'Liverpool', rating: 89, isStar: true }
  ]
};

// Generate an elegant, highly plausible 11-player roster for any remaining teams
function generateTeamRoster(code: string, teamBaseRating: number, formation: string): Player[] {
  const custom = CUSTOM_SQUADS[code];
  if (custom) {
    return custom.map((p, idx) => ({
      ...p,
      id: `${code.toLowerCase()}_${idx + 1}`
    }));
  }

  // Fallback programmatic generation backed by star player lists
  const region = getRegionForCode(code);
  const firstNames = FIRST_NAMES_BY_REGION[region] || FIRST_NAMES_BY_REGION.european;
  const lastNames = LAST_NAMES_BY_REGION[region] || LAST_NAMES_BY_REGION.european;

  const overrides = STAR_PLAYERS_OVERRIDE[code] || [];
  const players: Player[] = [];

  // Generate GK
  const gkOverride = overrides.find(o => o.position === 'Goleiro');
  const gkName = gkOverride?.name || `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  const gkRating = gkOverride?.rating || Math.round(teamBaseRating + Math.random() * 4 - 2);
  const gkClub = gkOverride?.club || 'Clube Local';
  players.push({
    id: `${code.toLowerCase()}_1`,
    name: gkName,
    position: 'Goleiro',
    number: 1,
    club: gkClub,
    rating: Math.min(99, Math.max(50, gkRating)),
    isStar: !!gkOverride
  });

  // Calculate position counts based on formation
  let dfCount = 4;
  let mfCount = 3;
  let fwCount = 3;

  if (formation === '4-2-3-1') {
    dfCount = 4;
    mfCount = 5;
    fwCount = 1;
  } else if (formation === '3-5-2') {
    dfCount = 3;
    mfCount = 5;
    fwCount = 2;
  }

  // Keep a set of used names to prevent duplication in same team
  const usedNames = new Set<string>([gkName]);
  const getUniqueName = () => {
    let attempts = 0;
    while (attempts < 50) {
      const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      if (!usedNames.has(name)) {
        usedNames.add(name);
        return name;
      }
      attempts++;
    }
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]} Jr`;
  };

  // Generate defenders
  const dfOverrides = overrides.filter(o => o.position === 'Defensor');
  for (let i = 0; i < dfCount; i++) {
    const ov = dfOverrides[i];
    const name = ov?.name || getUniqueName();
    const rating = ov?.rating || Math.round(teamBaseRating + Math.random() * 6 - 3);
    const club = ov?.club || (Math.random() < 0.35 ? 'Clube Europeu' : 'Clube Local');
    players.push({
      id: `${code.toLowerCase()}_df_${i + 2}`,
      name,
      position: 'Defensor',
      number: i === 0 ? 2 : i === 1 ? 3 : i === 2 ? 4 : 6,
      club,
      rating: Math.min(99, Math.max(50, rating)),
      isStar: !!ov
    });
  }

  // Generate midfielders
  const mfOverrides = overrides.filter(o => o.position === 'Meio-Campista');
  for (let i = 0; i < mfCount; i++) {
    const ov = mfOverrides[i];
    const name = ov?.name || getUniqueName();
    const rating = ov?.rating || Math.round(teamBaseRating + Math.random() * 6 - 3);
    const club = ov?.club || (Math.random() < 0.45 ? 'Clube Europeu' : 'Clube Local');
    players.push({
      id: `${code.toLowerCase()}_mf_${i + dfCount + 2}`,
      name,
      position: 'Meio-Campista',
      number: i === 0 ? 5 : i === 1 ? 8 : i === 2 ? 10 : 14 + i,
      club,
      rating: Math.min(99, Math.max(50, rating)),
      isStar: !!ov
    });
  }

  // Generate forwards
  const fwOverrides = overrides.filter(o => o.position === 'Atacante');
  for (let i = 0; i < fwCount; i++) {
    const ov = fwOverrides[i];
    const name = ov?.name || getUniqueName();
    const rating = ov?.rating || Math.round(teamBaseRating + Math.random() * 6 - 3);
    const club = ov?.club || (Math.random() < 0.55 ? 'Clube Europeu' : 'Clube Local');
    players.push({
      id: `${code.toLowerCase()}_fw_${i + dfCount + mfCount + 2}`,
      name,
      position: 'Atacante',
      number: i === 0 ? 7 : i === 1 ? 9 : 11,
      club,
      rating: Math.min(99, Math.max(50, rating)),
      isStar: !!ov || (i === 0 && Math.random() < 0.2) // Give some random stars
    });
  }

  return players;
}

// Map real flag emojis for fallback representations of the 48 teams
export const FALLBACK_EMOJIS: { [code: string]: string } = {
  ARG: '🇦🇷', ESP: '🇪🇸', FRA: '🇫🇷', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', POR: '🇵🇹', BRA: '🇧🇷', NED: '🇳🇱', MAR: '🇲🇦',
  BEL: '🇧🇪', GER: '🇩🇪', CRO: '🇭🇷', COL: '🇨🇴', SEN: '🇸🇳', MEX: '🇲🇽', USA: '🇺🇸', URU: '🇺🇾',
  JPN: '🇯🇵', SUI: '🇨🇭', IRN: '🇮🇷', TUR: '🇹🇷', ECU: '🇪🇨', AUT: '🇦🇹', KOR: '🇰🇷', AUS: '🇦🇺',
  ALG: '🇩🇿', EGY: '🇪🇬', CAN: '🇨🇦', NOR: '🇳🇴', PAN: '🇵🇦', CIV: '🇨🇮', SWE: '🇸🇪', PAR: '🇵🇾',
  CZE: '🇨🇿', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', TUN: '🇹🇳', COD: '🇨🇩', UZB: '🇺🇿', QAT: '🇶🇦', IRQ: '🇮🇶', RSA: '🇿🇦',
  KSA: '🇸🇦', JOR: '🇯🇴', BIH: '🇧🇦', CPV: '🇨🇻', GHA: '🇬🇭', CUW: '🇨🇼', HAI: '🇭🇹', NZL: '🇳🇿'
};

// Main Export of full NationalTeam configurations
// Incorporates the user-defined SELECOES with custom coefficient maps
export const TEAMS_DATA: NationalTeam[] = RAW_TEAMS_CONFIG.map(raw => {
  const code = raw.code.toUpperCase();
  const idValue = raw.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  // Custom coefficient scaling to map 1282-1875 range into 64-91 overall football scale rating
  // 1875 -> 91
  // 1282 -> 64
  const factor = (raw.coefficient - 1282) / (1875 - 1282);
  const ratingOverall = Math.round(64 + factor * (91 - 64));

  // Determine slight logical variations between Attack/Midfield/Defense based on code to make teams unique
  let attackMod = 0;
  let midfieldMod = 0;
  let defenseMod = 0;

  if (['BRA', 'ARG', 'FRA', 'ENG', 'COL', 'NOR', 'SWE'].includes(code)) {
    attackMod = 2;
  } else if (['ESP', 'POR', 'GER', 'NED', 'CRO', 'SUI', 'TUR'].includes(code)) {
    midfieldMod = 2;
  } else if (['MAR', 'ITA', 'BEL', 'URU', 'JPN', 'SEN'].includes(code)) {
    defenseMod = 2;
  }

  const ratingAttack = Math.min(99, Math.max(50, ratingOverall + attackMod));
  const ratingMidfield = Math.min(99, Math.max(50, ratingOverall + midfieldMod));
  const ratingDefense = Math.min(99, Math.max(50, ratingOverall + defenseMod));

  return {
    id: idValue,
    name: raw.name,
    code: raw.code,
    flag: FALLBACK_EMOJIS[code] || '🏳️',
    formation: raw.formation || '4-3-3',
    ratingAttack,
    ratingMidfield,
    ratingDefense,
    ratingOverall,
    primaryColor: raw.primaryColor,
    secondaryColor: raw.secondaryColor,
    players: generateTeamRoster(code, ratingOverall, raw.formation || '4-3-3')
  };
});
