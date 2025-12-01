import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from "react-router-dom";
import './i18n'; // Import the i18next configuration


createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <BrowserRouter>
        <App />
    </BrowserRouter>
  // </StrictMode>
  ,
)
