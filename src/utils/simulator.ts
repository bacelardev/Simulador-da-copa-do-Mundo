import { NationalTeam, Group, Match, MatchEvent, TournamentState } from '../types';
import { TEAMS_DATA } from '../data/teams';

// Generates 12 groups of 4 from the 48 active teams of the tournament
export const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export function getTeamById(id: string): NationalTeam {
  return TEAMS_DATA.find(t => t.id === id) || TEAMS_DATA[0];
}

// Fisher-Yates shuffle helper
export function shuffleArray<T>(o: T[]): T[] {
  const arr = [...o];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const OFFICIAL_GROUPS_CONFIG: { [letter: string]: string[] } = {
  A: ['México', 'África do Sul', 'Coreia do Sul', 'Tchéquia'],
  B: ['Canadá', 'Bósnia e Herzegovina', 'Catar', 'Suíça'],
  C: ['Brasil', 'Marrocos', 'Haiti', 'Escócia'],
  D: ['Estados Unidos', 'Paraguai', 'Austrália', 'Turquia'],
  E: ['Alemanha', 'Curaçao', 'Costa do Marfim', 'Equador'],
  F: ['Holanda', 'Japão', 'Suécia', 'Tunísia'],
  G: ['Bélgica', 'Egito', 'Irã', 'Nova Zelândia'],
  H: ['Espanha', 'Cabo Verde', 'Arábia Saudita', 'Uruguai'],
  I: ['França', 'Senegal', 'Iraque', 'Noruega'],
  J: ['Argentina', 'Argélia', 'Áustria', 'Jordânia'],
  K: ['Portugal', 'RD do Congo', 'Uzbequistão', 'Colômbia'],
  L: ['Inglaterra', 'Croácia', 'Gana', 'Panamá']
};

export function findTeamIdByExactOrSimilarName(name: string): string {
  const normalizedSearch = name.toLowerCase().trim();
  let targetName = name;
  if (normalizedSearch === 'rd do congo') {
    targetName = 'RD Congo';
  }
  const team = TEAMS_DATA.find(t => t.name.toLowerCase() === targetName.toLowerCase() || t.code.toLowerCase() === targetName.toLowerCase());
  if (team) {
    return team.id;
  }
  return targetName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export function initializeTournament(mode: 'classic' | 'official' = 'classic'): TournamentState {
  const groups: Group[] = [];
  const groupMatches: Match[] = [];

  if (mode === 'official') {
    for (let i = 0; i < 12; i++) {
      const letter = GROUP_LETTERS[i];
      const teamNames = OFFICIAL_GROUPS_CONFIG[letter];
      const groupTeamIds = teamNames.map(name => findTeamIdByExactOrSimilarName(name));

      groups.push({
        letter,
        teams: groupTeamIds.map(tid => ({
          teamId: tid,
          points: 0,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          gd: 0
        }))
      });

      // Round-robin within each group of 4: (reduced from 6 to 3 games)
      // Rodada 1
      groupMatches.push(createEmptyMatch(groupTeamIds[0], groupTeamIds[1], letter, 'Rodada 1'));
      groupMatches.push(createEmptyMatch(groupTeamIds[2], groupTeamIds[3], letter, 'Rodada 1'));
      // Rodada 2
      groupMatches.push(createEmptyMatch(groupTeamIds[0], groupTeamIds[2], letter, 'Rodada 2'));
    }
  } else {
    // We filter out Italy (ITA) if left in the general list for H2H, but use the 48 tournament teams
    // Since TEAMS_DATA is exactly 48 teams now, we shuffle the list
    const activeTeams = TEAMS_DATA.filter(t => t.code !== 'ITA').slice(0, 48);
    const shuffledTeams = shuffleArray(activeTeams);

    for (let i = 0; i < 12; i++) {
      const letter = GROUP_LETTERS[i];
      const groupTeamIds = shuffledTeams.slice(i * 4, (i + 1) * 4).map(t => t.id);

      groups.push({
        letter,
        teams: groupTeamIds.map(tid => ({
          teamId: tid,
          points: 0,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          gd: 0
        }))
      });

      // Round-robin within each group of 4: (reduced from 6 to 3 games)
      // Rodada 1
      groupMatches.push(createEmptyMatch(groupTeamIds[0], groupTeamIds[1], letter, 'Rodada 1'));
      groupMatches.push(createEmptyMatch(groupTeamIds[2], groupTeamIds[3], letter, 'Rodada 1'));
      // Rodada 2
      groupMatches.push(createEmptyMatch(groupTeamIds[0], groupTeamIds[2], letter, 'Rodada 2'));
    }
  }

  return {
    mode,
    groups,
    groupMatches,
    currentRound: 'group',
    r32Matches: [],
    oitavasMatches: [],
    quartasMatches: [],
    semifinalMatches: [],
    thirdPlaceMatch: null,
    finalMatch: null,
    championId: null,
    runnerUpId: null,
    thirdPlaceId: null
  };
}

function createEmptyMatch(teamAId: string, teamBId: string, groupLetter?: string, roundLabel?: string): Match {
  return {
    id: `${groupLetter || 'KO'}_${teamAId}_${teamBId}_${Math.random().toString(36).substr(2, 5)}`,
    groupLetter,
    roundLabel,
    teamAId,
    teamBId,
    played: false
  };
}

// Poisson goal generator
function gerarGols(mediaGols: number): number {
  const L = Math.exp(-mediaGols);
  let k = 1;
  let p = Math.random();
  while (p > L) {
    k++;
    p *= Math.random();
  }
  return k - 1;
}

// Unified probabilistic simulator for individual/interactive matches
export function simulateMatch(match: Match, canDraw = true): Match {
  if (match.played) return match;

  const teamA = getTeamById(match.teamAId);
  const teamB = getTeamById(match.teamBId);

  // Attack vs Defense strength ratings scaled by midfield influence
  const attStrengthA = teamA.ratingAttack + teamA.ratingMidfield * 0.3;
  const defStrengthB = teamB.ratingDefense + teamB.ratingMidfield * 0.3;
  const attStrengthB = teamB.ratingAttack + teamB.ratingMidfield * 0.3;
  const defStrengthA = teamA.ratingDefense + teamA.ratingMidfield * 0.3;

  // Poisson expected lambdas based on soccer rating disparities
  let expectedA = Math.max(0.4, (attStrengthA / defStrengthB) * 1.4 - 0.2);
  let expectedB = Math.max(0.4, (attStrengthB / defStrengthA) * 1.4 - 0.2);

  // Home/form variance
  expectedA += (Math.random() - 0.5) * 0.7;
  expectedB += (Math.random() - 0.5) * 0.7;

  expectedA = Math.max(0.1, expectedA);
  expectedB = Math.max(0.1, expectedB);

  let scoreA = gerarGols(expectedA);
  let scoreB = gerarGols(expectedB);

  // Cap goals realistically
  if (scoreA > 7) scoreA = 7;
  if (scoreB > 7) scoreB = 7;

  let penaltiesA: number | undefined;
  let penaltiesB: number | undefined;

  // Resolve knockout penalties if draw isn't allowed
  if (!canDraw && scoreA === scoreB) {
    const gkRatingA = teamA.players.find(p => p.position === 'Goleiro')?.rating || 80;
    const gkRatingB = teamB.players.find(p => p.position === 'Goleiro')?.rating || 80;
    const edge = (gkRatingA - gkRatingB) * 0.04 + (teamA.ratingOverall - teamB.ratingOverall) * 0.04;
    
    // Play five kicks, resolve with golden kick if needed
    const probAWins = 0.5 + Math.max(-0.2, Math.min(0.2, edge));
    if (Math.random() < probAWins) {
      penaltiesA = 4 + Math.floor(Math.random() * 2);
      penaltiesB = (penaltiesA || 4) - 1 - Math.floor(Math.random() * 2);
      if (penaltiesB < 0) penaltiesB = 0;
    } else {
      penaltiesB = 4 + Math.floor(Math.random() * 2);
      penaltiesA = (penaltiesB || 4) - 1 - Math.floor(Math.random() * 2);
      if (penaltiesA < 0) penaltiesA = 0;
    }
  }

  // Build authentic match events log (Goals, Yellow/Red Cards)
  const events: MatchEvent[] = [];

  const addGoalEvents = (goals: number, scoringTeam: NationalTeam, isTeamA: boolean) => {
    const attackersAndMid = scoringTeam.players.filter(p => p.position === 'Atacante' || p.position === 'Meio-Campista');
    const defenders = scoringTeam.players.filter(p => p.position === 'Defensor');

    for (let i = 0; i < goals; i++) {
      const list = Math.random() < 0.12 && defenders.length > 0 ? defenders : attackersAndMid;
      const weightList = list.map(p => ({
        p,
        w: p.isStar ? 4 : (p.position === 'Atacante' ? 2.5 : 1)
      }));

      const totalW = weightList.reduce((sum, item) => sum + item.w, 0);
      let rand = Math.random() * totalW;
      let selectedPlayer = list[0];

      for (const item of weightList) {
        rand -= item.w;
        if (rand <= 0) {
          selectedPlayer = item.p;
          break;
        }
      }

      const minute = Math.floor(Math.random() * 90) + 1;
      const possiblePassers = attackersAndMid.filter(p => p.id !== selectedPlayer.id);
      const passer = possiblePassers.length > 0 ? possiblePassers[Math.floor(Math.random() * possiblePassers.length)].name : null;

      events.push({
        minute,
        type: 'goal',
        teamId: scoringTeam.id,
        playerName: selectedPlayer.name,
        detail: passer ? `Assistência cirúrgica de ${passer}` : 'Chute de fora da área indefensável!'
      });
    }
  };

  addGoalEvents(scoreA, teamA, true);
  addGoalEvents(scoreB, teamB, false);

  // Cards & incidents
  const allPlayers = [...teamA.players, ...teamB.players];
  const yellowCardCount = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < yellowCardCount; i++) {
    const p = allPlayers[Math.floor(Math.random() * allPlayers.length)];
    if (p) {
      const tid = teamA.players.some(x => x.id === p.id) ? teamA.id : teamB.id;
      events.push({
        minute: Math.floor(Math.random() * 88) + 1,
        type: 'yellow_card',
        teamId: tid,
        playerName: p.name,
        detail: 'Falta tática no meio de campo para parar contra-ataque.'
      });
    }
  }

  // Red card (5% chance)
  if (Math.random() < 0.05) {
    const p = allPlayers[Math.floor(Math.random() * allPlayers.length)];
    if (p) {
      const tid = teamA.players.some(x => x.id === p.id) ? teamA.id : teamB.id;
      events.push({
        minute: 60 + Math.floor(Math.random() * 29),
        type: 'red_card',
        teamId: tid,
        playerName: p.name,
        detail: 'Falta dura punida com cartão vermelho direto pelo árbitro.'
      });
    }
  }

  events.sort((a, b) => a.minute - b.minute);

  // Simulated match stats
  const possessionA = 40 + Math.floor(Math.random() * 21) + (teamA.ratingMidfield - teamB.ratingMidfield) * 1.5;
  const finalPossessionA = Math.min(78, Math.max(22, Math.round(possessionA)));
  const finalPossessionB = 100 - finalPossessionA;

  const baseShotsA = 6 + Math.floor(Math.random() * 9) + Math.max(-4, (teamA.ratingAttack - teamB.ratingDefense) * 0.7);
  const baseShotsB = 6 + Math.floor(Math.random() * 9) + Math.max(-4, (teamB.ratingAttack - teamA.ratingDefense) * 0.7);

  return {
    ...match,
    played: true,
    scoreA,
    scoreB,
    penaltiesA,
    penaltiesB,
    events,
    stats: {
      possessionA: finalPossessionA,
      possessionB: finalPossessionB,
      shotsA: Math.max(2, Math.round(baseShotsA)),
      shotsB: Math.max(2, Math.round(baseShotsB)),
      foulsA: 7 + Math.floor(Math.random() * 10),
      foulsB: 7 + Math.floor(Math.random() * 10),
      cornersA: 1 + Math.floor(Math.random() * 7),
      cornersB: 1 + Math.floor(Math.random() * 7)
    }
  };
}

// Order standings in a specific group
export function calculateGroupStandings(group: Group, matches: Match[]): Group {
  const standings = group.teams.map(teamStat => {
    const stats = {
      teamId: teamStat.teamId,
      points: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0
    };

    const relevantMatches = matches.filter(
      m => m.groupLetter === group.letter && m.played && (m.teamAId === teamStat.teamId || m.teamBId === teamStat.teamId)
    );

    relevantMatches.forEach(m => {
      stats.played += 1;
      const isTeamA = m.teamAId === teamStat.teamId;
      const scoreSelf = isTeamA ? m.scoreA! : m.scoreB!;
      const scoreOpp = isTeamA ? m.scoreB! : m.scoreA!;

      stats.gf += scoreSelf;
      stats.ga += scoreOpp;

      if (scoreSelf > scoreOpp) {
        stats.won += 1;
        stats.points += 3;
      } else if (scoreSelf === scoreOpp) {
        stats.drawn += 1;
        stats.points += 1;
      } else {
        stats.lost += 1;
      }
    });

    stats.gd = stats.gf - stats.ga;
    return stats;
  });

  // Sort by Points, Goal Difference, Goals For, then Team Rating
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return getTeamById(b.teamId).ratingOverall - getTeamById(a.teamId).ratingOverall;
  });

  return {
    ...group,
    teams: standings
  };
}

export function processAllGroupStandings(groups: Group[], matches: Match[]): Group[] {
  return groups.map(g => calculateGroupStandings(g, matches));
}

// Evaluates all groups and generates the Round of 32 knockout matches.
// Elements:
// - Top 2 from all 12 groups (24 teams)
// - Top 8 best 3rd placed performers from the 12 groups (8 teams)
export function generateR32(groups: Group[]): Match[] {
  // 1. Collect top 2 from each group
  const groupWinners = groups.map(g => g.teams[0].teamId); // Index 0
  const groupRunners = groups.map(g => g.teams[1].teamId); // Index 1

  // 2. Map all 3rd placed performers
  const thirdPlacedStats = groups.map(g => {
    const stat = g.teams[2]; // Index 2
    return {
      teamId: stat.teamId,
      points: stat.points,
      gd: stat.gd,
      gf: stat.gf,
      groupLetter: g.letter
    };
  });

  // Sort 3rd placed teams by criteria: Points, GD, GF, then Overall Quality
  thirdPlacedStats.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return getTeamById(b.teamId).ratingOverall - getTeamById(a.teamId).ratingOverall;
  });

  // Select the 8 best cards
  const bestThirdPlacedIds = thirdPlacedStats.slice(0, 8).map(t => t.teamId);

  // 3. Create the 16 Round of 32 Matches:
  // - Match winners with 3rd-placed or opposite runners-up cleanly to prevent same-group clashes
  const matches: Match[] = [];

  // Match 1-8: Group Winners (A to H) vs Best 8 unique 3rd-placed performers
  for (let i = 0; i < 8; i++) {
    matches.push({
      id: `R32_${i + 1}`,
      roundLabel: '16avos de Final',
      teamAId: groupWinners[i], // e.g., W_A, W_B, ... W_H
      teamBId: bestThirdPlacedIds[i],
      played: false
    });
  }

  // Match 9-12: Remaining Winners (I to L) vs opposite runners-up (J to I, L to K)
  matches.push({ id: 'R32_9', roundLabel: '16avos de Final', teamAId: groupWinners[8], teamBId: groupRunners[9], played: false }); // W_I vs R_J
  matches.push({ id: 'R32_10', roundLabel: '16avos de Final', teamAId: groupWinners[9], teamBId: groupRunners[8], played: false }); // W_J vs R_I
  matches.push({ id: 'R32_11', roundLabel: '16avos de Final', teamAId: groupWinners[10], teamBId: groupRunners[11], played: false }); // W_K vs R_L
  matches.push({ id: 'R32_12', roundLabel: '16avos de Final', teamAId: groupWinners[11], teamBId: groupRunners[10], played: false }); // W_L vs R_K

  // Match 13-16: Runners-up (A to H) paired crosstown
  matches.push({ id: 'R32_13', roundLabel: '16avos de Final', teamAId: groupRunners[0], teamBId: groupRunners[1], played: false }); // R_A vs R_B
  matches.push({ id: 'R32_14', roundLabel: '16avos de Final', teamAId: groupRunners[2], teamBId: groupRunners[3], played: false }); // R_C vs R_D
  matches.push({ id: 'R32_15', roundLabel: '16avos de Final', teamAId: groupRunners[4], teamBId: groupRunners[5], played: false }); // R_E vs R_F
  matches.push({ id: 'R32_16', roundLabel: '16avos de Final', teamAId: groupRunners[6], teamBId: groupRunners[7], played: false }); // R_G vs R_H

  return matches;
}

// Generate Round of 16 (Oitavas de Final) from Round of 32 Winners
export function generateOitavas(r32Matches: Match[]): Match[] {
  const getWinner = (m: Match) => {
    if (m.scoreA! > m.scoreB!) return m.teamAId;
    if (m.scoreB! > m.scoreA!) return m.teamBId;
    return m.penaltiesA! > m.penaltiesB! ? m.teamAId : m.teamBId;
  };

  const winners = r32Matches.map(m => getWinner(m));

  // 16 winners -> 8 matches
  const matches: Match[] = [];
  for (let i = 0; i < 8; i++) {
    matches.push({
      id: `OIT_${i + 1}`,
      roundLabel: 'Oitavas de Final',
      teamAId: winners[i * 2],
      teamBId: winners[i * 2 + 1],
      played: false
    });
  }
  return matches;
}

// Generate Quarterfinals (Quartas de Final) from Round of 16 Winners
export function generateQuartas(oitavasMatches: Match[]): Match[] {
  const getWinner = (m: Match) => {
    if (m.scoreA! > m.scoreB!) return m.teamAId;
    if (m.scoreB! > m.scoreA!) return m.teamBId;
    return m.penaltiesA! > m.penaltiesB! ? m.teamAId : m.teamBId;
  };

  const winners = oitavasMatches.map(m => getWinner(m));

  // 8 winners -> 4 matches
  const matches: Match[] = [];
  for (let i = 0; i < 4; i++) {
    matches.push({
      id: `Q_${i + 1}`,
      roundLabel: 'Quartas de Final',
      teamAId: winners[i * 2],
      teamBId: winners[i * 2 + 1],
      played: false
    });
  }
  return matches;
}

// Generate Semifinals
export function generateSemifinais(quartasMatches: Match[]): Match[] {
  const getWinner = (m: Match) => {
    if (m.scoreA! > m.scoreB!) return m.teamAId;
    if (m.scoreB! > m.scoreA!) return m.teamBId;
    return m.penaltiesA! > m.penaltiesB! ? m.teamAId : m.teamBId;
  };

  const wQ1 = getWinner(quartasMatches[0]);
  const wQ2 = getWinner(quartasMatches[1]);
  const wQ3 = getWinner(quartasMatches[2]);
  const wQ4 = getWinner(quartasMatches[3]);

  return [
    {
      id: 'S1',
      roundLabel: 'Semifinal',
      teamAId: wQ1,
      teamBId: wQ2,
      played: false
    },
    {
      id: 'S2',
      roundLabel: 'Semifinal',
      teamAId: wQ3,
      teamBId: wQ4,
      played: false
    }
  ];
}

// Generate Final & 3rd Place Match
export function generateFinalAndThird(semis: Match[]): { final: Match, third: Match } {
  const getWinner = (m: Match) => {
    if (m.scoreA! > m.scoreB!) return m.teamAId;
    if (m.scoreB! > m.scoreA!) return m.teamBId;
    return m.penaltiesA! > m.penaltiesB! ? m.teamAId : m.teamBId;
  };

  const getLoser = (m: Match) => {
    if (m.scoreA! > m.scoreB!) return m.teamBId;
    if (m.scoreB! > m.scoreA!) return m.teamAId;
    return m.penaltiesA! > m.penaltiesB! ? m.teamBId : m.teamAId;
  };

  const wS1 = getWinner(semis[0]);
  const lS1 = getLoser(semis[0]);
  const wS2 = getWinner(semis[1]);
  const lS2 = getLoser(semis[1]);

  return {
    third: {
      id: 'M_3RD',
      roundLabel: 'Disputa de 3º Lugar',
      teamAId: lS1,
      teamBId: lS2,
      played: false
    },
    final: {
      id: 'M_FINAL',
      roundLabel: 'Grande Final',
      teamAId: wS1,
      teamBId: wS2,
      played: false
    }
  };
}
