import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home.jsx";
import CapturePhotos from "./pages/host/CapturePhotos.jsx";
import ConfirmItems from "./pages/host/ConfirmItems.jsx";
import QrScreen from "./pages/host/QrScreen.jsx";
import JoinSession from "./pages/join/JoinSession.jsx";
import ParticipantView from "./pages/participant/ParticipantView.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/host/:sessionId/capture" element={<CapturePhotos />} />
      <Route path="/host/:sessionId/confirm" element={<ConfirmItems />} />
      <Route path="/host/:sessionId/qr" element={<QrScreen />} />
      <Route path="/join/:sessionId" element={<JoinSession />} />
      <Route
        path="/session/:sessionId/participant/:participantId"
        element={<ParticipantView />}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
