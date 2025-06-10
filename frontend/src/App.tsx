import DefaultLayout from "@/layouts/default";
import FilesPage from "@/pages/files";
import IndexPage from "@/pages/index";
import LoginPage from "@/pages/login";
import PrivateRoute from "@/routes/private-route";
import { Route, Routes } from "react-router-dom";
import FileDetailsPage from "./pages/file-details";

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<DefaultLayout />}>
        <Route element={<LoginPage />} path="/login" />
        <Route element={<PrivateRoute />}>
          <Route element={<FilesPage />} path="/files" />
          <Route element={<FileDetailsPage />} path="/files/details" />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
