import { useState } from "react";

// Lets the output panel take the whole row (the form collapses away).
export default function useExpand() {
  const [expanded, setExpanded] = useState(false);
  return [expanded, () => setExpanded((v) => !v)];
}
