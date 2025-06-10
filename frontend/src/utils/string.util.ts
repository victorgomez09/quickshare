export const getInitials = (text: string) => {
  return text
    .match(/(^\S\S?|\b\S)?/g)
    ?.join("")
    ?.match(/(^\S|\S$)?/g)
    ?.join("")
    .toUpperCase();
};

export const splitPaths = (path: string): string[] => {
  const parts = path.split("/");

  // Filter out any empty strings that might result from leading/trailing slashes
  // or multiple consecutive slashes (e.g., "//").
  const filteredParts = parts.filter((part) => part !== "");

  return filteredParts;
};
