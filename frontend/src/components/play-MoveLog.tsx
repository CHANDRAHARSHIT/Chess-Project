import { MoveLogPanel } from "@/components/organisms/MoveLogPanel";
import type { Chess } from "chess.js";

interface MoveLogProps {
  moves: ReturnType<Chess["history"]>;
}

export function MoveLog({ moves }: MoveLogProps) {
  return <MoveLogPanel moves={moves} />;
}
