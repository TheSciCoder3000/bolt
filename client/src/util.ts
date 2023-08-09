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

function setUtc(date: Date) {
    date.setUTCHours(0);
    date.setUTCMinutes(0);
    date.setUTCSeconds(0);
    date.setUTCMilliseconds(0);
    return date
}

export function getTodayDate() {
    const now = setUtc(new Date())
    return [now.toJSON()]
}

export function getTomDate() {
    const now = setUtc(new Date());
    const tom = new Date(now.toISOString());
    tom.setDate(now.getDate() + 1);
    return [tom.toJSON()]
}

export function getWeekDateRange() {
    const now = setUtc(new Date());
    const start = new Date();
    const end = new Date();
    const day = now.getDay();

    start.setDate(now.getDate() - day);

    end.setDate(now.getDate() + (7-day));
    end.setMilliseconds(end.getMilliseconds() - 1);
    const diff = end.getTime() - start.getTime();


    const datesArr: string[] = [];
    for (let i = 0; i < (diff/(1000*3600*24)); i++) {
        const date = setUtc(new Date(start.toISOString()));
        date.setDate(date.getDate() + i)
        datesArr[i] = date.toJSON()
    }
    // console.log(datesArr)
    return datesArr

}

export function dateToString(date: Date) {
    const offset = date.getTimezoneOffset() / 60;
    date.setHours(date.getHours() + offset);
    return date.toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"short", day:"numeric"})
}

export function getCategoriesFromParam(todoSec: string) {
    type op = "=" | "<" | ">";
    switch (todoSec) {
        case "today":
            return getTodayDate().flatMap(d => [false, true].map(c => ({ operator: "=" as op, date: d, isCompleted: c })));
        case "tomorrow":
            return getTomDate().flatMap(d => [false, true].map(c => ({ operator: "=" as op, date: d, isCompleted: c })));
        case "week":
            console.log(getWeekDateRange ().flatMap(d => [false].map(c => ({ operator: "=" as op, date: d, isCompleted: c }))))
            return getWeekDateRange ().flatMap(d => [false].map(c => ({ operator: "=" as op, date: d, isCompleted: c })));
        case "overdue":
            return getTodayDate().flatMap(d => [false].map(c => ({ operator: "<" as op, date: d, isCompleted: c })));
        case "completed":
            return getTodayDate().flatMap(d => [true].map(c => ({ operator: ">" as op, date: d, isCompleted: c })));
        // case "subj":
            // redirect to subject task container
        //     break;
        default:
            throw new Error("todoSec parameter does not exist implement http 404 here");
    }
}