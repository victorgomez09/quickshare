import { getFiles } from "@/api/file";
import { FileItem } from "@/components/file-item";
import { getCwd, setCwd } from "@/utils/storage.util";
import { splitPaths } from "@/utils/string.util";
import { BreadcrumbItem, Breadcrumbs } from "@heroui/breadcrumbs";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function FilesPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["getFiles"],
    queryFn: () => getFiles(getCwd()),
  });

  const handleDoubleClick = (
    name: string,
    isDir: boolean,
    fromBreadcrum: boolean = false
  ) => {
    if (isDir) {
      if (getCwd() === "/") {
        setCwd(`${getCwd()}${name}`);
      } else {
        setCwd(`${fromBreadcrum ? "" : getCwd()}/${name}`);
      }

      refetch();
    } else {
      console.log("getCwd()", getCwd());
      navigate(`/files/details?file=${getCwd()}${name}`);
    }
  };

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
    <section className="flex flex-col gap-8 py-8 md:py-10">
      <div className="flex items-center gap-2">
        <span className="font-semibold">Directory:</span>
        <Breadcrumbs
          itemClasses={{
            separator: "px-1",
          }}
          separator="/"
        >
          <BreadcrumbItem
            onClick={() =>
              data?.cwd !== "/" && handleDoubleClick("/", true, true)
            }
          >
            Root
          </BreadcrumbItem>
          {splitPaths(data?.cwd || "/").map((path) => (
            <BreadcrumbItem
              key={path}
              onClick={() =>
                splitPaths(data?.cwd || "/")[
                  splitPaths(data?.cwd || "/").length - 1
                ] !== path && handleDoubleClick(path, true, true)
              }
            >
              {path}
            </BreadcrumbItem>
          ))}
        </Breadcrumbs>
      </div>

      {data?.metadatas && data?.metadatas.length > 0 ? (
        <div className="flex flex-col gap-6 w-full">
          {data?.metadatas.map((file, index) => (
            <FileItem
              key={index}
              {...file}
              handleDoubleClick={handleDoubleClick}
            />
          ))}
        </div>
      ) : (
        <span className="text-center italic">
          No hay ficheros en este directorio
        </span>
      )}
    </section>
  );
}
