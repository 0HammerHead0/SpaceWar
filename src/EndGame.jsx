import React from 'react';
import './EndGame.css';
import ListItem from './ListItem';

const EndGame = () => {
  return (
    <div className='EndGame' id='EndGame'>
      <div className="heading">End Game</div>
      <div className="content" style={{ fontSize: '30px' }}>
        <div className="left">
          <p>ClientID</p>
        </div>
        <div className="right">
          <p>Kills</p>
        </div>
      </div>
      <div id="list"></div>
    </div>
  );
};

export default EndGame;
