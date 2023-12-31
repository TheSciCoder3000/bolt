import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import './index.css'

import TodoRoute from "routes/TodoRoute.tsx"
import LoginRoute from 'routes/LoginRoute.tsx'
import RegisterRoute from 'routes/RegisterRoute.tsx'

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
        children: [
          {
            path: ":todoSec",
            element: <TodoRoute />
          },
          {
            path: "subj/:todoSec",
            element: <TodoRoute />
          }
        ]
      }
    ],
  },
  {
    path: "/login",
    element: <LoginRoute />
  },
  {
    path: "/register",
    element: <RegisterRoute />
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>,
)
