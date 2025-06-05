"use client";

import { getMe } from "@/api/user";
import { useUserStore } from "@/stores/user";
import { useQuery } from "@tanstack/react-query";

export function FilesPageClient() {
  const { user } = useUserStore();
  const { data } = useQuery({
    queryKey: ["getMe"],
    queryFn: getMe,
  });

  return (
    <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
      <span>From query: {data?.name}</span>
      <span>From store: {user?.name}</span>
    </div>
  );
}
