import { logoutUser } from 'api/auth'
import AddTaskModal from 'components/modal/AddTaskModal'
import { useEffect, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  Outlet, 
  NavLink as Link, 
  useNavigate,
  // useParams
} from 'react-router-dom'
import { useStore } from 'store'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRightFromBracket, faCalendar, faChartLine, faClipboardCheck } from '@fortawesome/free-solid-svg-icons'

function App() {
  const links = [
    {
      path: "/app",
      name: "Home",
      icon: faChartLine,
      end: true
    },
    {
      path: "/app/todo",
      name: "Todo",
      icon: faClipboardCheck,
      end: false
    },
    {
      path: "/app/calendar",
      name: "Calendar",
      icon: faCalendar,
      end: true
    },
  ]

  const [user, fetchUser] = useStore(state => [state.user, state.fetchUser])
  const navigate = useNavigate();
  const [showAddModal, setshowAddModal] = useState(false)
  const [modalData, setModalData] = useState<{ method: string, data: unknown } | null>(null)
  useHotkeys("ctrl+shift+a", () => setshowAddModal(true))

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

  const getClassName = (isActive: boolean, styleString: string) => {
    return isActive ? `text-green-600 ${styleString}`
        : styleString
  }

  return (
    <>
      {user ? (
        <div className='flex h-[100vh]'>
          <div className='bg-slate-100 border-r border-zinc-300 w-16 h-full flex items-center flex-col justify-between py-4'>
            <div className='flex items-center flex-col space-y-4 w-full'>
              {links.map((link, indx) => (
                <Link key={indx} to={link.path} end={link.end} className={({ isActive }) => getClassName(
                  isActive, 
                  "w-full flex justify-center aspect-square items-center hover:bg-gray-200/50 text-gray-500"
                )} >
                  <FontAwesomeIcon icon={link.icon} className='text-2xl' />
                </Link>
              ))}
            </div>
            <div className='w-full p-2'>
                <button onClick={() => logoutUser().then(() => navigate("/login"))} className="w-full p-3 rounded-md aspect-square hover:bg-gray-200/80">
                  <FontAwesomeIcon icon={faArrowRightFromBracket} className='text-lg' />
                </button>
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
