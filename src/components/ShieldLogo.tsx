import logoAsset from "@/assets/recassistant-logo.png.asset.json";

const logoUrl = logoAsset.url;


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

