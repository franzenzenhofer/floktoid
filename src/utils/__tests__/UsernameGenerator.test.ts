import { describe, it, expect, beforeEach } from 'vitest';
import { UsernameGenerator } from '../UsernameGenerator';

describe('UsernameGenerator', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should generate usernames with correct format', () => {
    for (let i = 0; i < 100; i++) {
      const username = UsernameGenerator.generate();
      
      // Should match pattern: 2-3 Greek letters followed by 3 digits
      expect(username).toMatch(/^[A-Z][a-z]+([A-Z][a-z]+){1,2}\d{3}$/);
      
      // Should end with 3 digits
      const numbers = username.match(/\d+$/);
      expect(numbers).toBeTruthy();
      expect(numbers![0].length).toBe(3);
      
      // Numbers should be between 100-999
      const num = parseInt(numbers![0]);
      expect(num).toBeGreaterThanOrEqual(100);
      expect(num).toBeLessThanOrEqual(999);
    }
  });

  it('should contain valid Greek letter names', () => {
    const validGreekLetters = [
      'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 
      'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
      'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron',
      'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon',
      'Phi', 'Chi', 'Psi', 'Omega'
    ];

    for (let i = 0; i < 50; i++) {
      const username = UsernameGenerator.generate();
      const withoutNumbers = username.replace(/\d+$/, '');
      
      // Check that each capital letter starts a valid Greek letter
      let remaining = withoutNumbers;
      let letterCount = 0;
      
      while (remaining.length > 0) {
        let found = false;
        for (const letter of validGreekLetters) {
          if (remaining.startsWith(letter)) {
            remaining = remaining.substring(letter.length);
            letterCount++;
            found = true;
            break;
          }
        }
        if (!found) {
          throw new Error(`Invalid Greek letter in username: ${username}`);
        }
      }
      
      // Should have 2 or 3 Greek letters
      expect(letterCount).toBeGreaterThanOrEqual(2);
      expect(letterCount).toBeLessThanOrEqual(3);
    }
  });

  it('should generate different usernames', () => {
    const usernames = new Set<string>();
    for (let i = 0; i < 100; i++) {
      usernames.add(UsernameGenerator.generate());
    }
    
    // Should have high uniqueness (at least 90% unique)
    expect(usernames.size).toBeGreaterThan(90);
  });

  it('should store username in localStorage', () => {
    // Clear first to ensure we're starting fresh
    localStorage.clear();
    
    const username = UsernameGenerator.getSessionUsername();
    
    expect(username).toBeTruthy();
    expect(localStorage.getItem('floktoid_username')).toBe(username);
  });

  it('should return same username for the session', () => {
    // Clear first to ensure we're starting fresh
    localStorage.clear();
    
    const username1 = UsernameGenerator.getSessionUsername();
    const username2 = UsernameGenerator.getSessionUsername();
    const username3 = UsernameGenerator.getSessionUsername();
    
    expect(username1).toBe(username2);
    expect(username2).toBe(username3);
  });

  it('should clear username', () => {
    // Clear first to ensure we're starting fresh
    localStorage.clear();
    
    const username = UsernameGenerator.getSessionUsername();
    expect(localStorage.getItem('floktoid_username')).toBe(username);
    
    UsernameGenerator.clearSessionUsername();
    expect(localStorage.getItem('floktoid_username')).toBeNull();
    
    // Should generate new username after clearing
    const newUsername = UsernameGenerator.getSessionUsername();
    expect(newUsername).toBeTruthy();
    expect(newUsername).not.toBe(username);
    expect(localStorage.getItem('floktoid_username')).toBe(newUsername);
  });
});