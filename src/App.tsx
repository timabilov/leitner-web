import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from "@/components/ui/button"
import Notes from './notes'
import Login from './login'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Routes } from 'react-router'
import { Toaster } from 'sonner'

const queryClient = new QueryClient();


function App() {
  const [count, setCount] = useState(0)

  return (    
     <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId="241687352985-umb35edcp1011r61tnvekch5suuu6ldk.apps.googleusercontent.com">
         <Routes>
            <Route path="/" Component={Login}/> {/* 👈 Renders at /app/ */}
            <Route path="/notes" Component={Notes}/> {/* 👈 Renders at /app/ */}
          </Routes>

        {/* <Login /> */}
         <Toaster />
      </GoogleOAuthProvider>
     </QueryClientProvider>     

      
  )
}

export default App
