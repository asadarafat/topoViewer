import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import SimpleApp from './SimpleApp';  // Import the SimpleApp component

ReactDOM.render(
  <React.StrictMode>
    <SimpleApp />  {/* Render SimpleApp */}
  </React.StrictMode>,
  document.getElementById('root')  // Mount the app at the root element
);
