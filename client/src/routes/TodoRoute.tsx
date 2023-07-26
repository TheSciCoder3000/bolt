import Sidebar from "components/todo/Sidebar"

function TodoRoute() {
    return (
        <div className="flex overflow-hidden">
            <Sidebar />
            <div>list</div>
        </div>
    )
}

export default TodoRoute