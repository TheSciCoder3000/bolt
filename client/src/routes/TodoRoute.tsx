import TodoContainer from "components/todo";
import Sidebar from "components/todo/Sidebar"

function TodoRoute() {
    return (
        <div className="flex-auto flex overflow-hidden">
            <Sidebar />
            <TodoContainer />
        </div>
    )
}

export default TodoRoute