import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../../src/App.jsx';
if (!['127.0.0.1', 'localhost'].includes(window.location.hostname)) {
  throw new Error('The sample-data preview runs on this computer only.');
}
createRoot(document.getElementById('app')).render(<>
  <p role="status" style={{margin:0,padding:'8px 16px',background:'#fff',color:'#23415b',fontSize:12}}>Local test preview · sample data only · no Google, AI or production database connection · reload to reset</p>
  <App />
</>);
