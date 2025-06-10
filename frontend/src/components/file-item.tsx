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
  }
> = ({ name, size, modTime, isDir, handleDoubleClick }) => {
  const [isSelected, setIsSelected] = useState(false);

  return (
    <Checkbox
      aria-label={name}
      classNames={{
        base: cn(
          "inline-flex items-center w-full !max-w-full bg-content1",
          "hover:bg-content2 items-center justify-start",
          "cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent",
          "data-[selected=true]:border-secondary"
        ),
        label: "w-full",
      }}
      color="secondary"
      isSelected={isSelected}
      onValueChange={setIsSelected}
      onDoubleClick={() => handleDoubleClick(name, isDir)}
    >
      <div className="w-full flex justify-between gap-2">
        {isDir ? <Folder /> : <FileIcon />}
        {/* <User
                    avatarProps={{ size: "md", src: user.avatar }}
                    description={
                        <Link isExternal href={user.url} size="sm">
                            @{user.username}
                        </Link>
                    }
                    name={user.name}
                /> */}
        <div className="flex items-end justify-between gap-1 w-full">
          <div className="flex items-center gap-2">
            <span className="text-default-500">{name}</span>
            <span className="text-tiny text-default-500 font-thin">
              {moment(modTime).format("YYYY MM DD - HH:mm:ss")}
            </span>
          </div>
          <span>{convertBytes(size)}</span>
          {/* <Chip color="success" size="sm" variant="flat">
            {size}
          </Chip> */}
        </div>
      </div>
    </Checkbox>
  );
};
