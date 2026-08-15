import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Launchpad from "./Launchpad.jsx";
import CommandCenter from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Launchpad />} />
      <Route path="/board" element={<CommandCenter />} />
      <Route path="*" element={<Launchpad />} />
    </Routes>
  </BrowserRouter>
);
