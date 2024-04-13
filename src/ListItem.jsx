import React from 'react';
import './EndGame.css';

const ListItem = (props) => {
  return (
    <div class="content">
        <div class="left">
        <p>{props.clientID}</p>
        </div>
        <div class="right">
            <p>{props.kills}</p>
        </div>
    </div>
  );
};

export default ListItem ;
