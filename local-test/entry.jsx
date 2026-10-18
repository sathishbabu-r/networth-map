import React from 'react';
import {createRoot} from 'react-dom/client';
import {App} from '../src/App.jsx';
export function mount(){createRoot(document.getElementById('app')).render(<><aside role="status" style={{padding:12,background:'#fff2bd',color:'#252015'}}>LOCAL TEST MODE · Disposable account · Offline test intelligence · No production connection</aside><App/></>);}
