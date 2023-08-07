import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { createBrowserRouter, Navigate, RouterProvider, redirect } from 'react-router-dom'
import './index.css'

import TodoRoute from "routes/TodoRoute.tsx"
import LoginRoute from 'routes/LoginRoute.tsx'
import RegisterRoute from 'routes/RegisterRoute.tsx'
import { fetchUserApi } from 'api/auth.ts'

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
        element: <TodoRoute />,
        loader: async ({ params }) => {
          console.log(params.todoSec)
          if (!params.todoSec) return redirect("/login")
          return null
        },
        children: [
          {
            path: ":todoSec",
          },
          {
            path: "subj/:todoSec",
          }
        ]
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
