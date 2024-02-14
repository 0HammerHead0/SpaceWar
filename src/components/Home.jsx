import React, { useRef, useState, useEffect } from "react";
import "./Home.css";
import Experience from "../Experience";
export default function Home() {
  const create = useRef();
  const join = useRef();
  useEffect(() => {
    create.current.addEventListener("click", () => {
      console.log("create");
      
    });
    join.current.addEventListener("click", () => {
      console.log("join");
    });
  }, []);
  return (
    <>
      <div className="title">
        <h1>SpaceWars</h1>
      </div>
      <div className="container">
        <div ref={create} className="create"><a href='/experience' >CREATE</a></div>
        <div ref={join} className="join"><a href="/experience">JOIN</a></div>
      </div>
    </>
  );
}
