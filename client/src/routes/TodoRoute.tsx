import TodoContainer from "components/todo";
import Sidebar from "components/todo/Sidebar"
import { useEffect } from "react";
import { useParams } from "react-router-dom"

function TodoRoute() {
    const { todoSec } = useParams();

    useEffect(() => {
    }, [todoSec])
    return (
        <div className="flex-auto flex overflow-hidden">
            <Sidebar />
            <TodoContainer />
        </div>
    )
}

export default TodoRoute