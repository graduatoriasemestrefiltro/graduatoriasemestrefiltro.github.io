// Format university name: remove common prefixes and apply ucwords formatting
export const formatUniversityName = (name: string): string => {
  // First remove common prefixes
  let formatted = name
    .replace(/^Alma Mater Studiorum - Università di /i, "")
    .replace(/^Alma Mater Studiorum - /i, "")
    .replace(/^Università degli Studi di /i, "")
    .replace(/^Università degli Studi /i, "")
    .replace(/^Università del /i, "")
    .replace(/^Università della /i, "")
    .replace(/^Università di /i, "")
    .replace(/^Università Politecnica /i, "Politecnica ")
    .replace(/^Università /i, "");

  // Apply ucwords: capitalize first letter of each word
  // Treat any non-alphanumeric character as word separator
  formatted = formatted
    .toLowerCase()
    .replace(/(?:^|[^a-z0-9])([a-z])/gi, (match, letter, index) => {
      // Keep the separator character(s) and capitalize the letter
      const separator = match.slice(0, -1);
      return separator + letter.toUpperCase();
    });

  return formatted;
};
