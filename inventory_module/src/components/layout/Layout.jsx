import Sidebar from './Sidebar'
import TopBar from './TopBar'
import OfflineIndicator from '../common/OfflineIndicator'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'

const Layout = ({ children }) => {
  const { isOnline } = useNetworkStatus()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-w-0">
        <OfflineIndicator isOnline={isOnline} />
        <TopBar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}

export default Layout

