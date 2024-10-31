import React, { useState } from 'react';

function SimpleApp() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Simple React Counter</h1>
      <p>You clicked the button {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}

export default SimpleApp;  // Make sure to add this line
