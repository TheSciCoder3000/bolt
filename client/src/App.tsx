import { logoutUser } from 'api/auth'
import AddTaskModal from 'components/modal/AddTaskModal'
import { useEffect, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  Outlet, 
  Link, 
  useNavigate,
  // useParams
} from 'react-router-dom'
import { useStore } from 'store'


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

  const [user, fetchUser] = useStore(state => [state.user, state.fetchUser])
  const navigate = useNavigate();
  const [showAddModal, setshowAddModal] = useState(false)
  const [modalData, setModalData] = useState<{ method: string, data: unknown } | null>(null)
  useHotkeys("ctrl+shift+a", () => setshowAddModal(true))
  // const { todoSec } = useParams()

  // console.log(user)
  useEffect(() => {
    fetchUser()
      .then(user => {
        if (!user) {
          console.log('redirecting')
          navigate("/login")
        }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      {user ? (
        <div className='flex h-[100vh]'>
          <div className='bg-slate-100 border-r border-zinc-300 w-16 h-full flex items-center flex-col justify-between py-8'>
            <div className='flex items-center flex-col space-y-4'>
              {links.map((link, indx) => (
                <div key={indx}>
                  <Link key={indx} to={link.path}>{link.name}</Link>
                </div>
              ))}
            </div>
            <div>
                <button onClick={() => logoutUser().then(() => navigate("/login"))}>logout</button>
            </div>
          </div>
          <Outlet context={[modalData, setModalData]} />
          {showAddModal && (<AddTaskModal onExit={() => setshowAddModal(false)} onSubmit={setModalData} />)}
        </div>
      ) :
      (
        <div>loading</div>
      )}
    </>
  )
}

export default App
