import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import './index.css'

import TodoRoute from "routes/TodoRoute.tsx"
import LoginRoute from 'routes/LoginRoute.tsx'
import RegisterRoute from 'routes/RegisterRoute.tsx'
import { fetchUserApi } from 'api/auth.ts'
import { getCategoriesFromParam } from 'util.ts'
import CalendarRoute from 'routes/CalendarRoute.tsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to={"/app"}/>,
    errorElement: <div>Error 404</div>,
  },
  {
    path: "/app",
    element: <App />,
    children: [
      {
        path: "",
        element: <Navigate to={"/app/todo/today"} />
      },
      {
        path: "todo",
        errorElement: <div>error</div>,
        children: [
          {
            index: true,
            element: <Navigate to={"/app/todo/today"} />
          },
          {
            path: ":todoSec",
            element: <TodoRoute />,
            loader: async ({ params }) => {
              const accepted = ["today", "tomorrow", "week", "completed", "overdue"]
              if (!params.todoSec || !accepted.includes(params.todoSec)) throw new Response("Not found", { status: 404 })
              return await getCategoriesFromParam(params.todoSec)
            },
          },
          {
            path: "subj/:todoSec",
            element: <div>testing</div>
          }
        ]
      },
      {
        path: "calendar",
        element: <CalendarRoute />,
        // children: [
        //   {
        //     index: true,
        //   }
        // ]
      }
    ],
  },
  {
    path: "/login",
    element: <LoginRoute />,
    loader: async () => {
      return await fetchUserApi()
    }
  },
  {
    path: "/register",
    element: <RegisterRoute />,
    loader: async () => {
      return await fetchUserApi()
    }
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>,
)
