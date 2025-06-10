import { Navbar } from "@/components/navbar";
import { Link } from "@heroui/link";
import { Outlet } from "react-router-dom";

export default function DefaultLayout() {
  return (
    <div className="relative flex flex-col h-screen">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-6 flex-grow">
        <Outlet />
      </main>
      <footer className="w-full flex items-center justify-center py-3">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://github.com/orgs/ESMO-ENTERPRISE"
          title="esmo solutions homepage"
        >
          <span className="text-default-600">Powered by</span>
          <p className="text-primary">ESMO Solutions</p>
        </Link>
      </footer>
    </div>
  );
}
