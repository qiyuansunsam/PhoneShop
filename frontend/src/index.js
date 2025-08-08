import React from 'react';
import ReactDOM from 'react-dom/client';

import 'antd/dist/reset.css'; // Ant Design v5 样式
import App from './App'; // Keep App simplified
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext'; 

const targetElement = document.getElementById('root');
if (targetElement) {
    const root = ReactDOM.createRoot(targetElement);
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider> 
              <App />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </React.StrictMode>
    );
}