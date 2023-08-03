import { NavLink as Link } from "react-router-dom"

function Sidebar() {
    const subjects = [
        {
            name: "Computer Programming",
            id: 0
        },
        {
            name: "System Architecture",
            id: 1
        }
    ]

    const personal = [
        {
            name: "workout"
        },
        {
            name: "programming"
        },
        {
            name: "gaming"
        }
    ]

    const basicActiveClass = "pl-3 py-2 block hover:cursor-pointer hover:bg-gray-200/30"
    const schoolActiveClass = "block pl-7 py-2 hover:cursor-pointer hover:bg-gray-200/30"

    const getClassName = (isActive: boolean, styleString: string) => {
        return isActive ? `text-green-600 ${styleString}`
            : styleString
    }

    return (
        <div className="h-full w-80 p-5 space-y-6 text-gray-500 text-sm bg-slate-100 border-r border-slate-300 drop-shadow-md">
            {/* Basic */}
            <div className="">
                <Link to={"/app/todo/today"} className={({ isActive }) => getClassName(isActive, basicActiveClass)}>Today</Link>
                <Link to={"/app/todo/tomorrow"} className={({ isActive }) => getClassName(isActive, basicActiveClass)}>Tomorrow</Link>
                <Link to={"/app/todo/week"} className={({ isActive }) => getClassName(isActive, basicActiveClass)}>Within the week</Link>
            </div>

            {/* School */}
            <div>
                <h4 className="font-medium text-slate-400/80 mb-2">School</h4>
                <div>
                    {subjects.map(subj => (
                        <Link to={`/app/todo/subj/${subj.id}`} className={({ isActive }) => getClassName(isActive, schoolActiveClass)}>
                            {subj.name}
                        </Link>
                    ))}
                </div>
            </div>

            {/* Personal */}
            <div>
                <h4 className="font-medium text-slate-400/80 mb-2">Personal</h4>
                <div>
                    {personal.map(p => (
                        <div className="block pl-7 py-2 hover:cursor-pointer hover:bg-gray-200/30">
                            {p.name}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Sidebar