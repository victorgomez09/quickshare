import { getFiles } from "@/api/file";
import { useAuth } from "@/provider";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@heroui/spinner";
import { FileItem } from "@/components/file-item";
import { addToast } from "@heroui/toast";

export default function FilesPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["getFiles"],
    queryFn: () => getFiles("/"),
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
      title: "Toast title",
      description: "Toast displayed successfully",
      color: "danger",
    });
  }

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block text-center justify-center w-full">
        <div className="flex flex-col gap-6 w-full">
          {data?.metadatas.map((file, index) => (
            <FileItem key={index} {...file} />
          ))}
        </div>
      </div>
    </section>
  );
}
