import { useState } from 'react'
import './App.css'
import Notes from './notes'
import Login from './login'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Routes } from 'react-router'
import { Toaster } from 'sonner'
import { TooltipProvider } from './components/ui/tooltip'
import NoteDetail from './note-detail'
import { useUserStore } from './store/userStore'
import PricingPage from './prices';
const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         refetchOnWindowFocus: false, // default: true
      },
  },
});


function App() {
   const { userId } = useUserStore();
  const [count, setCount] = useState(0)

  return (    
     <QueryClientProvider client={queryClient}>
        <TooltipProvider>
      <GoogleOAuthProvider clientId="241687352985-umb35edcp1011r61tnvekch5suuu6ldk.apps.googleusercontent.com">
            <Routes>
               {
                  userId && (
                     <>
                        <Route path="/notes/:noteId" element={<NoteDetail />}/> 
                        <Route path="/notes" element={<Notes />}/> 
                        <Route path="/price-page" element={<PricingPage />}/> 
                     </>
                  )  } : (
                     <>
                        <Route path="/" element={<Login />}/>
                     </>
                  )
             
              
            </Routes>
         <Toaster />
      </GoogleOAuthProvider>
      </TooltipProvider>
     </QueryClientProvider>     


      
  )
}

export default App
