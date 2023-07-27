import { forwardRef } from "react";

type InputProps = {
  error?: string;
  type?: string;
  placeholder?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, ...props }, ref) => {
    return (
      <div>
        <input ref={ref} className="py-2 px-5 border-2 outline-none focus:border-gray-300 rounded-md w-full max-w-xs" {...props} />
        {error && <p className="text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
