import AppRoutes from "./routes";
import ExpertHome from "./pages/ExpertHome";

export default function App() {
  // ExpertHome is imported here so it can be referenced or tested directly if needed.
  // Routing is still handled by AppRoutes.
  return <AppRoutes />;
}
