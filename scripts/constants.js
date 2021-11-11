// @ts-check
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { statSync } from 'fs';

export const SOX_WIN32_URL = 'https://downloads.sourceforge.net/project/sox/sox/14.4.2/sox-14.4.2-win32.zip';
export const SOX_MACOSX_URL = 'https://downloads.sourceforge.net/project/sox/sox/14.4.2/sox-14.4.2-macosx.zip';

// @ts-ignore
const script = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(script);
export const SOX_WIN32_OUTPUT_DIR = path.resolve(scriptsDir, '..', 'sox-win32');
export const SOX_WIN32_OUTPUT_BIN = path.resolve(SOX_WIN32_OUTPUT_DIR, 'sox.exe')
export const SOX_MACOSX_OUTPUT_DIR = path.resolve(scriptsDir, '..', 'sox-macosx');
export const SOX_MACOSX_OUTPUT_BIN = path.resolve(SOX_MACOSX_OUTPUT_DIR, 'rec');

export const isMac = os.type() === 'Darwin';
export const isWindows = os.type().indexOf('Windows') > -1;

/**
 * Check if a file exists.
 * @param {string} p
 * @returns {Promise<boolean>} `true` if the path exists, `false` otherwise.
 */
export async function exists(p) {
    try {
        await fs.stat(p);
        return true;
    } catch (_err) {
        return false;
    }
}

/**
 * Check if a file exists.
 * @param {string} p
 * @returns {boolean} `true` if the path exists, `false` otherwise.
 */
export function existsSync(p) {
    try {
        statSync(p);
        return true;
    } catch (_err) {
        return false;
    }
}
