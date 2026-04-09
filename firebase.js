import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 4. O ficheiro `package.json` e `vite.config.js`
Se você rodou o comando `npm create vite@latest` que lhe passei antes, o Vite **já criou estes dois ficheiros automaticamente para si** com a configuração perfeita. Não precisa de lhes tocar!

A estrutura final da sua pasta de trabalho deve estar exatamente assim:

```text
manga-admin/
├── node_modules/
├── public/
├── src/
│   ├── config/
│   │   └── firebase.js
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
