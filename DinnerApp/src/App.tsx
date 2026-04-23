import { Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import Favorites from './pages/Favorites';
import Planner from './pages/Planner';
import Randomizer from './pages/Randomizer';
import ShoppingList from './pages/ShoppingList';
import PrintView from './pages/PrintView';

export default function App() {
  return (
    <div className="min-h-full">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Favorites />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/wheel" element={<Randomizer />} />
          <Route path="/shopping" element={<ShoppingList />} />
          <Route path="/print" element={<PrintView />} />
        </Routes>
      </main>
    </div>
  );
}
