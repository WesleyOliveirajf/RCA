import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect screen size for responsive behavior
  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      // On mobile, sidebar starts hidden (collapsed = true hides it)
      if (mobile) setSidebarCollapsed(true)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function handleToggleSidebar() {
    setSidebarCollapsed((prev) => !prev)
  }

  const mainOffset = isMobile
    ? ''
    : sidebarCollapsed
      ? 'lg:ml-[72px]'
      : 'lg:ml-[260px]'

  return (
    <div className="h-screen overflow-hidden bg-surface">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
      />

      <div
        className={`
          flex h-screen flex-col
          transition-[margin] duration-300 ease-out
          ${mainOffset}
        `}
      >
        <Header onMenuToggle={handleToggleSidebar} />

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1600px] animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
