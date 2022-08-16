import { exec } from 'child_process';

/**
 * Utility class
 */
export class Utils {
  /**
   * Terminates the app's node process.
   */
  static shutdown() {
    console.log('Shutting down...');
    if ('win32' === process.platform) {
      // black sheep in every flock
      exec(`taskkill /im node.exe /F`);
    } else {
      process.exit(0);
    }
  }
}
