import React,{ useState , useEffect} from 'react'
import './App.css'
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Canvas } from '@react-three/fiber';
import Experience from './Experience.jsx';
import Home from './components/Home.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Home/>} path="/" >
        </Route>
        <Route element={<Experience/>} path="/experience" >
        </Route>
      </Routes>
    </Router>
  )
}

export default App
