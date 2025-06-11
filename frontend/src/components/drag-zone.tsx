import { Listbox, ListboxItem } from "@heroui/listbox";
import { Card, CardHeader, CardBody } from "@heroui/card";
import React, {
  useState,
  useRef,
  useCallback,
  ChangeEvent,
  DragEvent,
  useEffect,
} from "react";

// Define the type for the component's props
interface DragAndDropFileUploadProps {
  onFilesSelected?: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>; // Optional upload handler
  maxFiles?: number;
  allowedFileTypes?: string[]; // e.g., ['image/jpeg', 'image/png', '.pdf']
}

export const DragAndDropFileUpload: React.FC<DragAndDropFileUploadProps> = ({
  onFilesSelected,
  onUpload,
  maxFiles = 5,
  allowedFileTypes = [],
}) => {
  // State for internal drag visual feedback (within the dropzone)
  const [isDraggingOverDropzone, setIsDraggingOverDropzone] = useState(false);
  // State to control overall visibility of the dropzone based on window-level drag
  const [showGlobalDropzone, setShowGlobalDropzone] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use a ref to track drag enter/leave events across the window
  // This helps distinguish dragging over children vs leaving the entire window
  const dragCounter = useRef(0);

  // Effect to add global drag event listeners
  useEffect(() => {
    const handleDragEnter = (e: globalThis.DragEvent) => {
      // Prevent default to allow drop
      e.preventDefault();
      // Increment counter when a drag enters any element on the page
      dragCounter.current++;
      // If this is the first dragenter event (meaning dragging started over the window), show dropzone
      if (dragCounter.current === 1) {
        setShowGlobalDropzone(true);
      }
    };

    const handleDragLeave = (e: globalThis.DragEvent) => {
      // Prevent default to allow drop
      e.preventDefault();
      // Decrement counter when a drag leaves an element
      dragCounter.current--;
      // If counter is 0, it means the drag has left the entire window
      if (dragCounter.current === 0) {
        setShowGlobalDropzone(false);
      }
    };

    const handleDragOver = (e: globalThis.DragEvent) => {
      // Must prevent default on dragover to allow drop event to fire
      e.preventDefault();
    };

    const handleDrop = (e: globalThis.DragEvent) => {
      // Prevent default to allow drop (and prevent browser from opening file)
      e.preventDefault();
      // Reset counter and hide dropzone after a drop
      dragCounter.current = 0;
      setShowGlobalDropzone(false);
      // The actual file handling will be done by the component's internal handleDrop
    };

    // Add event listeners to the window
    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  // Helper to validate file types
  const validateFileType = (file: File): boolean => {
    if (allowedFileTypes.length === 0) {
      return true; // No restrictions
    }
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    return allowedFileTypes.some((type) => {
      // Check for MIME type match or file extension match
      return (
        type.toLowerCase() === file.type.toLowerCase() ||
        type.toLowerCase() === fileExtension
      );
    });
  };

  // Process files from either drag/drop or input change
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newFiles: File[] = [];
      let filesAdded = 0;
      let typeErrorOccurred = false;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (validateFileType(file)) {
          // Prevent adding duplicate files based on name and size (simple check)
          const isDuplicate = selectedFiles.some(
            (existingFile) =>
              existingFile.name === file.name && existingFile.size === file.size
          );

          if (!isDuplicate && filesAdded < maxFiles) {
            newFiles.push(file);
            filesAdded++;
          } else if (isDuplicate) {
            setMessage(`File "${file.name}" is already added.`);
          } else if (filesAdded >= maxFiles) {
            setMessage(`Max files limit (${maxFiles}) reached.`);
          }
        } else {
          typeErrorOccurred = true;
          setMessage(
            `File type not allowed: ${file.name}. Allowed types: ${allowedFileTypes.join(", ")}`
          );
        }
      }

      if (newFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...newFiles]);
        setMessage(typeErrorOccurred ? message : ""); // Keep type error message if it occurred
      } else if (!typeErrorOccurred && files.length > 0) {
        setMessage(""); // Clear message if no files added due to other reasons like duplicates or max limit
      }

      // Call the optional callback prop
      if (onFilesSelected) {
        onFilesSelected(newFiles);
      }
    },
    [selectedFiles, maxFiles, allowedFileTypes, onFilesSelected, message]
  );

  // Handler for file input change
  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setMessage(""); // Clear any previous messages
      handleFiles(event.target.files);
      // Clear the input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFiles]
  );

  // Drag event handlers specific to the dropzone element
  const handleDropzoneDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault(); // Prevent default to allow drop
      setIsDraggingOverDropzone(true);
      setMessage(""); // Clear any previous messages
    },
    []
  );

  const handleDropzoneDragLeave = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOverDropzone(false);
    },
    []
  );

  const handleDropzoneDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingOverDropzone(false);
      setMessage(""); // Clear any previous messages
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  // Handler for clicking the upload area
  const handleAreaClick = useCallback(() => {
    fileInputRef.current?.click(); // Programmatically click the hidden file input
  }, []);

  // Handler for removing a file
  const handleRemoveFile = useCallback((fileToRemove: File) => {
    setSelectedFiles((prevFiles) =>
      prevFiles.filter((file) => file !== fileToRemove)
    );
    setMessage(""); // Clear any messages
  }, []);

  // Simulated upload handler
  const handleUploadClick = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setMessage("Please select files to upload.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      if (onUpload) {
        await onUpload(selectedFiles); // Use provided upload handler
      } else {
        // Simulate an API call
        console.log(
          "Simulating upload for files:",
          selectedFiles.map((f) => f.name)
        );
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay
        setMessage("Files uploaded successfully!");
        setSelectedFiles([]); // Clear files after successful upload
      }
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage(
        `Upload failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setUploading(false);
    }
  }, [selectedFiles, onUpload]);

  return (
    <>
      {/* <div className="flex flex-col items-center justify-center p-4 font-inter absolute w-6/12 h-6/12"> */}
      {/* The main container for the upload component */}
      {/* <div className="w-full p-8 rounded-xl shadow-2xl z-10"> */}
      // {/* Global Drag and Drop Overlay - Conditionally rendered */}
      {showGlobalDropzone && (
        <div
          className={`
              inset-0 bg-opacity-70 flex flex-col items-center justify-center rounded-xl transition-all duration-300 ease-in-out
              ${isDraggingOverDropzone ? "border-4 border-white transform scale-105" : "border-4 border-blue-300"}
              z-20
            `}
          onDragOver={handleDropzoneDragOver}
          onDragLeave={handleDropzoneDragLeave}
          onDrop={handleDropzoneDrop}
          onClick={handleAreaClick} // Allow clicking the overlay to open file dialog too
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            className="hidden"
            accept={allowedFileTypes.join(",")} // Use accept attribute for file dialog filtering
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-32 w-32 mb-8 ${isDraggingOverDropzone ? "text-white" : "text-blue-200"}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-white text-4xl font-extrabold text-center drop-shadow-lg">
            Drop Your Files Here!
          </p>
          <p className="text-white text-lg mt-4 opacity-80">
            Max {maxFiles} files.{" "}
            {allowedFileTypes.length > 0 &&
              `Allowed types: ${allowedFileTypes.join(", ").toUpperCase()}`}
          </p>
        </div>
      )}
      {/* Display Message */}
      {message && (
        <p
          className={`mt-4 p-3 rounded-md text-sm ${message.includes("success") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {message}
        </p>
      )}
      {/* Selected Files List */}
      {
        selectedFiles.length > 0 && (
          <Card className="m-2 py-4 fixed bottom-0 right-0">
            <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
              <p className="text-tiny uppercase font-bold">Selected Files</p>
              <small className="text-default-500">{selectedFiles.length}</small>
            </CardHeader>
            <CardBody className="overflow-visible py-2">
              <Listbox
                aria-label="Dynamic Actions"
                items={selectedFiles}
                onAction={(key) => alert(key)}
              >
                {(file) => (
                  <ListboxItem
                    key={`${file.name}-${file.lastModified}`} // Unique key for list items
                    color={"default"}
                  >
                    <span className="text-gray-700 font-medium truncate">
                      {file.name}
                      <span className="text-sm text-gray-500 ml-2">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </span>
                  </ListboxItem>
                )}
              </Listbox>
            </CardBody>
          </Card>
        )
        // <div className="mt-6 border-t border-gray-200 pt-6 absolute">
        //   <h3 className="text-xl font-semibold text-gray-700 mb-4">
        //     Selected Files ({selectedFiles.length})
        //   </h3>
        //   <ul className="space-y-3">
        //     {selectedFiles.map((file) => (
        //       <li
        //         key={`${file.name}-${file.lastModified}`} // Unique key for list items
        //         className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-200"
        //       >
        //         <div className="flex items-center flex-grow">
        //           <svg
        //             xmlns="http://www.w3.org/2000/svg"
        //             className="h-6 w-6 text-indigo-500 mr-3"
        //             fill="none"
        //             viewBox="0 0 24 24"
        //             stroke="currentColor"
        //             strokeWidth="2"
        //           >
        //             <path
        //               strokeLinecap="round"
        //               strokeLinejoin="round"
        //               d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        //             />
        //           </svg>
        //           <span className="text-gray-700 font-medium truncate">
        //             {file.name}
        //             <span className="text-sm text-gray-500 ml-2">
        //               ({(file.size / 1024 / 1024).toFixed(2)} MB)
        //             </span>
        //           </span>
        //         </div>
        //         <button
        //           onClick={() => handleRemoveFile(file)}
        //           className="ml-4 p-2 rounded-full text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-200"
        //           aria-label={`Remove ${file.name}`}
        //         >
        //           <svg
        //             xmlns="http://www.w3.org/2000/svg"
        //             className="h-5 w-5"
        //             fill="none"
        //             viewBox="0 0 24 24"
        //             stroke="currentColor"
        //             strokeWidth="2"
        //           >
        //             <path
        //               strokeLinecap="round"
        //               strokeLinejoin="round"
        //               d="M6 18L18 6M6 6l12 12"
        //             />
        //           </svg>
        //         </button>
        //       </li>
        //     ))}
        //   </ul>
        // </div>
      }
      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className={`
                px-8 py-3 rounded-full text-white font-semibold shadow-lg
                transition-all duration-300 ease-in-out transform
                ${
                  uploading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                }
              `}
          >
            {uploading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading...
              </span>
            ) : (
              "Upload All Files"
            )}
          </button>
        </div>
      )}
      {/* </div> */}
      {/* </div> */}
    </>
  );
};
