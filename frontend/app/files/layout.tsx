"use client";

import { getMe } from "@/api/user";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useUser } from "../providers";
import { Link } from "@heroui/link";
import { Navbar } from "@/components/navbar";

export default function FilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, setUser } = useUser();
  const { data, mutateAsync } = useMutation({
    mutationKey: ["getMe"],
    mutationFn: getMe,
  });

  useEffect(() => {
    const getMe = async () => {
      console.log("user", user);
      if (user === null || (user && Object.keys(user).length === 0)) {
        console.log("test");
        await mutateAsync();

        console.log("data", data);
        setUser(data || null);
      }
    };

    getMe();
  }, []);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block text-center justify-center">
        <div className="relative flex flex-col h-screen">
          <Navbar />
          <main className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
            {children}
          </main>
          <footer className="w-full flex items-center justify-center py-3">
            <Link
              isExternal
              className="flex items-center gap-1 text-current"
              href="https://heroui.com?utm_source=next-app-template"
              title="heroui.com homepage"
            >
              <span className="text-default-600">Powered by</span>
              <p className="text-primary">HeroUI</p>
            </Link>
          </footer>
        </div>
      </div>
    </section>
  );
}
