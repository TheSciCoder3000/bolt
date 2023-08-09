import { useSocketIo } from 'hooks/socket';
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TodoList from './TodoList';
import { getCategoriesFromParam } from 'util';

interface TodoContainerProps {

}

type SavingStates = "saving" | "failed" | "saved"

export interface CategoryState {
    operator: "=" | "<" | ">"
    isCompleted: boolean,
    date: Date
}

const TodoContainer: React.FC<TodoContainerProps> = () => {
    const { todoSec } = useParams();
    const [category, setCategory] = useState<CategoryState[] | null>(null);
    const [saving, setSaving] = useState<SavingStates>("saved");
    const socket = useSocketIo();
    const navigate = useNavigate();

    useEffect(() => {
        if (!todoSec) return navigate("/login");
        setCategory(getCategoriesFromParam(todoSec))
    }, [todoSec, navigate])

    return (
        <div className="flex-auto h-full overflow-y-auto">
            <div className="p-10">
                <div className="mb-12">
                    <h1 className="text-6xl tracking-wide">{(todoSec?.charAt(0).toUpperCase()) + (todoSec?.slice(1) || "")}</h1>
                </div>
                {saving}
                <hr className="mb-3"/>

                <div className="mt-7 space-y-2">
                    {socket && category && category.sort((a) => a.isCompleted ? 1 : -1).map(cat => (
                        <TodoList
                            key={`${cat.date.toJSON()}-${cat.isCompleted.toString()}`}
                            socket={socket}
                            category={cat}
                            displayHeaders={todoSec ? !['today', 'tomorrow'].includes(todoSec) : false}
                            onSaving={setSaving} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default TodoContainer