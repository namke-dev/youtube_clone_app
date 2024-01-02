import { formatDistanceToNow } from "date-fns";

export const formatRelativeTime = (timestamp) => {
  const date = new Date(timestamp);
  return formatDistanceToNow(date, { addSuffix: true });
};

export function normalzeVideoTitle(inputString) {
  if (!inputString) {
    return "";
  }

  return (
    inputString.charAt(0).toUpperCase() + inputString.slice(1).toLowerCase()
  );
}

export const formatDescription = (description) => {
  // Replace periods followed by space with period + line break
  const formattedDescription = description.replace(/\.\s/g, ".\n");
  return formattedDescription;
};
