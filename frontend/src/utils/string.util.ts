export const getInitials = (text: string) => {
  return text.match(/(^\S\S?|\b\S)?/g)?.join("")?.match(/(^\S|\S$)?/g)?.join("").toUpperCase();
};
