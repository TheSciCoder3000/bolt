import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import './index.css'

import TodoRoute from "./routes/TodoRoute.tsx"

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to={"/app"}/>,
  },
  {
    path: "/app",
    element: <App />,
    children: [
      {
        path: "",
        element: <Navigate to={"/app/todo"} />
      },
      {
        path: "todo",
        element: <TodoRoute />
      }
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>,
)
