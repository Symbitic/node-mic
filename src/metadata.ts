const METADATA = /In:([0-9.]+)% ([0-9]{2}):([0-9]{2}):([0-9]{2}).([0-9]{2}) \[([0-9]{2}):([0-9]{2}):([0-9]{2}).([0-9]{2})\] Out:([0-9.]+)k? +?\[[\! \-\=]+\|([\! \-\=]+)\] Hd:([0-9.]+)? Clip:([0-9]+)/g;

export function extractMetadata(info: string) {
    let infoStr = info;
    if (infoStr.indexOf("Hd:") === -1) {
        infoStr = info.replace(/]( )+Clip:/g, "] Hd:0.0 Clip:");
    }

    const metadata = {
        in: 0.0,
        timestamp: 0,
        timestamp2: 0,
        out: 0.0,
        volume: 0,
        hd: 0,
        clip: 0,
    };

    let m: RegExpExecArray;

    while ((m = METADATA.exec(infoStr)) !== null) {
        if (m.index === METADATA.lastIndex) {
            METADATA.lastIndex++;
        }

        if (m.length < 2) {
            return 0;
        }

        let timestampItems: string[];

        for (let i = 1, len = m.length; i < len; ++i) {
            switch (i) {
                case 1:
                    metadata.in = parseFloat(m[i]);
                    break;
                case 2:
                    timestampItems = m.slice(2, 6);
                    metadata.timestamp = extractTimestamp(timestampItems);
                    i = i + 3;
                    break;
                case 6:
                    timestampItems = m.slice(6, 10);
                    metadata.timestamp2 = extractTimestamp(timestampItems);
                    i = i + 3;
                    break;
                case 10:
                    metadata.out = parseFloat(m[i]);
                    break;
                case 11:
                    metadata.volume = extractVolumeLevel(m[i]);
                    break;
                case 12:
                    metadata.hd = parseFloat(m[i]);
                    break;
                case 13:
                    metadata.clip = parseInt(m[i], 10);
                    break;
            }
        }
    }

    return metadata;
}

function extractTimestamp(items: string[]) {
    let timestamp = 0;
    let value = 0;

    for (let i = 0, len = items.length; i < len; ++i) {
        value = parseInt(items[i], 10);
        switch (i) {
            case 0:
                value *= 60;
            case 1:
                value *= 60;
            case 2:
                value *= 1000;
                break;
            case 3:
                value *= 10;
                break;
        }

        timestamp = timestamp + value;
    }

    return timestamp;
};

function extractVolumeLevel(ascii: string) {
    let volume = 0;

    for (let i = 0, len = ascii.length; i < len; ++i) {
        switch (ascii[i]) {
            case " ":
                break;
            case "=":
                volume = volume + 2;
                break;
            case "-":
                volume = volume + 1;
                break;
            case "!":
                volume = volume + 4;
                break;
            default:
                break;
        }
    }

    return volume;
};
