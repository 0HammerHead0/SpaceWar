import React, { useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

import "./Home.css";
export default function Home() {
  const create = useRef();
  const join = useRef();
  const inputGameID = useRef();
  const joinGame = useRef();
  var message;
  const body = document.querySelector("body");
  var socket;
  var gameID = "";
  var clientID;
  const navigate = useNavigate();
  function recieveMessage(event) {
    const message = JSON.parse(event.data);
    console.log(message);
    return message;
  }
  useEffect(() =>{
    socket = new WebSocket("ws://localhost:3001");
    return () => {
      socket.close();
    };
  }, []);
  useEffect(() => {
    const handleOpen = (event) => {
      console.log("connection opened home page");
    };
    const handleMessage = (event) => {
      message = JSON.parse(event.data);
      console.log(message);
      if (message.method === "connectGame") {
        gameID = message.gameID;
        clientID = message.clientID;
        console.log("connected to game", message.gameID);
        console.log(message);
        navigate(`/experience/${gameID}/${clientID}`);
        window.location.reload(true);
      }
      else if(message.method === "connectGameThroughJoin"){
        gameID = message.gameID;
        clientID = message.clientID;
        console.log("connected to game", message.gameID);
        console.log(message);
        navigate(`/experience/${gameID}/${clientID}`);
        window.location.reload(true);
      }
    };

    const handleClose = (event) => {
      console.log("connection closed");
    };

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("close", handleClose);

    // Cleanup the event listeners when the component unmounts
    return () => {
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("close", handleClose);
    };
  }, [socket]);
  useEffect(() => {
    const handleCreateClick = () => {
      console.log("create game");
      socket.send(JSON.stringify({ method: "createGame" }));
    };

    const handleJoinClick = () => {
      inputGameID.current.style.display = "flex";
    };

    const handleBodyClick = (e) => {
      if (
        e.target !== inputGameID.current &&
        !inputGameID.current.contains(e.target) &&
        !e.target.closest(".create") &&
        !e.target.closest(".join")
      ) {
        inputGameID.current.style.display = "none";
      }
    };

    const handleJoinGameClick = () => {
      gameID = inputGameID.current.querySelector("input").value;
      console.log("join game", gameID);
      socket.send(JSON.stringify({ method: "joinGame", gameID }));
      // join
    };

    create.current.addEventListener("click", handleCreateClick);
    join.current.addEventListener("click", handleJoinClick);
    body.addEventListener("click", handleBodyClick);
    joinGame.current.addEventListener("click", handleJoinGameClick);

    // Cleanup the event listeners when the component unmounts
    return () => {
      create.current.removeEventListener("click", handleCreateClick);
      join.current.removeEventListener("click", handleJoinClick);
      body.removeEventListener("click", handleBodyClick);
      joinGame.current.removeEventListener("click", handleJoinGameClick);
    };
  }, [socket]);
  return (
    <>
      <div className="title">SpaceWars</div>
      <div className="container">
        <div ref={create} className="create">
          CREATE
        </div>
        <div ref={join} className="join">
          JOIN
        </div>
      </div>
      <div ref={inputGameID} className="inputGameID">
        <input type="text" placeholder="Game ID" />
        <button ref={joinGame}>Join</button>
      </div>
    </>
  );
}
