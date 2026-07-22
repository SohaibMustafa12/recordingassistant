import logoUrl from "@/assets/recassistant-logo.png";

interface Props {
  className?: string;
}

export function ShieldLogo({ className }: Props) {
  return (
    <img
      src={logoUrl}
      alt="RecAssistant logo"
      className={className}
      draggable={false}
      referrerPolicy="no-referrer"
    />
  );
}

