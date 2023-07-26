function Sidebar() {
    const subjects = [
        {
            name: "Computer Programming"
        },
        {
            name: "System Architecture"
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

    return (
        <div className="h-full w-80 p-5 space-y-6 text-gray-500 text-sm bg-slate-100 border-r border-slate-300 drop-shadow-md">
            {/* Basic */}
            <div className="">
                <div className="pl-3 py-2 hover:cursor-pointer hover:bg-gray-200/30">Today</div>
                <div className="pl-3 py-2 hover:cursor-pointer hover:bg-gray-200/30">Tomorrow</div>
                <div className="pl-3 py-2 hover:cursor-pointer hover:bg-gray-200/30">Within the week</div>
            </div>

            {/* School */}
            <div>
                <h4 className="font-medium text-slate-400/80 mb-2">School</h4>
                <div>
                    {subjects.map(subj => (
                        <div className="pl-7 py-2 hover:cursor-pointer hover:bg-gray-200/30">
                            {subj.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Personal */}
            <div>
                <h4 className="font-medium text-slate-400/80 mb-2">Personal</h4>
                <div>
                    {personal.map(p => (
                        <div className="pl-7 py-2 hover:cursor-pointer hover:bg-gray-200/30">
                            {p.name}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Sidebar