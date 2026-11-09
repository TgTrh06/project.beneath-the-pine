export interface SceneMember { accountId: string; }
export const wandererColors = ['#597666', '#b67c52', '#7d8295', '#a18c58', '#697b91', '#986e64', '#79906a', '#a38a79'];

export function appearanceIndex(id: string) {
  return [...id].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 0) % wandererColors.length;
}
