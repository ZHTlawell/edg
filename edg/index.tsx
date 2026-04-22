/**
 * 应用入口文件
 * 作用：挂载 React 应用到 #root 节点，启用严格模式
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 获取根节点；若找不到则抛出错误，阻止应用启动
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
