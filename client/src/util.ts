import { fetchCompletedCategories, fetchOverdueCategories } from "api/task";

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

export function toPgDateString(date: Date) {
    return `${date.getFullYear()}-${zeroPad(date.getMonth() + 1, 2)}-${zeroPad(date.getDate(), 2)}`
}

function setWhole(date: Date) {
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date
}

export function getTodayDate() {
    const now = setWhole(new Date())
    return [toPgDateString(now)]
}

export function getTomDate() {
    const now = setWhole(new Date());
    const tom = new Date(now.toISOString());
    tom.setDate(now.getDate() + 1);
    return [toPgDateString(tom)]
}

export function getWeekDateRange() {
    const now = setWhole(new Date());
    const start = new Date(now.toISOString());
    const end = new Date(now.toISOString());
    const day = now.getDay();

    start.setDate(now.getDate() - day);

    end.setDate(now.getDate() + (7-day));
    end.setMilliseconds(end.getMilliseconds() - 1);
    const diff = end.getTime() - start.getTime();


    const datesArr: string[] = [];
    for (let i = 0; i < (diff/(1000*3600*24)); i++) {
        const date = setWhole(new Date(start.toISOString()));
        date.setDate(date.getDate() + i)
        datesArr[i] = toPgDateString(date)
    }
    // console.log(datesArr)
    return datesArr

}

export function dateToString(date: Date) {
    const offset = date.getTimezoneOffset() / 60;
    date.setHours(date.getHours() + offset);
    return date.toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"short", day:"numeric"})
}

export async function getCategoriesFromParam(todoSec: string) {
    type op = "=" | "<" | ">";
    switch (todoSec) {
        case "today":
            return getTodayDate().flatMap(d => [false, true].map(c => ({ operator: "=" as op, date: d, isCompleted: c })));
        case "tomorrow":
            return getTomDate().flatMap(d => [false, true].map(c => ({ operator: "=" as op, date: d, isCompleted: c })));
        case "week":
            return getWeekDateRange ().flatMap(d => [false].map(c => ({ operator: "=" as op, date: d, isCompleted: c })));
        case "overdue": {
            const [ now ] = getTodayDate();
            return await fetchOverdueCategories(now);
        }
        case "completed": {
            const [ now ] = getTodayDate();
            return await fetchCompletedCategories(now);
        }
        // case "subj":
            // redirect to subject task container
        //     break;
        default:
            throw new Error("todoSec parameter does not exist implement http 404 here");
    }
}