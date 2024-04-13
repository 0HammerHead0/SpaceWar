import React from 'react';
import './HealthBar.css';

const HealthBar = ({ kills }) => {
  return (
    <div>
      {/* Kill Counter */}
      <div className="killCounter">Kill:0</div>

      {/* Health Bar */}
      <div className="outerHealthBar"></div>
      <div className="innerHealthBar"></div>
      <div className="healthBlob"></div>
    </div>
  );
};

export default HealthBar;
