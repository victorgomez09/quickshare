import { Checkbox } from "@heroui/checkbox";
import { Chip } from "@heroui/chip";
import { cn } from "@heroui/theme";
import { useState } from "react";

export default function FileItem() {
  const [isSelected, setIsSelected] = useState(false);

  const user = {
    name: "Junior Garcia",
    avatar: "https://avatars.githubusercontent.com/u/30373425?v=4",
    username: "jrgarciadev",
    url: "https://x.com/jrgarciadev",
    role: "Software Developer",
    status: "Active",
  };

  return (
    <Checkbox
      aria-label={user.name}
      classNames={{
        base: cn(
          "inline-flex w-full max-w-md bg-content1",
          "hover:bg-content2 items-center justify-start",
          "cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent",
          "data-[selected=true]:border-primary"
        ),
        label: "w-full",
      }}
      isSelected={isSelected}
      onValueChange={setIsSelected}
    >
      <div className="w-full flex justify-between gap-2">
        {/* <User
          avatarProps={{ size: "md", src: user.avatar }}
          description={
            <Link isExternal href={user.url} size="sm">
              @{user.username}
            </Link>
          }
          name={user.name}
        /> */}
        <div className="flex flex-col items-end gap-1">
          <span className="text-tiny text-default-500">{user.role}</span>
          <Chip color="success" size="sm" variant="flat">
            {user.status}
          </Chip>
        </div>
      </div>
    </Checkbox>
  );
}
