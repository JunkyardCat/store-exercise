import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function FormField({ label, id, ...rest }: Props) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {label}
      </label>
      <input id={fieldId} className="rounded border border-ink/25 bg-white px-3 py-2" {...rest} />
    </div>
  );
}
