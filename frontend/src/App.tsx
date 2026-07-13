import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./store/AuthContext";
import { ChatProvider } from "./store/ChatContext";
import { NotificationProvider } from "./store/NotificationProvider";

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ChatProvider>
          <AppRoutes />
        </ChatProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;