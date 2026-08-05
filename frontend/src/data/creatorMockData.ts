/**
 * creatorMockData.ts
 *
 * Seeded dataset for XLChess Creator Showcase.
 * Persona: Alex Vance — Chess Educator & Content Creator.
 */

export interface RepertoireItem {
  id: string;
  title: string;
  eco: string;
  side: "white" | "black";
  moves: string[];
  fens: string[];
  description: string;
  masteryRate: number;
  enrolledStudents: number;
  highlightMove: string;
  highlightNote: string;
}

export interface MasterclassItem {
  id: string;
  title: string;
  category: "Interactive Lesson" | "Opening Course" | "PGN Study" | "Endgame Strategy";
  thumbnailFen: string;
  videoDuration: string;
  moveCount: number;
  studentCompletion: number;
  mostReplayedMove: string;
  mostReplayedCount: number;
  status: "Published" | "Draft" | "Members Only";
  views: number;
  likes: number;
  description: string;
  pgn: string[];
  annotations: Record<number, string>;
  timelineMarkers: { time: string; moveIndex: number; title: string }[];
  positionDiscussion: {
    moveIndex: number;
    studentName: string;
    studentAvatar: string;
    comment: string;
    creatorReply?: string;
    timeAgo: string;
  }[];
}

export interface StudentBreakthrough {
  id: string;
  studentName: string;
  studentTitle?: string;
  studentAvatar: string;
  headline: string;
  openingLearned: string;
  testimonial: string;
  fenSnapshot: string;
  date: string;
}

export interface CreatorProfile {
  id: string;
  name: string;
  role: string;
  handle: string;
  avatar: string;
  bannerGradient: string;
  tagline: string;
  specializations: string[];
  philosophyQuote: string;
  stats: {
    studentsCount: number;
    completionRate: number;
    reviewRating: number;
    totalReviews: number;
    lessonsPublished: number;
  };
  liveStatus: "recording" | "live" | "offline";
  currentActivity: string;
}

export const CREATOR_PROFILE: CreatorProfile = {
  id: "alex-vance",
  name: "Alex Vance",
  role: "Chess Educator & Content Creator",
  handle: "@AlexVanceChess",
  avatar: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23FCE8B2'/><stop offset='50%25' stop-color='%23D4AF6E'/><stop offset='100%25' stop-color='%238A6B2D'/></linearGradient><linearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%231A1F2C'/><stop offset='100%25' stop-color='%23080B14'/></linearGradient></defs><circle cx='50' cy='50' r='48' fill='url(%23bg)' stroke='url(%23g1)' stroke-width='2.5'/><rect x='44' y='20' width='12' height='5' rx='2' fill='url(%23g1)'/><rect x='47.5' y='16' width='5' height='13' rx='2' fill='url(%23g1)'/><rect x='42' y='32' width='16' height='3' rx='1.5' fill='url(%23g1)'/><path d='M38 35 C36 42 34 46 32 50 L68 50 C66 46 64 42 62 35 Z' fill='url(%23g1)'/><rect x='30' y='50' width='40' height='5' rx='2' fill='url(%23g1)'/><path d='M33 55 L31 72 Q50 76 69 72 L67 55 Z' fill='url(%23g1)'/><rect x='29' y='72' width='42' height='5' rx='2.5' fill='url(%23g1)'/></svg>`,
  bannerGradient: "from-amber-950/40 via-obsidian-mid to-obsidian",
  tagline: "Demystifying Grandmaster intuition through interactive structural analysis.",
  specializations: ["Catalan Defense", "Sicilian Najdorf", "Interactive Endgames", "Pawn Structures"],
  philosophyQuote: "Grandmaster chess isn't about memorizing 30 moves deep — it's about understanding the pawn structures that dictate where every piece belongs.",
  stats: {
    studentsCount: 14250,
    completionRate: 94.8,
    reviewRating: 4.98,
    totalReviews: 1240,
    lessonsPublished: 24,
  },
  liveStatus: "recording",
  currentActivity: "Recording Catalan Chapter 4: The 7.Ne5 Gold Sacrifice",
};

export const SIGNATURE_REPERTOIRES: RepertoireItem[] = [
  {
    id: "rep-catalan",
    title: "The Catalan Defense: Sharp Gold Repertoire",
    eco: "E06",
    side: "white",
    moves: ["1. d4", "Nf6", "2. c4", "e6", "3. g3", "d5", "4. Bg2", "Be7", "5. Nf3", "O-O", "6. O-O", "dxc4", "7. Ne5!"],
    fens: [
      "rnbqk2r/ppp1bppp/4pn2/3p4/2PP4/6P1/PP2PPBP/RNBQK1NR w KQkq - 1 4",
      "rnbq1rk1/ppp1bppp/4pn2/3p4/2PP4/5NP1/PP2PPBP/RNBQ1RK1 b - - 5 5",
      "rnbq1rk1/ppp1bppp/4pn2/8/2pP4/5NP1/PP2PPBP/RNBQ1RK1 w - - 0 6",
      "rnbq1rk1/ppp1bppp/4pn2/3pN3/2pP4/6P1/PP2PPBP/RNBQ1RK1 b - - 1 7",
    ],
    description: "White's modern lethal weapon. Sacrificing the c4-pawn to gain absolute long-diagonal domination with the Catalan Bishop.",
    masteryRate: 92,
    enrolledStudents: 6420,
    highlightMove: "7.Ne5!",
    highlightNote: "Puts immediate tension on c4 while opening the g2 bishop's sightline directly down the h1-a8 diagonal.",
  },
  {
    id: "rep-najdorf",
    title: "Sicilian Najdorf: Fighting Modern Mainlines",
    eco: "B90",
    side: "black",
    moves: ["1. e4", "c5", "2. Nf3", "d6", "3. d4", "cxd4", "4. Nxd4", "Nf6", "5. Nc3", "a6", "6. Be3", "e5", "7. Nb3", "Be6"],
    fens: [
      "rnbqkbnr/pp2pppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
      "rnbqkb1r/pp2pppp/3p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R b KQkq - 2 4",
      "r2qkb1r/1p3ppp/p2pbn2/4p3/3NP3/2N1B3/PPP2PPP/R2QKB1R w KQkq - 1 8",
      "r2qkb1r/1p3ppp/p2pbn2/4p3/4P3/1NN1B3/PPP2PPP/R2QKB1R b KQkq - 2 8",
    ],
    description: "The ultimate counter-attacking opening for Black. Create asymmetrical winning chances against 1.e4.",
    masteryRate: 88,
    enrolledStudents: 4890,
    highlightMove: "6...e5!",
    highlightNote: "Claiming central space immediately and forcing White's knight to retreat to b3.",
  },
  {
    id: "rep-kid",
    title: "King's Indian Pawn Storm Secrets",
    eco: "E97",
    side: "black",
    moves: ["1. d4", "Nf6", "2. c4", "g6", "3. Nc3", "Bg7", "4. e4", "d6", "5. Nf3", "O-O", "6. Be2", "e5", "7. O-O", "Nc6", "8. d5", "Ne7"],
    fens: [
      "rnbq1rk1/ppp1ppbp/3p1np1/8/2PPP3/2N2N2/PP2BPPP/R1BQ1RK1 b - - 4 6",
      "r1bq1rk1/ppp1npbp/3p1np1/3Pp3/2P1P3/2N2N2/PP2BPPP/R1BQ1RK1 w - - 3 9",
    ],
    description: "Lock the center and launch an uncompromising kingside pawn assault with f7-f5-f4.",
    masteryRate: 85,
    enrolledStudents: 3910,
    highlightMove: "8...Ne7!",
    highlightNote: "Clearing the path for f7-f5 pawn push while preparing knight rerouting to g6.",
  },
];

export const MASTERCLASSES: MasterclassItem[] = [
  {
    id: "mc-1",
    title: "Crushing the Catalan: The 7.Ne5 Sacrifice Masterclass",
    category: "Interactive Lesson",
    thumbnailFen: "rnbq1rk1/ppp1bppp/4pn2/3pN3/2pP4/6P1/PP2PPBP/RNBQ1RK1 b - - 1 7",
    videoDuration: "28:15",
    moveCount: 16,
    studentCompletion: 94,
    mostReplayedMove: "Move 14.d5!!",
    mostReplayedCount: 1420,
    status: "Published",
    views: 18450,
    likes: 1820,
    description: "Learn how sacrificing the c4 pawn leads to a decisive spatial advantage on the queenside.",
    pgn: ["1. d4 Nf6", "2. c4 e6", "3. g3 d5", "4. Bg2 Be7", "5. Nf3 O-O", "6. O-O dxc4", "7. Ne5 Nc6", "8. Bxc6 bxc6", "9. Nxc6 Qe8", "10. Nxe7+ Qxe7", "11. Qa4 c5", "12. Qxc4 cxd4", "13. Qxd4 e5", "14. d5!!"],
    annotations: {
      6: "The open Catalan mainline. White allows Black to capture on c4.",
      7: "7.Ne5 immediately targets the c4 pawn while opening the diagonal.",
      14: "14.d5!! The winning pawn breakthrough! Disrupting Black's piece coordination completely.",
    },
    timelineMarkers: [
      { time: "01:20", moveIndex: 2, title: "Catalan Setup & Fianchetto" },
      { time: "08:45", moveIndex: 6, title: "The 7.Ne5 Knight Jump" },
      { time: "16:30", moveIndex: 11, title: "Queenside Pawn Reclamation" },
      { time: "22:10", moveIndex: 13, title: "The 14.d5!! Breakthrough" },
    ],
    positionDiscussion: [
      {
        moveIndex: 13,
        studentName: "IM Marcus Vance",
        studentAvatar: "https://picsum.photos/seed/marcus/100/100",
        comment: "Why is 14.d5!! superior to 14.Qh4 here? Both look strong, but 14.d5 seems much cleaner.",
        creatorReply: "Spot on Marcus! 14.d5 opens the d-file immediately for our rook and cuts off Black's c8-bishop from defending e6.",
        timeAgo: "2 hours ago",
      },
      {
        moveIndex: 7,
        studentName: "Elena Rostova",
        studentAvatar: "https://picsum.photos/seed/elena/100/100",
        comment: "I replayed Move 7 five times before I understood why White gives up the pawn!",
        creatorReply: "Incredible insight Elena! That long diagonal pressure is unstoppable once Black loses the c6 knight.",
        timeAgo: "1 day ago",
      },
    ],
  },
  {
    id: "mc-2",
    title: "King's Indian: The f5 Pawn Storm Unleashed",
    category: "Opening Course",
    thumbnailFen: "r1bq1rk1/ppp1npbp/3p1np1/3Pp3/2P1P3/2N2N2/PP2BPPP/R1BQ1RK1 w - - 3 9",
    videoDuration: "34:40",
    moveCount: 22,
    studentCompletion: 89,
    mostReplayedMove: "Move 21...f4!",
    mostReplayedCount: 2100,
    status: "Published",
    views: 24100,
    likes: 2450,
    description: "Lock the center and march your f-pawn straight into White's king position with unstoppable tactical momentum.",
    pgn: ["1. d4 Nf6", "2. c4 g6", "3. Nc3 Bg7", "4. e4 d6", "5. Nf3 O-O", "6. Be2 e5", "7. O-O Nc6", "8. d5 Ne7", "9. Ne1 Nd7", "10. f3 f5", "11. g4 f4!"],
    annotations: {
      8: "The Mar del Plata variation setup. Center is locked.",
      10: "11...f4! The wedge pawn that locks White's kingside defenders out of position.",
    },
    timelineMarkers: [
      { time: "02:10", moveIndex: 4, title: "Classical KID Pawn Structure" },
      { time: "12:15", moveIndex: 8, title: "Rerouting the Knight with 9.Ne1" },
      { time: "25:40", moveIndex: 10, title: "The 11...f4! Wedge Pawn" },
    ],
    positionDiscussion: [
      {
        moveIndex: 10,
        studentName: "David K.",
        studentAvatar: "https://picsum.photos/seed/david/100/100",
        comment: "The annotations explained exactly why f4 works before g5. Best explanation of pawn structures!",
        creatorReply: "Play f4 first to lock White's g-pawn, then roll g5 and h5 to open the h-file for your rook!",
        timeAgo: "3 days ago",
      },
    ],
  },
  {
    id: "mc-3",
    title: "Rook & Pawn Endgames: The Lucena & Philidor Key Signals",
    category: "Endgame Strategy",
    thumbnailFen: "1R6/8/8/4k3/8/8/3r4/3K4 w - - 0 1",
    videoDuration: "19:50",
    moveCount: 14,
    studentCompletion: 97,
    mostReplayedMove: "Move 12.Rf8+ Bridge",
    mostReplayedCount: 1140,
    status: "Published",
    views: 12800,
    likes: 1140,
    description: "Master the 2 fundamental rook endgame patterns every chess player must know to convert winning positions into full points.",
    pgn: ["1. e4 e5", "2. Nf3 Nc6", "3. d4 exd4"],
    annotations: {},
    timelineMarkers: [],
    positionDiscussion: [],
  },
  {
    id: "mc-4",
    title: "Modern Benoni Refutations (Work in Progress)",
    category: "PGN Study",
    thumbnailFen: "rnbqkb1r/pp3ppp/3p1n2/2pP4/4P3/2N5/PP3PPP/R1BQKBNR b KQkq - 0 6",
    videoDuration: "Drafting",
    moveCount: 18,
    studentCompletion: 0,
    mostReplayedMove: "Draft Mode",
    mostReplayedCount: 0,
    status: "Draft",
    views: 0,
    likes: 0,
    description: "Annotating move 14.e5 pawn break alternatives for students in Black's dynamic Benoni defense.",
    pgn: [],
    annotations: {},
    timelineMarkers: [],
    positionDiscussion: [],
  },
];

export const STUDENT_BREAKTHROUGHS: StudentBreakthrough[] = [
  {
    id: "sb-1",
    studentName: "Thomas K. (FM)",
    studentTitle: "FIDE Master",
    studentAvatar: "https://picsum.photos/seed/thomas/100/100",
    headline: "Finally understood the Catalan.",
    openingLearned: "The Catalan 7.Ne5 Sacrifice",
    testimonial: "This finally made the Catalan 7.Ne5 sacrifice click for me. I replayed Move 7 five times before I understood why White gives up the pawn!",
    fenSnapshot: "rnbq1rk1/ppp1bppp/4pn2/3pN3/2pP4/6P1/PP2PPBP/RNBQ1RK1 b - - 1 7",
    date: "August 2026",
  },
  {
    id: "sb-2",
    studentName: "Sarah Lin",
    studentAvatar: "https://picsum.photos/seed/sarah/100/100",
    headline: "I replayed Move 7 five times before it clicked.",
    openingLearned: "Sicilian Najdorf Mainlines",
    testimonial: "I used to be terrified of 1.e4 until I completed Alex's Najdorf masterclass. The position discussions cleared up all my doubts!",
    fenSnapshot: "r2qkb1r/1p3ppp/p2pbn2/4p3/4P3/1NN1B3/PPP2PPP/R2QKB1R b KQkq - 2 8",
    date: "July 2026",
  },
  {
    id: "sb-3",
    studentName: "Viktor Petrov",
    studentAvatar: "https://picsum.photos/seed/viktor/100/100",
    headline: "The annotations explained exactly why Ne5 works.",
    openingLearned: "King's Indian f5 Storm",
    testimonial: "The move-by-move annotations explained exactly why Ne5 works better than Qa4+. Best explanation of pawn structures!",
    fenSnapshot: "r1bq1rk1/ppp1npbp/3p1np1/3Pp3/2P1P3/2N2N2/PP2BPPP/R1BQ1RK1 w - - 3 9",
    date: "June 2026",
  },
];
