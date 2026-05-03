import logo from "@/assets/mictio-logo.png";

export const MictioLogo = ({ size = 28 }: { size?: number }) => (
  <img
    src={logo}
    alt="Mictio"
    width={size}
    height={size}
    style={{ width: size, height: size, objectFit: "contain" }}
  />
);
