import * as React from "react";
import { flushSync } from "react-dom";
import { Input } from "@/components/ui/input";

interface FastInputProps extends Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> {
  value: string;
  onValueChange: (value: string) => void;
  debounceMs?: number;
}

const FastInput = React.memo(({ value, onValueChange, debounceMs = 120, onBlur, ...props }: FastInputProps) => {
  const [local, setLocal] = React.useState(value);
  const valueRef = React.useRef(value);
  const timeoutRef = React.useRef<number | null>(null);

  const clearPending = React.useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const commit = React.useCallback((nextValue: string, sync = false) => {
    valueRef.current = nextValue;
    if (sync) {
      flushSync(() => onValueChange(nextValue));
      return;
    }
    onValueChange(nextValue);
  }, [onValueChange]);

  React.useEffect(() => {
    if (value !== valueRef.current) {
      setLocal(value);
      valueRef.current = value;
    }
  }, [value]);

  React.useEffect(() => () => clearPending(), [clearPending]);

  return (
    <Input
      {...props}
      value={local}
      onChange={(e) => {
        const nextValue = e.target.value;
        setLocal(nextValue);
        clearPending();
        timeoutRef.current = window.setTimeout(() => commit(nextValue), debounceMs);
      }}
      onBlur={(e) => {
        clearPending();
        commit(local, true);
        onBlur?.(e);
      }}
    />
  );
});
FastInput.displayName = "FastInput";

export { FastInput };
