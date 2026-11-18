// Entry React: render <App /> ke #root.
// Tanpa StrictMode — diputuskan sengaja, supaya tidak ada risiko perilaku
// ganda (misalnya fetch mount dua kali) pada halaman ini.
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Elemen #root tidak ditemukan");
createRoot(rootEl).render(<App />);
