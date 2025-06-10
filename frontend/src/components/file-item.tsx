import { File } from "@/models/file";
import { convertBytes } from "@/utils/bytes.util";
import { Checkbox } from "@heroui/checkbox";
import { cn } from "@heroui/theme";
import { File as FileIcon, Folder } from "lucide-react";
import moment from "moment";
import { FC, useState } from "react";

export const FileItem: FC<
  File & {
    handleDoubleClick: (name: string, isDir: boolean) => void;
    handleSelectedFile: (file: { name: string; isDir: boolean }) => void;
  }
> = ({ name, size, modTime, isDir, handleDoubleClick, handleSelectedFile }) => {
  const [isSelected, setIsSelected] = useState(false);

  const handleSelected = () => {
    setIsSelected(!isSelected);
    handleSelectedFile({ name: name, isDir: isDir });
  };

  return (
    <div
      className={`inline-flex items-center w-full justify-start !max-w-full bg-content1 hover:bg-content2 cursor-pointer rounded-lg gap-2 p-4 border-1 border-transparent ${isSelected ? "!border-secondary-500" : ""}`}
      onDoubleClick={() => handleDoubleClick(name, isDir)}
    >
      <Checkbox
        aria-label={name}
        color="secondary"
        isSelected={isSelected}
        onValueChange={handleSelected}
        classNames={{
          base: cn(
            "inline-flex items-center",
            "items-center justify-start",
            "cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent"
          ),
          label: "w-full",
        }}
      />
      <div className="w-full flex justify-between gap-2">
        {isDir ? <Folder /> : <FileIcon />}
        <div className="flex items-end justify-between gap-1 w-full">
          <div className="flex items-center gap-2">
            <span
              className="text-default-500 text-lg cursor-pointer hover:text-secondary-500"
              onClick={() => handleDoubleClick(name, isDir)}
            >
              {name}
            </span>
            <span className="text-tiny text-default-500 font-thin">
              {moment(modTime).format("YYYY MM DD - HH:mm:ss")}
            </span>
          </div>
          <span>{convertBytes(size)}</span>
        </div>
      </div>
    </div>
  );
};
