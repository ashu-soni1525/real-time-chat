import React , { useContext }  from 'react' 
import HomePage from './pages/HomePages'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthContext } from '../context/AuthContex'

const  App =()=> {
  const { authUser , loading } = useContext(AuthContext);
  console.log("authuser",authUser);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }
  return (
    <div className="bg-[url('/bgImage.svg')] bg-contain ">
      <Toaster />
   <Routes>
    <Route path='/' element={authUser ? <HomePage /> : <Navigate to={"/login"} />}/>
    <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/"/>}/>
    <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/"/>}/>

    <Route path='/profile' element={authUser ? <ProfilePage/> : <Navigate to={"/login"}/>}/>
   </Routes>
    </div>
  )
}

export default App

