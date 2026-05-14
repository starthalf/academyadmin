import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // [1. 라우터 불러오기]
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* [2. 앱 전체를 BrowserRouter로 감싸기] */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);