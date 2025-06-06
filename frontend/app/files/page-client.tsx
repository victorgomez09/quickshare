"use client";

import { getFiles } from "@/api/file";
import { getMe } from "@/api/user";
import { useQuery } from "@tanstack/react-query";

export function FilesPageClient() {
  const { data } = useQuery({
    queryKey: ["getMe"],
    queryFn: getMe,
  });
  const { data: files } = useQuery({
    queryKey: ['getFiles'],
    queryFn: () => getFiles('/')
  })

  return (
    <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
      <span>From query: {data?.name}</span>
      {JSON.stringify(files)}
    </div>
  );
}
