export const initPlayerInput = (mesh) => {
    const inputState = {
      axis1Forward: 0.0,
      axis1Side: 0.0,
      pageUp: false,
      pageDown: false,
      space: false,
      shift: false,
      backspace: false,
    };
  
    const handleKeyDown = (event) => {
      if (event.currentTarget.activeElement !== document.body) {
        return;
      }
  
      switch (event.code) {
        case 'KeyW':
          inputState.axis1Forward = -1.0;
          break;
        case 'KeyA':
          inputState.axis1Side = -1.0;
          break;
        case 'KeyS':
            inputState.axis1Forward = 1.0;
            break;
        case 'KeyD':
            inputState.axis1Side = 1.0;
            break;

      }
    };
  
    const handleKeyUp = (event) => {
      if (event.currentTarget.activeElement !== document.body) {
        return;
      }
  
      switch (event.code) {
        case 'KeyW':
          inputState.axis1Forward = 0.0;
          break;
        case 'KeyA':
          inputState.axis1Side = 0.0;
          break;
        case 'KeyS':
            inputState.axis1Forward = 0.0;
            break;
        case 'KeyD':
            inputState.axis1Side = 0.0;
            break;
      }
    };
  
    const updateMeshPosition = () => {
      const { position } = mesh.current.position;
  
      // Update mesh position based on user input
      position.x += inputState.axis1Side * 0.1; // Adjust the factor as needed
      position.z += inputState.axis1Forward * 0.1; // Adjust the factor as needed
      
    };
  
    const init = () => {
      document.addEventListener('keydown', handleKeyDown, false);
      document.addEventListener('keyup', handleKeyUp, false);
    };
  
    const cleanup = () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  
    return {
      init,
      cleanup,
      updateMeshPosition,
    };
  };
  