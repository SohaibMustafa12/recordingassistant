import logoAsset from "@/assets/recassistant-logo.png.asset.json";

interface Props {
  className?: string;
}

export function ShieldLogo({ className }: Props) {
  return (
    <img
      src={logoAsset.url}
      alt="RecAssistant logo"
      className={className}
      draggable={false}
      referrerPolicy="no-referrer"
    />
  );
}
