
export class Config {
  static readonly project = 'cmovie';
  static readonly envName = 'dev';
  static readonly appName = `${Config.project}-${Config.envName}`;
  static readonly webBuildPath = '../apps/web/dist';
}
