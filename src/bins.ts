import shell from 'shelljs';
import {
    SOX_MACOSX_OUTPUT_BIN,
    SOX_WIN32_OUTPUT_BIN,
    existsSync,
    isMac,
    isWindows,
} from "../scripts/constants.js";

export function findAlsa() {
    const arecordPath = shell.which('arecord');
    if (arecordPath) {
        return arecordPath.toString();
    }

    throw new Error('arecord is not installed');
}

export function findSox(): string {
    const installed = existsSync(SOX_WIN32_OUTPUT_BIN);
    if (installed) {
        return SOX_WIN32_OUTPUT_BIN;
    }

    const soxPath = shell.which('sox');
    if (soxPath) {
        return soxPath.toString();
    }

    throw new Error('sox is not installed');
}

export function findRec(): string {
    // TODO: this order won't work on M1 macOS. Sox binaries are intel.
    const installed = existsSync(SOX_MACOSX_OUTPUT_BIN);
    if (installed) {
        return SOX_MACOSX_OUTPUT_BIN;
    }

    const recPath = shell.which('rec');
    if (recPath) {
        return recPath.toString();
    }

    throw new Error('sox is not installed');
}

export function getBinPath() {
    if (isWindows) {
        return findSox();
    } else if (isMac) {
        return findRec();
    } else {
        return findAlsa();
    }
}

