// Utility to get version information from package.json
import packageJson from '../../package.json';

export interface VersionInfo {
  version: string;
  displayVersion: string;
  releaseDate: string;
  isLatest: boolean;
}

export const getVersionInfo = (): VersionInfo => {
  const version = packageJson.version || '1.0.0';
  
  // Extract major version number for display (e.g., "1.19.0" -> "19")
  const versionParts = version.split('.');
  const majorVersion = versionParts[1] || versionParts[0];
  const displayVersion = `Versão ${majorVersion}`;
  
  // Get current date as release date (you can customize this)
  const now = new Date();
  const releaseDate = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  return {
    version,
    displayVersion,
    releaseDate,
    isLatest: true // Always true since we're using the current version
  };
};