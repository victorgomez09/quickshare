import { createDir, getFiles } from "@/api/file";
import { DragAndDropFileUpload } from "@/components/drag-zone";
import { FileItem } from "@/components/file-item";
import { API_URL } from "@/constants";
import { usePath } from "@/stores/path.store";
import { splitPaths } from "@/utils/string.util";
import { BreadcrumbItem, Breadcrumbs } from "@heroui/breadcrumbs";
import { Button } from "@heroui/button";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FilesPage() {
  const navigate = useNavigate();
  const { path, setPath } = usePath();
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const downloadLinkRef = useRef<HTMLAnchorElement>(null); // Create a ref to hold the <a> element
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<
    { name: string; isDir: boolean }[]
  >([]);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["getFiles", path],
    queryFn: () => getFiles(path),
  });
  const { mutateAsync, isPending, isSuccess } = useMutation({
    mutationKey: ["createDir"],
    mutationFn: (data: string) => createDir(data),
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

  const handleDoubleClick = async (
    name: string,
    isDir: boolean,
    fromBreadcrum: boolean = false
  ) => {
    if (isDir) {
      setPath(`${fromBreadcrum ? "" : path}/${name}`);

      await queryClient.refetchQueries({
        queryKey: ["getFiles", path],
        type: "active", // or 'all'
      });
    } else {
      navigate(`/files/details?file=${path}${name}`);
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

  // onDrop = (ev: React.DragEvent<HTMLDivElement>) => {
  //     if (ev.dataTransfer?.files?.length > 0) {
  //       this.filesPanelRef.addFileList(ev.dataTransfer.files);
  //     }
  //     ev.preventDefault();
  //   };

  if (isLoading || isPending) {
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
    <section className="relative flex flex-col gap-8">
      <DragAndDropFileUpload />
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Directory:</span>
          <Breadcrumbs
            itemClasses={{
              separator: "px-1",
            }}
            separator="/"
          >
            {data?.cwd.includes("/qs/files") && (
              <BreadcrumbItem isDisabled>/</BreadcrumbItem>
            )}
            {data?.cwd !== "/qs/files" &&
              splitPaths(data?.cwd || "/qs/files").map((path) => (
                <BreadcrumbItem
                  key={path}
                  onClick={() =>
                    splitPaths(data?.cwd || "/qs/files")[
                      splitPaths(data?.cwd || "/qs/files").length - 1
                    ] !== path && handleDoubleClick(path, true, true)
                  }
                >
                  {path}
                </BreadcrumbItem>
              ))}
          </Breadcrumbs>
        </div>

        <div className="flex items-center gap-2">
          <Button onPress={onOpen}>Add folder</Button>
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
        <span className="text-center italic">No files in this directory</span>
      )}

      <Modal isOpen={isOpen} placement="top-center" onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Create new folder
              </ModalHeader>
              <Form
                className="flex flex-col gap-4 w-full"
                onSubmit={async (e) => {
                  e.preventDefault();
                  let formData = Object.fromEntries(
                    new FormData(e.currentTarget)
                  );

                  const result = await mutateAsync(
                    `${data?.cwd}/${formData.name.toString()}`
                  );
                  if (result.msg === "OK" || isSuccess) {
                    onClose();
                    await refetch();
                  }
                }}
              >
                <ModalBody className="w-full">
                  <Input
                    isRequired
                    errorMessage="Please enter a valid name"
                    label="Folder name"
                    labelPlacement="outside"
                    name="name"
                    placeholder="Enter folder name"
                    type="text"
                  />
                </ModalBody>

                <ModalFooter>
                  <Button color="danger" variant="flat" onPress={onClose}>
                    Close
                  </Button>
                  <Button color="primary" type="submit">
                    Submit
                  </Button>
                </ModalFooter>
              </Form>
            </>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}
