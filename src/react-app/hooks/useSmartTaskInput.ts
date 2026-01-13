import { useState, useEffect } from "react";
import { parseSmartInput, type ParsedTaskData } from "@/react-app/lib/smartTaskParser";

export function useSmartTaskInput() {
  const [rawInput, setRawInput] = useState("");
  const [parsedData, setParsedData] = useState<ParsedTaskData | null>(null);

  useEffect(() => {
    if (rawInput.trim()) {
      const parsed = parseSmartInput(rawInput);
      setParsedData(parsed);
    } else {
      setParsedData(null);
    }
  }, [rawInput]);

  const handleInputChange = (input: string) => {
    setRawInput(input);
  };

  const reset = () => {
    setRawInput("");
    setParsedData(null);
  };

  return {
    rawInput,
    parsedData,
    handleInputChange,
    reset,
  };
}
