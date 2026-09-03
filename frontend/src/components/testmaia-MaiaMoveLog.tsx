import { MoveLogPanel } from "@/components/organisms/MoveLogPanel";

interface MaiaMoveLogProps {
  sanHistory: string[];
}

export function MaiaMoveLog({ sanHistory }: MaiaMoveLogProps) {
  return (
    <MoveLogPanel
      moves={sanHistory}
      emptySubtitle="Make a move on the board to begin"
    />
  );
}
