import React from 'react' 
import HomePage from './pages/HomePages'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import { Route, Routes } from 'react-router-dom'


const  App =()=> {
  return (
    <div className="bg-[url('./src/assets/bgImage.svg')] bg-contain ">
   <Routes>
    <Route path='/' element={<HomePage/>}/>
    <Route path='/login' element={<LoginPage/>}/>
    <Route path='/profile' element={<ProfilePage/>}/>
   </Routes>
    </div>
  )
}

export default App
