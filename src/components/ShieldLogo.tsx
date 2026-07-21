interface Props {
  className?: string;
}

export function ShieldLogo({ className }: Props) {
  return (
    <img
      src="/recassistant-logo.jpg"
      alt="RecAssistant logo"
      className={className}
      draggable={false}
      referrerPolicy="no-referrer"
    />
  );
}
