import AppRoutes from "./routes/index";
import ExpertHome from "./pages/expert/ExpertHome";

export default function App() {
  // ExpertHome is imported here so it can be referenced or tested directly if needed.
  // Routing is still handled by AppRoutes.
  return <AppRoutes />;
}
