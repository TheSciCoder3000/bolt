import Sidebar from "components/todo/Sidebar"
import TodoList from "components/todo/TodoList";
import { useEffect } from "react";
import { useParams } from "react-router-dom"

function TodoRoute() {
    const { todoSec } = useParams();

    useEffect(() => {
    }, [todoSec])
    return (
        <div className="flex-auto flex overflow-hidden">
            <Sidebar />
            <TodoList />
        </div>
    )
}

export default TodoRoute