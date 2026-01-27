declare module 'nba' {
  export namespace stats {
    function leagueGameLog(params: any): Promise<any>;
    function scoreboard(params: any): Promise<any>;
    function boxScoreSummaryV2(params: any): Promise<any>;
  }
}
