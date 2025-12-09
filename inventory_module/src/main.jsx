import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { testBackendConnection } from './utils/testConnection.js'

// Test backend connection on app start
testBackendConnection().then(result => {
  if (result.success) {
    console.log('✅ Frontend connected to backend successfully!');
  } else {
    console.warn('⚠️ Backend connection test failed. Make sure backend is running on http://localhost:3000');
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  </React.StrictMode>,
)