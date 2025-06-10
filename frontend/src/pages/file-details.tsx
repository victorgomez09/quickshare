import { getFile } from "@/api/file";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";

function useQueryParams() {
  const { search } = useLocation();

  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function FileDetailsPage() {
  const query = useQueryParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["getFile"],
    queryFn: () => getFile(query.get("file") || ""),
    enabled: query.get("file") !== "",
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    addToast({
      title: "Opps!",
      description: "Something goes wrong",
      color: "danger",
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <span>{JSON.stringify(data)}</span>
    </div>
  );
}
