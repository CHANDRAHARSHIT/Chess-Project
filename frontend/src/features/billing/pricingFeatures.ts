export interface PricingFeature {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  image: string; // Placeholder string or logic for image/icon
  reverse: boolean;
}

export const pricingFeatures: PricingFeature[] = [
  {
    id: "engine-analysis",
    title: "Unlimited Engine Analysis",
    subtitle: "Deep Stockfish Analysis",
    description: "Analyze your games with the maximum depth of Stockfish 16.1. Discover missed tactical combinations, evaluate complex endgames, and understand positional nuances like a grandmaster.",
    buttonText: "Choose a Plan",
    image: "bot", // We'll map this to a Lucide icon
    reverse: false,
  },
  {
    id: "game-reviews",
    title: "Unlimited Game Reviews",
    subtitle: "Get Interactive Game Feedback",
    description: "See your best moves, game accuracy, and ways to improve. Practice new ideas to try in your next game with interactive feedback on every move.",
    buttonText: "Choose a Plan",
    image: "search",
    reverse: true,
  },
  {
    id: "opening-explorer",
    title: "Advanced Opening Explorer",
    subtitle: "Master the Opening Phase",
    description: "Access millions of master games to prepare your repertoire. Study opening statistics, find novelties, and learn the typical plans for your favorite openings.",
    buttonText: "Choose a Plan",
    image: "book-open",
    reverse: false,
  },
  {
    id: "performance-insights",
    title: "Performance Insights",
    subtitle: "Track Your Progress",
    description: "Visualize your rating progress over time. Identify your strengths and weaknesses across different phases of the game to focus your training efficiently.",
    buttonText: "Choose a Plan",
    image: "trending-up",
    reverse: true,
  },
  {
    id: "accuracy-reports",
    title: "Accuracy Reports",
    subtitle: "Play Like a Computer",
    description: "Get detailed accuracy scores for every game. Compare your moves directly with top engine choices and measure your consistency game after game.",
    buttonText: "Choose a Plan",
    image: "target",
    reverse: false,
  },
  {
    id: "premium-themes",
    title: "Premium Themes",
    subtitle: "Play in Style",
    description: "Unlock exclusive, high-quality board and piece sets. Customize your interface with gorgeous dark modes, luxury wood textures, and elegant glass designs.",
    buttonText: "Choose a Plan",
    image: "palette",
    reverse: true,
  }
];
