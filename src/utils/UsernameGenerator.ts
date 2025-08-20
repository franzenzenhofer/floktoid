/**
 * Greek Letter Username Generator
 * Generates unique usernames like AlphaBetaGamma778
 */

const GREEK_LETTERS = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 
  'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
  'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron',
  'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon',
  'Phi', 'Chi', 'Psi', 'Omega'
];

export class UsernameGenerator {
  /**
   * Generate a random Greek letter username
   * Format: 2-3 Greek letters + 3 digit number
   * Example: AlphaBetaGamma778, ZetaPsi123
   */
  static generate(): string {
    // Pick 2-3 random Greek letters
    const letterCount = Math.random() < 0.5 ? 2 : 3;
    const letters: string[] = [];
    
    for (let i = 0; i < letterCount; i++) {
      const randomIndex = Math.floor(Math.random() * GREEK_LETTERS.length);
      letters.push(GREEK_LETTERS[randomIndex]);
    }
    
    // Generate 3 digit number (100-999)
    const number = Math.floor(Math.random() * 900) + 100;
    
    return letters.join('') + number;
  }
  
  /**
   * Generate or retrieve username from localStorage
   * Ensures consistent username FOREVER (across sessions)
   */
  static getSessionUsername(): string {
    const STORAGE_KEY = 'floktoid_username';
    
    // Check if username already exists in localStorage (persists FOREVER!)
    let username = localStorage.getItem(STORAGE_KEY);
    
    if (!username) {
      // Generate new username and store it PERMANENTLY
      username = this.generate();
      localStorage.setItem(STORAGE_KEY, username);
      console.log('[USERNAME] Generated new permanent username:', username);
    }
    
    return username;
  }
  
  /**
   * Clear the username (for testing or if user wants new identity)
   */
  static clearSessionUsername(): void {
    localStorage.removeItem('floktoid_username');
  }
}