import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <main className="mx-auto w-full min-w-0 max-w-[1760px] px-5 pb-16 pt-8 sm:px-8 xl:px-12">
        <Outlet />
      </main>
    </div>
  );
}
