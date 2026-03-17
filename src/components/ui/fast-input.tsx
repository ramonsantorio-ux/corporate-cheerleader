import * as React from "react";
import { Input } from "@/components/ui/input";

interface FastInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange' | 'value'> {
  value: string;
  onValueChange: (value: string) => void;
}

const FastInput = React.memo(({ value, onValueChange, ...props }: FastInputProps) => {
  const [local, setLocal] = React.useState(value);
  const valueRef = React.useRef(value);

  React.useEffect(() => {
    if (value !== valueRef.current) {
      setLocal(value);
      valueRef.current = value;
    }
  }, [value]);

  return (
    <Input
      {...props}
      value={local}
      onChange={e => {
        const newVal = e.target.value;
        setLocal(newVal);
        valueRef.current = newVal;
        onValueChange(newVal);
      }}
    />
  );
});
FastInput.displayName = "FastInput";

export { FastInput };
