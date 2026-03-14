/**
 * DTO da resposta do endpoint /predictions?fixture={id}
 */
export interface PredictionResponseDTO {
  predictions: {
    winner: {
      id: number | null;
      name: string | null;
      comment: string | null;
    };
    win_or_draw: boolean;
    under_over: string | null;
    goals: {
      home: string;
      away: string;
    };
    advice: string | null;
    percent: {
      home: string;
      draw: string;
      away: string;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
  };
  teams: {
    home: PredictionTeamDTO;
    away: PredictionTeamDTO;
  };
  comparison: {
    form: { home: string; away: string };
    att: { home: string; away: string };
    def: { home: string; away: string };
    poisson_distribution: { home: string; away: string };
    h2h: { home: string; away: string };
    goals: { home: string; away: string };
    total: { home: string; away: string };
  };
  h2h: Array<import('./fixture.dto').FixtureDTO>;
}

interface PredictionTeamDTO {
  id: number;
  name: string;
  logo: string;
  last_5: {
    form: string;
    att: string;
    def: string;
    goals: { for: { total: number; average: string }; against: { total: number; average: string } };
  };
  league: {
    form: string;
    fixtures: { played: { home: number; away: number; total: number }; wins: any; draws: any; losses: any };
    goals: { for: any; against: any };
    biggest: any;
    clean_sheet: any;
    failed_to_score: any;
  };
}
