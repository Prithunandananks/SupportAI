import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./store/AuthContext";
import { ChatProvider } from "./store/ChatContext";

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <AppRoutes />
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;