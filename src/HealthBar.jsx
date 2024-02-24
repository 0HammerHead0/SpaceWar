import React from 'react';
import './HealthBar.css'

const HealthBar = () => {

  return (
    <div>
      <div className="outerHealthBar"></div>
      <div className="innerHealthBar"></div>
      <div className="healthBlob"></div>
    </div>
  );
};

export default HealthBar;
