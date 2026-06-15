export interface Team {
  name: string;
  code: string;
}

export interface Group {
  name: string;
  teams: Team[];
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  predictedWinner?: 'home' | 'away';
  exactScore?: {
    home: number;
    away: number;
  };
}

export interface PredictionState {
  semiFinalists: Team[]; // Exactly 4 teams
  semiFinals: {
    sf1?: Match;
    sf2?: Match;
  };
  final?: Match;
  champion?: Team;
}

export interface PenaltyShot {
  direction: 'left' | 'center' | 'right';
  height: 'low' | 'medium' | 'high';
  power: number; // 0 to 100
  outcome: 'goal' | 'saved' | 'post' | 'crossbar' | 'missed';
}

export interface ShootoutScore {
  player: ('goal' | 'miss' | 'saved' | null)[];
  opponent: ('goal' | 'miss' | 'saved' | null)[];
}
