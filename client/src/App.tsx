import { Outlet, Link } from 'react-router-dom'

function App() {
  const links = [
    {
      path: "/app",
      name: "Home"
    },
    {
      path: "/app/todo",
      name: "Todo"
    },
    {
      path: "/app/calendar",
      name: "Calendar"
    },
  ]

  return (
    <div className='flex h-[100vh]'>
      <div className='bg-slate-100 border-r border-zinc-300 w-16 h-full flex items-center flex-col space-y-4'>
        {links.map(link => (
          <div>
            <Link to={link.path}>{link.name}</Link>
          </div>
        ))}
      </div>
      <Outlet />
    </div>
  )
}

export default App
