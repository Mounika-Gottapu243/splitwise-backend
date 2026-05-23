interface InputProps {
  type?: string;
  placeholder?: string;
  value: string;
  name?: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Input({ name= "text" , type = "text", placeholder, value, onChange }: InputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      name = {name}
      onChange={onChange}
      className="w-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-300"
    />
  );
}

export default Input;


