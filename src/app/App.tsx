import { Routes, Route } from 'react-router';

function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">Fun Box Planning</h1>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
    </Routes>
  );
}
