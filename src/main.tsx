import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then((registration) => {
    console.log('SW registrado com sucesso: ', registration.scope);
  }).catch((registrationError) => {
    console.warn('Falha no registro do SW: ', registrationError);
  });
}
