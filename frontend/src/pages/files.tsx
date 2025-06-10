import { getFiles } from "@/api/file";
import { FileItem } from "@/components/file-item";
import { API_URL } from "@/constants";
import { getCwd, setCwd } from "@/utils/storage.util";
import { splitPaths } from "@/utils/string.util";
import { BreadcrumbItem, Breadcrumbs } from "@heroui/breadcrumbs";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FilesPage() {
  const navigate = useNavigate();
  const downloadLinkRef = useRef<HTMLAnchorElement>(null); // Create a ref to hold the <a> element
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<
    { name: string; isDir: boolean }[]
  >([]);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["getFiles"],
    queryFn: () => getFiles(getCwd()),
  });

  useEffect(() => {
    if (
      selectedFiles.length > 0 &&
      selectedFiles.length < 2 &&
      !selectedFiles[0].isDir
    ) {
      setShowDownloadButton(true);
    } else {
      setShowDownloadButton(false);
    }
  }, [selectedFiles]);

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

  const handleSelectedFile = (file: { name: string; isDir: boolean }) => {
    if (!selectedFiles.map((f) => f.name).includes(file.name)) {
      setSelectedFiles([...selectedFiles, file]);
    } else {
      const index = selectedFiles.findIndex((item) => item.name === file.name);
      const newArray = [...selectedFiles];
      if (index !== -1) {
        newArray.splice(index, 1);
        setSelectedFiles(newArray);
      }
    }
  };

  const handleDownloadFile = async () => {
    if (downloadLinkRef.current) {
      downloadLinkRef.current.click();
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
    <section className="flex flex-col gap-8">
      <div className="flex items-center justify-between w-full">
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

        <div className="flex items-center gap-2">
          <Button>Add folder</Button>
          {showDownloadButton && (
            <div>
              <a
                ref={downloadLinkRef} // Attach the ref to the <a> element
                href={
                  selectedFiles && selectedFiles.length > 0
                    ? `${API_URL}/v1/fs/files?fp=${selectedFiles[0].name}`
                    : "#"
                }
                target="_blank"
                rel="noopener noreferrer" // Recommended for target="_blank" for security
                style={{ display: "none" }} // Hide the link from the UI
              >
                Download Link
              </a>
              <Button color="secondary" onPress={handleDownloadFile}>
                Download
              </Button>
            </div>
          )}
        </div>
      </div>

      {data?.metadatas && data?.metadatas.length > 0 ? (
        <div className="flex flex-col gap-4 w-full overflow-auto">
          {data?.metadatas.map((file, index) => (
            <FileItem
              key={index}
              {...file}
              handleDoubleClick={handleDoubleClick}
              handleSelectedFile={handleSelectedFile}
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
