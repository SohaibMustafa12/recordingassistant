import { StartClient } from "@tanstack/react-start";
import { hydrateRoot } from "react-dom/client";
import { startInstance } from "./start";

hydrateRoot(document, <StartClient start={startInstance} />);
