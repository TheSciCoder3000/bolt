export const getTIMESTAMPTZ = (date: Date) => {
    let offset: string | number = -date.getTimezoneOffset() / 60;
    const sign = (offset >= 0) ? '+' : '-';
    offset = Math.abs(offset);
    offset = (offset < 10) ? ('0' + offset) : offset;
    let TIMESTAMPTZ = date.toISOString();
    // console.log({TIMESTAMPTZ})
    TIMESTAMPTZ = TIMESTAMPTZ.replace('T', ' ');
    TIMESTAMPTZ = TIMESTAMPTZ.replace('Z', `000${sign}${offset}`);
    return TIMESTAMPTZ;
};

export function zeroPad(num: number, numZeros: number) {
    const n = Math.abs(num);
    const zeros = Math.max(0, numZeros - Math.floor(n).toString().length );
    let zeroString = Math.pow(10,zeros).toString().substr(1);
    if( num < 0 ) {
        zeroString = '-' + zeroString;
    }

    return zeroString+n;
}

export function getStartDate(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return new Date(`${year}-${month}-${day}`)
}

export function getTodayRange() {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const today = getStartDate(new Date(Date.now() + offset));
    const tom = getStartDate(new Date(Date.now() + (3600 * 1000 * 24) + offset));

    return {
        today: getTIMESTAMPTZ(today),
        tom: getTIMESTAMPTZ(tom)
    }
}