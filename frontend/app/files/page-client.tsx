"use client";

import { getFiles } from "@/api/file";
import { getMe } from "@/api/user";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "../providers";
import FileItem from "@/components/file-item";

export function FilesPageClient() {
  const { user } = useUser();
  const { data: files } = useQuery({
    queryKey: ["getFiles"],
    queryFn: () => getFiles("/"),
  });

  return (
    <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
      <span>From query: {user?.name}</span>
      {JSON.stringify(files)}
      <div className="flex flex-col gap-2 w-full">
        {files?.metadatas?.map((file) => <FileItem />)}
      </div>
    </div>
  );
}
