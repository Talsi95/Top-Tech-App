import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
        כפתור Tailwind עובד ✅
      </button>
    </div>
  )
}

export default App
