import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // ✅ EKLENDİ: Router Kütüphanesi
import App from "./App.jsx";
import "./index.css"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* ✅ APP BİLEŞENİ ROUTER İLE SARMALANDI */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);