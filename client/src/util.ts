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

export function getTodayDate() {
    const date = new Date();
    return [date.toISOString().split("T")[0]]
}

export function getTomDate() {
    const date = new Date();
    const tom = new Date();
    tom.setDate(date.getDate() + 1);
    return [tom.toISOString().split("T")[0]]
}

export function getWeekDateRange() {
    const now = new Date();
    const start = new Date();
    const end = new Date();
    const day = now.getDay();

    start.setDate(now.getDate() - day);
    end.setDate(now.getDate() + (6-day));

    return [
        start.toISOString().split("T")[0],
        end.toISOString().split("T")[0]
    ]
}

export function getDateFromString(todo: string) {
    switch (todo) {
        case "today":
            return getTodayDate();
        case "tomorrow":
            return getTomDate();
        case "week":
            return getWeekDateRange();
        default:
            throw new Error("Parameter contains invalid string")
    }
}