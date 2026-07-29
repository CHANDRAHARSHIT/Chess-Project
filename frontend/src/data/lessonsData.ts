export interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface MoveStep {
  from: string;
  to: string;
  promotion?: string;
}

export interface LessonStepData {
  id: string;
  type: "TEXT" | "BOARD" | "QUIZ" | "CALLOUT" | "COMPLETION";
  title?: string;
  body?: string;
  coachMessage?: string;
  
  // BOARD fields
  fen?: string;
  expectedMoves?: string[]; // Array of UCI moves, e.g. ["e2e4", "e7e5", "g1f3"]
  botMoveDelay?: number;
  hint?: string;
  arrows?: { from: string; to: string; color?: string }[];
  highlights?: { square: string; color?: string }[];
  successMessage?: string;
  failureMessage?: string;
  
  // QUIZ fields
  quizType?: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "BOARD_QUESTION" | "IMAGE_QUESTION" | "TEXT_QUESTION";
  question?: string;
  options?: QuizOption[];
  correct?: string;
  explanation?: string;
  imageUrl?: string;
  
  // CALLOUT / INSIGHT fields
  category?: "KEY_INSIGHT" | "COMMON_MISTAKE" | "PRO_TIP" | "THINGS_TO_REMEMBER";
  icon?: string;
  [key: string]: any;
}

export interface LessonData {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string | null;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: number; // minutes
  category: "Openings" | "Tactics" | "Endgames" | "Strategy";
  content: {
    version: number;
    title: string;
    steps: LessonStepData[];
  };
  settings?: {
    objectives?: string[];
    keyTerms?: string[];
  };
}

export interface CourseData {
  id: string;
  slug: string;
  title: string;
  description: string;
  published: boolean;
  lessons: {
    id: string;
    slug: string;
    title: string;
    description: string;
    thumbnail: string | null;
    difficulty: string;
    estimatedTime: number;
    category: string;
  }[];
}

export const LESSONS_DATA: Record<string, LessonData> = {
  "italian-game": {
    id: "lesson-italian-game",
    courseId: "course-openings",
    slug: "italian-game",
    title: "The Italian Game",
    description: "Master one of chess's oldest and most fundamental openings (1.e4 e5 2.Nf3 Nc6 3.Bc4). Learn rapid piece development and center control.",
    thumbnail: null,
    difficulty: "Beginner",
    estimatedTime: 12,
    category: "Openings",
    settings: {
      objectives: [
        "Control the center with 1.e4",
        "Develop Knights before Bishops with 2.Nf3",
        "Target the weak f7 square with 3.Bc4",
        "Pass 5 Knowledge Check Quizzes",
        "Master Italian Game King safety & castling principles"
      ],
      keyTerms: ["e4 King's Pawn", "f7 Vulnerability", "Rapid Development", "Giuoco Piano", "Evans Gambit"]
    },
    content: {
      version: 1,
      title: "The Italian Game Masterclass",
      steps: [
        {
          id: "step-1",
          type: "TEXT",
          title: "Introduction to the Italian Game",
          body: "The **Italian Game** is one of the oldest and most fundamental chess openings, dating back to 16th century Italy. It begins with **1.e4 e5 2.Nf3 Nc6 3.Bc4**.\n\n### Strategic Objectives:\n- **Direct & Logical Center Claims**: Every move rapidly develops a piece towards the center.\n- **Targeting f7**: The Light-Squared Bishop on c4 places direct, lethal pressure on Black's weakest pawn: **f7**.\n- **Flexible Plans**: Leads to quiet positional play (*Giuoco Pianissimo*) or sharp attacking gambits (*Evans Gambit*).",
          coachMessage: "Welcome to the Italian Game! This opening will teach you fundamental chess principles that every Grandmaster relies on. Let's start on the board!"
        },
        {
          id: "step-2",
          type: "BOARD",
          title: "Move 1: Open the Highway (1. e4)",
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          expectedMoves: ["e2e4", "e7e5"],
          hint: "Push your King's Pawn forward two squares to e4.",
          successMessage: "Excellent! 1.e4 immediately controls key central squares (d5 and f5) while freeing your Light-Squared Bishop and Queen.",
          failureMessage: "Try moving your King's pawn (e2) two squares forward to e4.",
          coachMessage: "Your first move as White should stake a claim in the center. Play 1.e4!"
        },
        {
          id: "step-3",
          type: "BOARD",
          title: "Move 2: Develop & Attack (2. Nf3)",
          fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
          expectedMoves: ["g1f3", "b8c6"],
          hint: "Develop your Knight from g1 to f3 to attack Black's e5 pawn.",
          successMessage: "Brilliant! 2.Nf3 develops a knight, controls center squares, and forces Black to defend the e5 pawn with 2...Nc6.",
          failureMessage: "Develop your Kingside knight (g1) to f3.",
          coachMessage: "Always develop with a purpose! Move your Knight to f3 to pressure Black's pawn."
        },
        {
          id: "step-4",
          type: "BOARD",
          title: "Move 3: The Italian Bishop (3. Bc4)",
          fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3",
          expectedMoves: ["f1c4"],
          hint: "Develop your Light-Squared Bishop to c4.",
          successMessage: "Perfect! 3.Bc4 defines the Italian Game. Your Bishop aims directly at Black's vulnerable f7 pawn.",
          failureMessage: "Move your bishop from f1 to the active c4 square.",
          coachMessage: "Now for the defining move of the opening: bring your bishop out to c4!"
        },
        {
          id: "step-5",
          type: "CALLOUT",
          category: "KEY_INSIGHT",
          title: "Key Insight: Why f7 is Black's Weakest Link",
          body: "At the start of a chess game, the **f7 pawn** (and f2 for White) is the ONLY pawn defended exclusively by the King!\n\nBy placing your bishop on **c4**, White creates immediate tactical threats on f7 that can lead to early forks, sacrifices, and checkmates if Black plays carelessly.",
          coachMessage: "Never forget: f7 is guarded only by the King at the start of the game!"
        },
        {
          id: "step-6",
          type: "QUIZ",
          quizType: "MULTIPLE_CHOICE",
          question: "Knowledge Check #1: Why is f7 considered Black's main structural vulnerability in the opening?",
          options: [
            { id: "opt-1", text: "It is close to Black's Queen." },
            { id: "opt-2", text: "It is defended ONLY by the Black King at the start of the game." },
            { id: "opt-3", text: "It prevents Black from castling Kingside." },
            { id: "opt-4", text: "It blocks Black's Light-Squared Bishop." }
          ],
          correct: "opt-2",
          explanation: "f7 is guarded solely by Black's King. Concentrating pieces on f7 (like Bc4 and Nf3/Ng5) creates lethal tactical motifs.",
          hint: "Look at which piece guards f7 on move 1.",
          coachMessage: "Quiz #1! Which piece guards f7 at the beginning of the game?"
        },
        {
          id: "step-7",
          type: "QUIZ",
          quizType: "TRUE_FALSE",
          question: "Knowledge Check #2: True or False — In the Italian Game, White should usually castle Kingside on move 4 or 5 after developing pieces.",
          options: [
            { id: "opt-true", text: "True" },
            { id: "opt-false", text: "False" }
          ],
          correct: "opt-true",
          explanation: "True! Castling Kingside early secures White's King and connects the h1 Rook to the central d- and e-files.",
          hint: "Think about King safety after 1.e4, 2.Nf3, 3.Bc4.",
          coachMessage: "Quiz #2! Is early Kingside castling standard for White in the Italian Game?"
        },
        {
          id: "step-8",
          type: "QUIZ",
          quizType: "BOARD_QUESTION",
          fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
          question: "Knowledge Check #3: In this Italian Game position, what are Black's two main master-level developing continuations?",
          options: [
            { id: "opt-1", text: "3...Bc5 (Giuoco Piano) or 3...Nf6 (Two Knights Defense)" },
            { id: "opt-2", text: "3...h6 (Stopping Ng5) or 3...f6 (Defending e5)" },
            { id: "opt-3", text: "3...Na5 (Attacking Bc4) or 3...d5 (Pawn strike)" },
            { id: "opt-4", text: "3...Qf6 (Early Queen attack) or 3...g6 (Fianchetto)" }
          ],
          correct: "opt-1",
          explanation: "Black's top Grandmaster moves are 3...Bc5 (The Giuoco Piano - 'Quiet Game') and 3...Nf6 (The Two Knights Defense). Both develop minor pieces toward the center.",
          hint: "Look for minor piece moves that control the center.",
          coachMessage: "Quiz #3! Look at the board: how does Black traditionally complete initial piece development?"
        },
        {
          id: "step-9",
          type: "QUIZ",
          quizType: "MULTIPLE_CHOICE",
          question: "Knowledge Check #4: What is the primary tactical motif behind the Evans Gambit (1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4!?)?",
          options: [
            { id: "opt-1", text: "White wins Black's Light-Squared Bishop immediately." },
            { id: "opt-2", text: "White sacrifices a b-pawn to gain rapid central pawn dominance (c3 + d4) and opening speed." },
            { id: "opt-3", text: "White forces Black to trade Queens on move 5." },
            { id: "opt-4", text: "White traps Black's Knight on c6." }
          ],
          correct: "opt-2",
          explanation: "The Evans Gambit (4.b4!) sacrifices a flank pawn to draw Black's bishop off c5, allowing White to build a massive pawn center with c3 and d4 with speed!",
          hint: "Why would White give up a b-pawn in the opening?",
          coachMessage: "Quiz #4! Think about why aggressive players sacrifice the b-pawn in the Evans Gambit."
        },
        {
          id: "step-10",
          type: "QUIZ",
          quizType: "TEXT_QUESTION",
          question: "Knowledge Check #5: What is the main strategic difference between the Giuoco Piano and the Giuoco Pianissimo?",
          options: [
            { id: "opt-1", text: "Pianissimo uses a slow d3 pawn setup, while classic Giuoco Piano pushes an immediate d4 central strike." },
            { id: "opt-2", text: "Piano is for White only, Pianissimo is played by Black." },
            { id: "opt-3", text: "Pianissimo involves Queenside castling for White." },
            { id: "opt-4", text: "Piano trades the Light-Squared Bishop on c4 for Black's Knight." }
          ],
          correct: "opt-1",
          explanation: "Giuoco Pianissimo ('Very Quiet Game') uses a solid d3 pawn move to protect e4 slowly, whereas classic Giuoco Piano plays c3 and d4 aggressively for rapid pawn expansion.",
          hint: "Focus on whether White plays d3 (quiet) or c3+d4 (aggressive).",
          coachMessage: "Quiz #5! Compare d3 vs d4 pawn structures."
        },
        {
          id: "step-11",
          type: "CALLOUT",
          category: "COMMON_MISTAKE",
          title: "Common Mistake: Playing 4.Ng5 Prematurely",
          body: "Beginners often rush **4.Ng5** (the Fried Liver Attack setup) before securing King safety or completing piece development.\n\nIf Black responds correctly with **4...d5! 5.exd5 Na5!**, White's bishop on c4 is attacked and White loses control of the initiative!",
          coachMessage: "Don't rush solo attacks! Secure your King and develop your pieces first."
        },
        {
          id: "step-12",
          type: "CALLOUT",
          category: "PRO_TIP",
          title: "Pro Tip: The c3 + d4 Central Explosion",
          body: "When playing as White in the Italian Game, your long-term goal is to prepare **c3** followed by **d4**. This creates a powerful two-pawn center (d4 and e4) that pushes Black's pieces backward!",
          coachMessage: "Master the c3 + d4 expansion to dominate central space!"
        },
        {
          id: "step-13",
          type: "COMPLETION"
        }
      ]
    }
  },

  "ruy-lopez": {
    id: "lesson-ruy-lopez",
    courseId: "course-openings",
    slug: "ruy-lopez",
    title: "The Ruy Lopez (Spanish Opening)",
    description: "Learn the 'Spanish Torture', played by World Champions from Steinitz to Carlsen (1.e4 e5 2.Nf3 Nc6 3.Bb5).",
    thumbnail: null,
    difficulty: "Intermediate",
    estimatedTime: 12,
    category: "Openings",
    settings: {
      objectives: [
        "Play 1.e4 e5 2.Nf3 Nc6 3.Bb5",
        "Understand indirect pressure on Black's e5 defender",
        "Master the Morphy Defense (3...a6) & Berlin Defense (3...Nf6)",
        "Pass 5 Knowledge Check Quizzes"
      ],
      keyTerms: ["Bb5 Pin", "Indirect Pressure", "Morphy Defense", "Spanish Torture", "Berlin Endgame"]
    },
    content: {
      version: 1,
      title: "The Ruy Lopez Masterclass",
      steps: [
        {
          id: "step-1",
          type: "TEXT",
          title: "The King of Chess Openings",
          body: "Named after the 16th-century Spanish priest **Ruy López de Segura**, the Ruy Lopez (**1.e4 e5 2.Nf3 Nc6 3.Bb5**) is considered one of the richest and most deeply analyzed openings in chess history.\n\n### Core Strategy:\nWhite places indirect pressure on Black's center by targeting the **Nc6 knight** which defends the **e5 pawn**.",
          coachMessage: "Welcome to the Spanish Opening! World Champions love this opening because it creates persistent positional pressure."
        },
        {
          id: "step-2",
          type: "BOARD",
          title: "Play the Spanish Bishop (3. Bb5)",
          fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3",
          expectedMoves: ["f1b5"],
          hint: "Move your Light-Squared Bishop from f1 to b5.",
          successMessage: "Great job! 3.Bb5 pins or pressures the Nc6 knight, threatening to undermine Black's pawn on e5.",
          failureMessage: "Play 3.Bb5 by bringing your bishop from f1 to b5.",
          coachMessage: "Bring the bishop out to b5 to put pressure on Black's defender!"
        },
        {
          id: "step-3",
          type: "BOARD",
          title: "Retreat to Maintain Pressure (4. Ba4)",
          fen: "r1bqkbnr/1ppp1ppp/p1n5/4p3/1B2P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 4",
          expectedMoves: ["b5a4"],
          hint: "After Black plays 3...a6, retreat your Bishop to a4.",
          successMessage: "Perfect! 4.Ba4 preserves your strong Light-Squared Bishop while keeping pressure on the a4-e8 diagonal.",
          failureMessage: "Retreat your bishop to a4.",
          coachMessage: "Keep the Spanish Bishop alive! Retreat to a4."
        },
        {
          id: "step-4",
          type: "CALLOUT",
          category: "KEY_INSIGHT",
          title: "Key Insight: The Morphy Defense (3...a6)",
          body: "Black's most popular response to 3.Bb5 is **3...a6**, known as the **Morphy Defense**.\n\nBlack asks White: *'Will you trade your bishop for my knight, or retreat?'*\nBy playing **4.Ba4**, White maintains diagonal tension while preserving the bishop for the middlegame.",
          coachMessage: "3...a6 is Black's most flexible defense. Always keep your bishop active!"
        },
        {
          id: "step-5",
          type: "QUIZ",
          quizType: "TRUE_FALSE",
          question: "Knowledge Check #1: True or False — White's move 3.Bb5 immediately wins Black's e5 pawn after 4.Bxc6 dxc6 5.Nxe5.",
          options: [
            { id: "opt-true", text: "True" },
            { id: "opt-false", text: "False" }
          ],
          correct: "opt-false",
          explanation: "False! If White plays 4.Bxc6 dxc6 5.Nxe5?, Black plays 5...Qd4! double-attacking White's Knight on e5 and Pawn on e4, easily regaining the pawn with an equal position.",
          hint: "Look for Black's tactical Queen double-attack on e4 and e5.",
          coachMessage: "Quiz #1! Does White really win a free pawn on move 5?"
        },
        {
          id: "step-6",
          type: "QUIZ",
          quizType: "MULTIPLE_CHOICE",
          question: "Knowledge Check #2: What is the main strategic purpose of White's 3.Bb5 in the Ruy Lopez?",
          options: [
            { id: "opt-1", text: "To check Black's King immediately." },
            { id: "opt-2", text: "To exert indirect pressure on Black's central e5 defender (Nc6)." },
            { id: "opt-3", text: "To trade the bishop for a knight on move 3." },
            { id: "opt-4", text: "To trap Black's Queen." }
          ],
          correct: "opt-2",
          explanation: "By attacking the Nc6 knight, White creates long-term structural and central pressure on Black's pawn on e5.",
          hint: "Focus on why Nc6 is important to Black.",
          coachMessage: "Quiz #2! Why is targeting the c6 knight so strategically effective?"
        },
        {
          id: "step-7",
          type: "QUIZ",
          quizType: "BOARD_QUESTION",
          fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 4",
          question: "Knowledge Check #3: In this position after 3.Bb5 Nf6, what is this famous solid defense for Black called?",
          options: [
            { id: "opt-1", text: "The Berlin Defense (The Berlin Wall)" },
            { id: "opt-2", text: "The Sicilian Defense" },
            { id: "opt-3", text: "The King's Gambit" },
            { id: "opt-4", text: "The French Defense" }
          ],
          correct: "opt-1",
          explanation: "3...Nf6 is the Berlin Defense, famously used by Vladimir Kramnik to neutralize Garry Kasparov in the 2000 World Championship match.",
          hint: "Name of the German capital city.",
          coachMessage: "Quiz #3! Identify the legendary defense used to stop Kasparov."
        },
        {
          id: "step-8",
          type: "QUIZ",
          quizType: "MULTIPLE_CHOICE",
          question: "Knowledge Check #4: What is the Marshall Attack in the Ruy Lopez (8...d5!)?",
          options: [
            { id: "opt-1", text: "An aggressive pawn sacrifice by Black to gain dangerous Kingside attacking piece activity." },
            { id: "opt-2", text: "A defensive maneuver where Black trades Queens on move 9." },
            { id: "opt-3", text: "An opening trap where White wins a Rook in 5 moves." },
            { id: "opt-4", text: "A slow positional endgame system." }
          ],
          correct: "opt-1",
          explanation: "Created by Frank Marshall in 1918, 8...d5! sacrifices a pawn for Black to unleash a devastating Kingside attack against White's King.",
          hint: "Is the Marshall Attack aggressive or passive?",
          coachMessage: "Quiz #4! What makes the Marshall Attack so famous in grandmaster chess?"
        },
        {
          id: "step-9",
          type: "QUIZ",
          quizType: "TRUE_FALSE",
          question: "Knowledge Check #5: True or False — The Ruy Lopez is considered one of the best openings for learning positional middle game plans.",
          options: [
            { id: "opt-true", text: "True" },
            { id: "opt-false", text: "False" }
          ],
          correct: "opt-true",
          explanation: "True! Nearly every World Champion (Capablanca, Fischer, Karpov, Kasparov, Carlsen) made the Ruy Lopez a cornerstone of their White repertoire.",
          hint: "Did World Champions play the Ruy Lopez regularly?",
          coachMessage: "Quiz #5! Is the Ruy Lopez a staple for World Champions?"
        },
        {
          id: "step-10",
          type: "CALLOUT",
          category: "PRO_TIP",
          title: "Pro Tip: The Spanish Knight Re-routing (Nbd2 -> Nf1 -> Ng3)",
          body: "In the Closed Ruy Lopez, White's Queen's Knight often undergoes a famous maneuver:\n**Nbd2 -> Nf1 -> Ng3** (or e3).\n\nThis knight re-routing clears the c-file for White's pawns while positioning the knight to join a Kingside assault!",
          coachMessage: "Remember the famous Nbd2-f1-g3 knight maneuver!"
        },
        {
          id: "step-11",
          type: "COMPLETION"
        }
      ]
    }
  },

  "sicilian-defense": {
    id: "lesson-sicilian-defense",
    courseId: "course-openings",
    slug: "sicilian-defense",
    title: "The Sicilian Defense (1...c5)",
    description: "Discover Black's most combative and scoring response to 1.e4. Fight for asymmetrical imbalance from move one.",
    thumbnail: null,
    difficulty: "Intermediate",
    estimatedTime: 12,
    category: "Openings",
    settings: {
      objectives: [
        "Respond to 1.e4 with 1...c5",
        "Understand asymmetrical center control",
        "Learn Open vs Closed Sicilian pawn structures",
        "Pass 5 Knowledge Check Quizzes"
      ],
      keyTerms: ["c5 Counter-Attack", "Asymmetrical Balance", "c-file Semi-Open", "Open Sicilian", "Najdorf Variation"]
    },
    content: {
      version: 1,
      title: "The Sicilian Defense Guide",
      steps: [
        {
          id: "step-1",
          type: "TEXT",
          title: "Fighting Fire with Fire",
          body: "When White plays 1.e4, Black's most aggressive and highest-scoring response is **1...c5** — The Sicilian Defense.\n\nRather than mirroring White with 1...e5, Black controls the d4 square from the flank. This leads to asymmetrical pawn structures where Black gets an open c-file and strong counter-attacking chances.",
          coachMessage: "The Sicilian is played by champions who want to win with Black! Let's try it on the board."
        },
        {
          id: "step-2",
          type: "BOARD",
          title: "Play the Sicilian (1...c5)",
          fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
          expectedMoves: ["c7c5"],
          hint: "Move Black's c-pawn forward two squares to c5.",
          successMessage: "Boom! 1...c5 strikes at the d4 square without risking a symmetric position.",
          failureMessage: "Push Black's c7 pawn to c5.",
          coachMessage: "Play 1...c5 to launch Black's Sicilian counter-offensive!"
        },
        {
          id: "step-3",
          type: "BOARD",
          title: "Fight in the Open Sicilian (2...d6)",
          fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
          expectedMoves: ["d7d6"],
          hint: "Play 2...d6 to control e5 and prepare piece development.",
          successMessage: "Excellent! 2...d6 is the foundation for the Najdorf, Dragon, and Scheveningen variations.",
          failureMessage: "Push Black's d-pawn to d6.",
          coachMessage: "Play 2...d6 to prepare Black's main variation setups!"
        },
        {
          id: "step-4",
          type: "CALLOUT",
          category: "KEY_INSIGHT",
          title: "Key Insight: The Pawn Exchange Advantage",
          body: "In the Open Sicilian (1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4), Black exchanges a flank c-pawn for White's central d-pawn.\n\nAs a result, **Black ends up with TWO central pawns (d & e) versus White's ONE (e-pawn)**, providing long-term central control in the endgame!",
          coachMessage: "Trading a flank pawn for a central pawn is Black's primary strategic victory!"
        },
        {
          id: "step-5",
          type: "QUIZ",
          quizType: "MULTIPLE_CHOICE",
          question: "Knowledge Check #1: What is Black's main structural advantage in the Open Sicilian?",
          options: [
            { id: "opt-1", text: "Black gets an extra pawn on the Queen's flank." },
            { id: "opt-2", text: "Black exchanges a flank pawn (c-pawn) for White's central pawn (d-pawn)." },
            { id: "opt-3", text: "White is forced to castle Queenside." },
            { id: "opt-4", text: "Black castles earlier than White." }
          ],
          correct: "opt-2",
          explanation: "Black trades the c-pawn for White's d-pawn, leaving Black with a central pawn majority (d and e pawns).",
          hint: "Which pawn gets traded on d4?",
          coachMessage: "Quiz #1! What makes trading the c-pawn for the d-pawn so valuable?"
        },
        {
          id: "step-6",
          type: "QUIZ",
          quizType: "TRUE_FALSE",
          question: "Knowledge Check #2: True or False — The Sicilian Defense is considered a passive opening aiming primarily for a draw.",
          options: [
            { id: "opt-true", text: "True" },
            { id: "opt-false", text: "False" }
          ],
          correct: "opt-false",
          explanation: "False! The Sicilian Defense is Black's most aggressive, winning response to 1.e4, producing high decisive game percentages at master level.",
          hint: "Is 1...c5 played for draws or wins?",
          coachMessage: "Quiz #2! Is the Sicilian played defensively or aggressively?"
        },
        {
          id: "step-7",
          type: "QUIZ",
          quizType: "BOARD_QUESTION",
          fen: "rnbqk2r/pp2bppp/3p1n2/4p3/3NP3/2N5/PPP1BPPP/R1BQ1RK1 b kq - 0 7",
          question: "Knowledge Check #3: In the Sicilian Najdorf (1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6), what is the key purpose of 5...a6?",
          options: [
            { id: "opt-1", text: "To prevent White's Knights or Bishop from landing on b5 or d5." },
            { id: "opt-2", text: "To castle Queenside on move 6." },
            { id: "opt-3", text: "To prepare a Queen trade." },
            { id: "opt-4", text: "To attack White's e4 pawn." }
          ],
          correct: "opt-1",
          explanation: "5...a6 stops Nb5 and Bb5+ checks while preparing Black's own b5 expansion on the Queenside.",
          hint: "Which key squares does a6 control on the 5th rank?",
          coachMessage: "Quiz #3! Why is 5...a6 played in the Najdorf?"
        },
        {
          id: "step-8",
          type: "QUIZ",
          quizType: "MULTIPLE_CHOICE",
          question: "Knowledge Check #4: What characterizes the Sicilian Dragon variation?",
          options: [
            { id: "opt-1", text: "Black fianchettoes the Dark-Squared Bishop to g7 to form a powerful diagonal dragon-like setup." },
            { id: "opt-2", text: "Black advances the h-pawn to h5 on move 3." },
            { id: "opt-3", text: "White plays 2.f4 on move 2." },
            { id: "opt-4", text: "Black trades Queens early." }
          ],
          correct: "opt-1",
          explanation: "The Sicilian Dragon (5...g6 and 6...Bg7) gets its name from the pawn structure mimicking the constellation Draco and the lethal diagonal bishop.",
          hint: "Which bishop is placed on g7?",
          coachMessage: "Quiz #4! How does the Dragon get its name?"
        },
        {
          id: "step-9",
          type: "QUIZ",
          quizType: "TRUE_FALSE",
          question: "Knowledge Check #5: True or False — The semi-open c-file is Black's main highway for Queenside counter-attacks in the Sicilian.",
          options: [
            { id: "opt-true", text: "True" },
            { id: "opt-false", text: "False" }
          ],
          correct: "opt-true",
          explanation: "True! Black places Rooks on c8 to pressure White's c2 pawn and Queenside pieces.",
          hint: "Which file opens up after cxd4?",
          coachMessage: "Quiz #5! Is the c-file Black's main attacking highway?"
        },
        {
          id: "step-10",
          type: "CALLOUT",
          category: "PRO_TIP",
          title: "Pro Tip: The ...d5 Central Break",
          body: "In almost every Sicilian variation, Black's primary liberating goal in the middle game is to achieve the **...d5 pawn strike**.\n\nWhen Black successfully executes ...d5 without tactical loss, Black's position is usually equal or superior!",
          coachMessage: "Look for the right moment to play ...d5!"
        },
        {
          id: "step-11",
          type: "COMPLETION"
        }
      ]
    }
  },

  "tactical-forks": {
    id: "lesson-tactical-forks",
    courseId: "course-tactics",
    slug: "tactical-forks",
    title: "Mastering Knight & Queen Forks",
    description: "Learn to attack two or more enemy pieces simultaneously with a single move. The deadliest weapon in tactical chess.",
    thumbnail: null,
    difficulty: "Beginner",
    estimatedTime: 10,
    category: "Tactics",
    settings: {
      objectives: [
        "Identify double attack geometry",
        "Execute Knight forks on King & Queen",
        "Spot defensive fork threats before they happen",
        "Pass 5 Knowledge Check Quizzes"
      ],
      keyTerms: ["Fork", "Double Attack", "Royal Fork", "Knight Geometry", "Family Fork"]
    },
    content: {
      version: 1,
      title: "Tactical Masterclass: The Fork",
      steps: [
        {
          id: "step-1",
          type: "TEXT",
          title: "What is a Tactical Fork?",
          body: "A **Fork** occurs when a single piece attacks **two or more opposing pieces at the same time**.\n\nBecause your opponent can usually only move one piece per turn, the other piece is captured on the next move!\n\nKnights are the most notorious forkers because they jump over pieces in an 'L' shape that cannot be blocked.",
          coachMessage: "Forks are pure chess magic. Spotting a fork can win you a Queen in one move!"
        },
        {
          id: "step-2",
          type: "BOARD",
          title: "Execute the Royal Knight Fork!",
          fen: "r3k2r/ppp2ppp/2n5/4p3/4N3/8/PPPP1PPP/R1B1K2R w KQkq - 0 1",
          expectedMoves: ["e4f6"],
          hint: "Move your Knight on e4 to f6 to fork Black's King on e8 and Rook on h7/a8.",
          successMessage: "Boom! Nf6+ checks the King on e8 while attacking the Rook! Black MUST move the King or take, losing heavy material.",
          failureMessage: "Look for a Knight move to f6 that attacks the King and Rook simultaneously.",
          coachMessage: "Find the knight move that attacks the King and a major piece at the same time!"
        },
        {
          id: "step-3",
          type: "BOARD",
          title: "Execute a Deadly Queen Fork!",
          fen: "r1bqk2r/pppp1ppp/2n5/4p3/2B5/5N2/PPPP1PPP/R1BQK2R w KQkq - 0 1",
          expectedMoves: ["c4f7"],
          hint: "Sacrifice your Bishop on f7 to draw Black's King into a Queen fork!",
          successMessage: "Brilliant! 1.Bxf7+ Kxf7 2.Nxe5+ forks King and Bishop/Rook!",
          failureMessage: "Strike at f7 with your bishop!",
          coachMessage: "Bxf7+ breaks open Black's defense!"
        },
        {
          id: "step-4",
          type: "CALLOUT",
          category: "KEY_INSIGHT",
          title: "Key Insight: The Royal & Family Fork",
          body: "- **Royal Fork**: Attacks the enemy King and Queen at the same time.\n- **Family Fork**: Attacks the King, Queen, and a Rook simultaneously!\n\nBecause the King MUST get out of check, the Queen or Rook is captured on the very next turn.",
          coachMessage: "A Royal Fork instantly wins the game!"
        },
        {
          id: "step-5",
          type: "QUIZ",
          quizType: "MULTIPLE_CHOICE",
          question: "Knowledge Check #1: Which chess piece is most famous for executing lethal forks?",
          options: [
            { id: "opt-1", text: "The Bishop" },
            { id: "opt-2", text: "The Knight" },
            { id: "opt-3", text: "The Rook" },
            { id: "opt-4", text: "The King" }
          ],
          correct: "opt-2",
          explanation: "Knights move in an 'L' shape and jump over pieces, allowing them to attack pieces without being in their direct line of sight.",
          hint: "Which piece moves in an L shape?",
          coachMessage: "Quiz #1! Which jumping piece creates the deadliest forks?"
        },
        {
          id: "step-6",
          type: "QUIZ",
          quizType: "TRUE_FALSE",
          question: "Knowledge Check #2: True or False — Can a single Pawn execute a fork?",
          options: [
            { id: "opt-true", text: "True" },
            { id: "opt-false", text: "False" }
          ],
          correct: "opt-true",
          explanation: "True! A pawn pushing forward (e.g. d4 or e4) attacking two enemy pieces on adjacent diagonals is a classic Pawn Fork!",
          hint: "Think about a pawn pushing forward attacking two pieces on its diagonal.",
          coachMessage: "Quiz #2! Can a humble pawn fork two pieces?"
        },
        {
          id: "step-7",
          type: "QUIZ",
          quizType: "BOARD_QUESTION",
          fen: "3rk3/8/8/3N4/8/8/8/3K4 w - - 0 1",
          question: "Knowledge Check #3: In this endgame position, how can White's Knight deliver a check while attacking Black's Rook?",
          options: [
            { id: "opt-1", text: "Nc7+ (Checking King on e8 and attacking Rook on d8)" },
            { id: "opt-2", text: "Ne3 (Defending d1)" },
            { id: "opt-3", text: "Nf4 (Attacking nothing)" },
            { id: "opt-4", text: "Nb4 (Moving to the edge)" }
          ],
          correct: "opt-1",
          explanation: "Nc7+ checks Black's King on e8 while simultaneously attacking the d8 Rook!",
          hint: "Look for a check on c7.",
          coachMessage: "Quiz #3! Find the square for the Knight fork."
        },
        {
          id: "step-8",
          type: "QUIZ",
          quizType: "MULTIPLE_CHOICE",
          question: "Knowledge Check #4: What is a 'Royal Fork'?",
          options: [
            { id: "opt-1", text: "A fork that attacks both the enemy King and Queen simultaneously." },
            { id: "opt-2", text: "A fork played by a King." },
            { id: "opt-3", text: "A fork involving two Rooks." },
            { id: "opt-4", text: "A fork delivered on move 1." }
          ],
          correct: "opt-1",
          explanation: "A Royal Fork forces the King to move out of check, leaving the Queen unprotected and ready for capture.",
          hint: "Royal refers to King and Queen.",
          coachMessage: "Quiz #4! What defines a Royal Fork?"
        },
        {
          id: "step-9",
          type: "QUIZ",
          quizType: "TRUE_FALSE",
          question: "Knowledge Check #5: True or False — Before executing a fork, you should make sure your forking piece cannot be captured by an enemy piece.",
          options: [
            { id: "opt-true", text: "True" },
            { id: "opt-false", text: "False" }
          ],
          correct: "opt-true",
          explanation: "True! Always verify that your target square is not defended by an enemy piece before hopping your Knight in!",
          hint: "Can the target square be captured back?",
          coachMessage: "Quiz #5! Is checking for enemy defenders crucial?"
        },
        {
          id: "step-10",
          type: "CALLOUT",
          category: "PRO_TIP",
          title: "Pro Tip: Spotting Knight Fork Opportunities",
          body: "Whenever you see an enemy **King and Queen on the same color square**, look for a Knight fork square! Knights can only fork two pieces if both pieces are on the same color square.",
          coachMessage: "Look for enemy pieces on the same square color!"
        },
        {
          id: "step-11",
          type: "COMPLETION"
        }
      ]
    }
  },

  "pins-skewers": {
    id: "lesson-pins-skewers",
    courseId: "course-tactics",
    slug: "pins-skewers",
    title: "Pins & Skewers: Linear Tactics",
    description: "Learn how Bishops, Rooks, and Queens freeze enemy pieces on lines and force massive material gains.",
    thumbnail: null,
    difficulty: "Intermediate",
    estimatedTime: 10,
    category: "Tactics",
    settings: {
      objectives: [
        "Differentiate between Absolute and Relative pins",
        "Execute a lethal Skewer on high-value targets",
        "Exploit pinned pieces that cannot move",
        "Pass 5 Knowledge Check Quizzes"
      ],
      keyTerms: ["Absolute Pin", "Relative Pin", "Skewer", "X-Ray Attack", "Pin it and Win it"]
    },
    content: {
      version: 1,
      title: "Pins & Skewers Masterclass",
      steps: [
        {
          id: "step-1",
          type: "TEXT",
          title: "Understanding Pins vs Skewers",
          body: "### The Pin:\nA piece is **pinned** when it cannot move without exposing a more valuable piece behind it.\n- **Absolute Pin**: Pinned directly to the King (illegal to move!).\n- **Relative Pin**: Pinned to the Queen/Rook (moving loses material).\n\n### The Skewer:\nThe opposite of a pin! A higher-value piece (e.g. King) is in front. When it moves out of check, the lower-value piece behind it gets captured!",
          coachMessage: "Linear tactics win games! Let's see how line pieces paralyze opponents."
        },
        {
          id: "step-2",
          type: "BOARD",
          title: "Execute an Absolute Pin (Bg5)",
          fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 4",
          expectedMoves: ["c1g5"],
          hint: "Move your Dark-Squared Bishop to g5 to pin Black's f6 Knight to the Queen on d8.",
          successMessage: "Great! 4.Bg5 pins the f6 Knight to Black's Queen.",
          failureMessage: "Play 4.Bg5 to pin the Knight.",
          coachMessage: "Pin Black's knight to their queen with Bg5!"
        },
        {
          id: "step-3",
          type: "BOARD",
          title: "Deliver a Winning Skewer!",
          fen: "4k3/8/8/8/8/8/1q6/2B1K3 w - - 0 1",
          expectedMoves: ["c1b2"],
          hint: "Capture Black's Queen on b2 with your Bishop!",
          successMessage: "Bxb2 captures the undefended Queen directly!",
          failureMessage: "Capture the Queen on b2 with your Bishop!",
          coachMessage: "Take the enemy Queen!"
        },
        {
          id: "step-4",
          type: "CALLOUT",
          category: "KEY_INSIGHT",
          title: "Key Insight: 'Pin it and Win it'",
          body: "Once an enemy piece is pinned, **do not capture it immediately if you can pile more pressure onto it first**!\n\nAttack the pinned piece with pawns or minor pieces. Because the pinned piece CANNOT move, it cannot escape your incoming attack!",
          coachMessage: "Remember the Golden Rule: Attack the pinned piece with more attackers!"
        },
        {
          id: "step-5",
          type: "QUIZ",
          quizType: "MULTIPLE_CHOICE",
          question: "Knowledge Check #1: What is the main difference between an Absolute Pin and a Relative Pin?",
          options: [
            { id: "opt-1", text: "An Absolute Pin pins a piece to the King (making moves illegal); a Relative Pin pins to another piece." },
            { id: "opt-2", text: "An Absolute Pin is played by Rooks, Relative by Bishops." },
            { id: "opt-3", text: "Relative Pins only happen in endgames." },
            { id: "opt-4", text: "Absolute Pins can be ignored by moving the pinned piece." }
          ],
          correct: "opt-1",
          explanation: "In an Absolute Pin, the pinned piece cannot move because putting the King in check is illegal. In a Relative Pin, moving the piece is legal but loses material.",
          hint: "Which pin involves the King?",
          coachMessage: "Quiz #1! What makes an Absolute Pin different?"
        },
        {
          id: "step-6",
          type: "QUIZ",
          quizType: "TRUE_FALSE",
          question: "Knowledge Check #2: True or False — A Skewer is essentially an inverted pin where the more valuable piece is in front.",
          options: [
            { id: "opt-true", text: "True" },
            { id: "opt-false", text: "False" }
          ],
          correct: "opt-true",
          explanation: "True! In a Skewer, the valuable piece (like a King) is forced to move out of attack, leaving the piece behind it exposed.",
          hint: "Is the valuable piece in front during a skewer?",
          coachMessage: "Quiz #2! Is a Skewer a reverse pin?"
        },
        {
          id: "step-7",
          type: "QUIZ",
          quizType: "BOARD_QUESTION",
          fen: "3r4/8/8/3k4/8/8/3R4/3K4 w - - 0 1",
          question: "Knowledge Check #3: In this Rook endgame, what happens when White plays Rd2+ checking Black's King on d5?",
          options: [
            { id: "opt-1", text: "It skewers the King on d5 and wins Black's Rook on d8 when the King moves." },
            { id: "opt-2", text: "It loses White's Rook." },
            { id: "opt-3", text: "Black checkmates White." },
            { id: "opt-4", text: "It is a stalemate." }
          ],
          correct: "opt-1",
          explanation: "Rd2+ forces Black's King to move, leaving Black's d8 Rook exposed and captured on the next move!",
          hint: "What happens to the d8 Rook when Black's King steps aside?",
          coachMessage: "Quiz #3! Analyze the skewer on the d-file."
        },
        {
          id: "step-8",
          type: "QUIZ",
          quizType: "MULTIPLE_CHOICE",
          question: "Knowledge Check #4: How can you defend against an annoying Relative Pin?",
          options: [
            { id: "opt-1", text: "Block the line with another piece, attack the pinning piece, or step the Queen away." },
            { id: "opt-2", text: "Resign immediately." },
            { id: "opt-3", text: "Castle twice." },
            { id: "opt-4", text: "Ignore it forever." }
          ],
          correct: "opt-1",
          explanation: "You can unpin by interposing a piece (like Be7), attacking the pinning piece (like h6/a6), or moving the targeted Queen away.",
          hint: "How do you break a pin line?",
          coachMessage: "Quiz #4! How do you break a pin?"
        },
        {
          id: "step-9",
          type: "QUIZ",
          quizType: "TRUE_FALSE",
          question: "Knowledge Check #5: True or False — Knights can create Pins and Skewers.",
          options: [
            { id: "opt-true", text: "True" },
            { id: "opt-false", text: "False" }
          ],
          correct: "opt-false",
          explanation: "False! Knights move in an 'L' shape and cannot attack along straight lines, so ONLY long-range line pieces (Bishops, Rooks, Queens) can pin or skewer.",
          hint: "Can Knights attack along long straight lines?",
          coachMessage: "Quiz #5! Can Knights pin pieces?"
        },
        {
          id: "step-10",
          type: "CALLOUT",
          category: "PRO_TIP",
          title: "Pro Tip: Aligning Pieces on Diagonals",
          body: "Always be aware of aligned pieces! If your opponent's King and Queen share the same diagonal, look for a Bishop move to pin or skewer them instantly.",
          coachMessage: "Watch out for diagonal alignment!"
        },
        {
          id: "step-11",
          type: "COMPLETION"
        }
      ]
    }
  },

  "endgames-basic": {
    id: "lesson-endgames-basic",
    courseId: "course-endgames",
    slug: "endgames-basic",
    title: "King & Pawn Endgames: Opposition",
    description: "Master the fundamental endgame concept: The Opposition. Turn single pawns into victorious Queens.",
    thumbnail: null,
    difficulty: "Intermediate",
    estimatedTime: 10,
    category: "Endgames",
    settings: {
      objectives: [
        "Understand Direct Opposition",
        "Escort passed pawns to promotion",
        "Key squares for King positioning",
        "Pass 5 Knowledge Check Quizzes"
      ],
      keyTerms: ["Opposition", "Passed Pawn", "Pawn Promotion", "Key Squares", "Rule of the Square"]
    },
    content: {
      version: 1,
      title: "Essential Endgame Tactics: Opposition",
      steps: [
        {
          id: "step-1",
          type: "TEXT",
          title: "The Golden Rule of King & Pawn Endgames",
          body: "In the endgame, when major pieces are off the board, **the King transforms from a vulnerable target into a powerful attacking unit**!\n\nTo promote a pawn, your King must march ahead of your pawn and control key promotion squares. The key to winning is gaining **The Opposition**.",
          coachMessage: "Welcome to endgame mastery! In endgames, active kings win games."
        },
        {
          id: "step-2",
          type: "BOARD",
          title: "Take Direct Opposition (1. Ke6)",
          fen: "4k3/8/8/4K3/4P3/8/8/8 w - - 0 1",
          expectedMoves: ["e5e6"],
          hint: "Advance your King to e6 directly facing Black's King on e8.",
          successMessage: "Brilliant! By playing Ke6, you take Direct Opposition, forcing Black's King to step aside and give up control of f7 or d7!",
          failureMessage: "Step your King forward to e6 to claim the opposition.",
          coachMessage: "Face Black's king directly! Play Ke6 to claim opposition."
        },
        {
          id: "step-3",
          type: "BOARD",
          title: "Escort the Passed Pawn (2. e5)",
          fen: "4k3/8/4K3/8/4P3/8/8/8 w - - 1 2",
          expectedMoves: ["e4e5"],
          hint: "Push your e-pawn forward to e5 under the protection of your King on e6.",
          successMessage: "Awesome! With your King on e6 protecting e5, the pawn marches safely toward e8=Q!",
          failureMessage: "Push your e-pawn to e5.",
          coachMessage: "Push your pawn forward under King protection!"
        },
        {
          id: "step-4",
          type: "CALLOUT",
          category: "KEY_INSIGHT",
          title: "Key Insight: What is Opposition?",
          body: "Two Kings are in **Opposition** when they stand on the same file/rank separated by ONE empty square.\n\nThe player whose turn it is NOT has the advantage, because the player whose turn it IS must move their King away and yield key squares!",
          coachMessage: "Having the Opposition forces your opponent to step aside!"
        },
        {
          id: "step-5",
          type: "QUIZ",
          quizType: "MULTIPLE_CHOICE",
          question: "Knowledge Check #1: What does it mean to 'have the Opposition' in a King & Pawn endgame?",
          options: [
            { id: "opt-1", text: "Your King faces the opponent's King with 1 empty square between them, and it is the OPPONENT'S turn to move." },
            { id: "opt-2", text: "You have more pawns than your opponent." },
            { id: "opt-3", text: "Your King is castled." },
            { id: "opt-4", text: "Your pawn is on the 7th rank." }
          ],
          correct: "opt-1",
          explanation: "Because the opponent must move, they must step aside and yield key path squares for your King and pawn.",
          hint: "Who has to move when Kings face each other?",
          coachMessage: "Quiz #1! What gives you the upper hand in opposition?"
        },
        {
          id: "step-6",
          type: "QUIZ",
          quizType: "TRUE_FALSE",
          question: "Knowledge Check #2: True or False — In a King & Pawn endgame, you should always keep your King BEHIND your pawn.",
          options: [
            { id: "opt-true", text: "True" },
            { id: "opt-false", text: "False" }
          ],
          correct: "opt-false",
          explanation: "False! Your King must lead AHEAD of your passed pawn to clear out the defending King and control promotion squares.",
          hint: "Should the King lead or follow?",
          coachMessage: "Quiz #2! Does the King march ahead or follow behind?"
        },
        {
          id: "step-7",
          type: "QUIZ",
          quizType: "BOARD_QUESTION",
          fen: "8/8/4k3/8/4K3/4P3/8/8 w - - 0 1",
          question: "Knowledge Check #3: White to move. How does White gain the Opposition against Black's King on e6?",
          options: [
            { id: "opt-1", text: "Ke4 (Facing e6 with 1 empty square)" },
            { id: "opt-2", text: "e4 (Pushing the pawn prematurely)" },
            { id: "opt-3", text: "Kd4 (Stepping away)" },
            { id: "opt-4", text: "Kf4 (Stepping to the side)" }
          ],
          correct: "opt-1",
          explanation: "Ke4 places White's King directly opposite Black's King on e6, gaining Opposition!",
          hint: "Move King to e4 directly facing e6.",
          coachMessage: "Quiz #3! Which King move claims opposition?"
        },
        {
          id: "step-8",
          type: "QUIZ",
          quizType: "MULTIPLE_CHOICE",
          question: "Knowledge Check #4: What is the 'Rule of the Square' for passed pawns?",
          options: [
            { id: "opt-1", text: "A geometric calculation to determine if an enemy King can catch a passed pawn without help." },
            { id: "opt-2", text: "A rule stating pawns can only move 4 squares total." },
            { id: "opt-3", text: "A rule for castling." },
            { id: "opt-4", text: "A method to calculate pawn sacrifices." }
          ],
          correct: "opt-1",
          explanation: "Draw a square from the pawn to its promotion square; if the enemy King cannot enter the square on its next move, the pawn promotes safely!",
          hint: "Think about calculating if the enemy king catches your pawn.",
          coachMessage: "Quiz #4! How do you calculate if a pawn promotes safely?"
        },
        {
          id: "step-9",
          type: "QUIZ",
          quizType: "TRUE_FALSE",
          question: "Knowledge Check #5: True or False — If a King reaches the 6th rank in front of its pawn, the pawn ALWAYS promotes regardless of whose turn it is.",
          options: [
            { id: "opt-true", text: "True" },
            { id: "opt-false", text: "False" }
          ],
          correct: "opt-true",
          explanation: "True! Having the King on the 6th rank ahead of the pawn guarantees promotion in King & Pawn endgames.",
          hint: "The 6th rank is the golden promotion benchmark.",
          coachMessage: "Quiz #5! Is the 6th rank King position a guaranteed win?"
        },
        {
          id: "step-10",
          type: "CALLOUT",
          category: "PRO_TIP",
          title: "Pro Tip: Key Squares for Promotion",
          body: "To win with a single pawn, your King must control the **Key Squares** two ranks ahead of the pawn. Once your King lands on a key square, promotion is mathematically guaranteed!",
          coachMessage: "Land your King on key squares ahead of the pawn!"
        },
        {
          id: "step-11",
          type: "COMPLETION"
        }
      ]
    }
  },

  "opening-principles": {
    id: "lesson-opening-principles",
    courseId: "course-strategy",
    slug: "opening-principles",
    title: "The 3 Golden Opening Principles",
    description: "Never fall into early traps. Learn the three fundamental rules every master follows in the first 10 moves.",
    thumbnail: null,
    difficulty: "Beginner",
    estimatedTime: 10,
    category: "Strategy",
    settings: {
      objectives: [
        "Control the Center (e4/d4/e5/d5)",
        "Develop minor pieces quickly",
        "Ensure King Safety by castling early",
        "Pass 5 Knowledge Check Quizzes"
      ],
      keyTerms: ["Center Control", "Development", "King Safety", "Early Castling", "Tempo"]
    },
    content: {
      version: 1,
      title: "The 3 Golden Principles",
      steps: [
        {
          id: "step-1",
          type: "TEXT",
          title: "Mastering the Opening Phase",
          body: "No matter what opening you play, three timeless rules govern chess openings:\n\n1. **Control the Center**: Occupy or control d4, e4, d5, e5.\n2. **Develop Your Minor Pieces**: Bring Knights and Bishops into active central squares.\n3. **Protect Your King**: Castle early to tuck your King behind a safe pawn shield.",
          coachMessage: "Internalize these 3 rules and you will defeat 90% of beginner players right out of the opening!"
        },
        {
          id: "step-2",
          type: "BOARD",
          title: "Principle #1: Claim the Center (1. e4)",
          fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
          expectedMoves: ["e2e4"],
          hint: "Play 1.e4 to grab center control.",
          successMessage: "Spot on! 1.e4 occupies e4 and controls d5.",
          failureMessage: "Move your e-pawn to e4.",
          coachMessage: "Claim the center with 1.e4!"
        },
        {
          id: "step-3",
          type: "BOARD",
          title: "Principle #2: Develop Knights before Bishops (2. Nf3)",
          fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
          expectedMoves: ["g1f3"],
          hint: "Develop your Knight to f3.",
          successMessage: "Great! 2.Nf3 develops toward the center and pressures Black's e5 pawn.",
          failureMessage: "Move your knight to f3.",
          coachMessage: "Develop your knight to f3!"
        },
        {
          id: "step-4",
          type: "CALLOUT",
          category: "KEY_INSIGHT",
          title: "Key Insight: Why Control the Center?",
          body: "Pieces placed in or controlling the center (d4, e4, d5, e5) have **maximum mobility**!\n\nFor example, a Knight in the center controls **8 squares**, while a Knight on the edge controls only **2 or 4 squares**.",
          coachMessage: "Central pieces are 4x more powerful than edge pieces!"
        },
        {
          id: "step-5",
          type: "QUIZ",
          quizType: "MULTIPLE_CHOICE",
          question: "Knowledge Check #1: Which four squares form the central core of the chessboard?",
          options: [
            { id: "opt-1", text: "d4, e4, d5, e5" },
            { id: "opt-2", text: "a1, h1, a8, h8" },
            { id: "opt-3", text: "c3, f3, c6, f6" },
            { id: "opt-4", text: "e1, d1, e8, d8" }
          ],
          correct: "opt-1",
          explanation: "d4, e4, d5, e5 make up the central battlefield where most opening fights take place.",
          hint: "The 4 middle squares.",
          coachMessage: "Quiz #1! Which squares make up the center?"
        },
        {
          id: "step-6",
          type: "QUIZ",
          quizType: "TRUE_FALSE",
          question: "Knowledge Check #2: True or False — In the opening, you should avoid moving the same piece multiple times.",
          options: [
            { id: "opt-true", text: "True" },
            { id: "opt-false", text: "False" }
          ],
          correct: "opt-true",
          explanation: "True! Moving the same piece twice wastes valuable turns ('tempo') when you should be developing all your pieces.",
          hint: "Does moving the same piece twice waste time?",
          coachMessage: "Quiz #2! Should you move the same piece twice early?"
        },
        {
          id: "step-7",
          type: "QUIZ",
          quizType: "BOARD_QUESTION",
          fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 6 5",
          question: "Knowledge Check #3: White has developed Knights and Bishops. What is White's best move to secure King safety?",
          options: [
            { id: "opt-1", text: "O-O (Castle Kingside)" },
            { id: "opt-2", text: "h3 (Pawn move)" },
            { id: "opt-3", text: "a3 (Flank move)" },
            { id: "opt-4", text: "Kf1 (Step King out without castling)" }
          ],
          correct: "opt-1",
          explanation: "O-O castles the King to safety behind f2, g2, h2 pawns while activating the h1 Rook!",
          hint: "Look for the castling symbol O-O.",
          coachMessage: "Quiz #3! How does White complete King safety?"
        },
        {
          id: "step-8",
          type: "QUIZ",
          quizType: "MULTIPLE_CHOICE",
          question: "Knowledge Check #4: Why is bringing the Queen out on move 2 usually a mistake for beginners?",
          options: [
            { id: "opt-1", text: "The Queen gets harassed and chased by minor pieces, costing time while the opponent develops." },
            { id: "opt-2", text: "The Queen cannot move past pawns." },
            { id: "opt-3", text: "It is illegal to move the Queen on move 2." },
            { id: "opt-4", text: "The Queen is too weak in the opening." }
          ],
          correct: "opt-1",
          explanation: "Early Queen moves get attacked by minor pieces (Knights/Bishops), forcing the Queen to run away while your opponent develops for free!",
          hint: "What happens when an enemy knight attacks your early Queen?",
          coachMessage: "Quiz #4! Why avoid early Queen excursions?"
        },
        {
          id: "step-9",
          type: "QUIZ",
          quizType: "TRUE_FALSE",
          question: "Knowledge Check #5: True or False — Knights should generally be developed before Bishops because their optimal central squares are more predictable.",
          options: [
            { id: "opt-true", text: "True" },
            { id: "opt-false", text: "False" }
          ],
          correct: "opt-true",
          explanation: "True! Knights almost always belong on f3/c3 (for White) or f6/c6 (for Black), while Bishops depend on opponent setups.",
          hint: "Knights move to f3/c3 almost every game.",
          coachMessage: "Quiz #5! Develop Knights before Bishops?"
        },
        {
          id: "step-10",
          type: "CALLOUT",
          category: "PRO_TIP",
          title: "Pro Tip: Connecting the Rooks",
          body: "Your opening phase is officially complete when you have **castled and cleared the back rank so your Rooks defend each other** ('Connecting the Rooks').",
          coachMessage: "Connect your Rooks to complete your opening development!"
        },
        {
          id: "step-11",
          type: "COMPLETION"
        }
      ]
    }
  }
};

export const COURSES_DATA: CourseData[] = [
  {
    id: "course-openings",
    slug: "master-openings",
    title: "Masterclass: Essential Openings",
    description: "Build a world-class opening repertoire with White and Black. Master key setups, strategic plans, and early center control.",
    published: true,
    lessons: [
      {
        id: "lesson-italian-game",
        slug: "italian-game",
        title: "The Italian Game",
        description: "Master rapid piece development and center control with 1.e4 e5 2.Nf3 Nc6 3.Bc4.",
        thumbnail: null,
        difficulty: "Beginner",
        estimatedTime: 12,
        category: "Openings"
      },
      {
        id: "lesson-ruy-lopez",
        slug: "ruy-lopez",
        title: "The Ruy Lopez (Spanish Opening)",
        description: "Learn the legendary 'Spanish Torture' played by World Champions.",
        thumbnail: null,
        difficulty: "Intermediate",
        estimatedTime: 12,
        category: "Openings"
      },
      {
        id: "lesson-sicilian-defense",
        slug: "sicilian-defense",
        title: "The Sicilian Defense (1...c5)",
        description: "Black's most aggressive counter to 1.e4.",
        thumbnail: null,
        difficulty: "Intermediate",
        estimatedTime: 12,
        category: "Openings"
      }
    ]
  },
  {
    id: "course-tactics",
    slug: "tactical-mastery",
    title: "Masterclass: Tactical Warfare",
    description: "Spot combination patterns, win enemy pieces, and crush opposing defenses with sharp tactical calculations.",
    published: true,
    lessons: [
      {
        id: "lesson-tactical-forks",
        slug: "tactical-forks",
        title: "Mastering Knight & Queen Forks",
        description: "Learn to attack two or more enemy pieces simultaneously.",
        thumbnail: null,
        difficulty: "Beginner",
        estimatedTime: 10,
        category: "Tactics"
      },
      {
        id: "lesson-pins-skewers",
        slug: "pins-skewers",
        title: "Pins & Skewers: Linear Tactics",
        description: "Freeze enemy pieces on lines and force massive material gains.",
        thumbnail: null,
        difficulty: "Intermediate",
        estimatedTime: 10,
        category: "Tactics"
      }
    ]
  },
  {
    id: "course-strategy-endgames",
    slug: "strategy-endgames",
    title: "Masterclass: Strategy & Endgames",
    description: "Master fundamental endgame techniques and strategic principles required to convert advantages into clean wins.",
    published: true,
    lessons: [
      {
        id: "lesson-opening-principles",
        slug: "opening-principles",
        title: "The 3 Golden Opening Principles",
        description: "Learn the three fundamental rules every master follows in the first 10 moves.",
        thumbnail: null,
        difficulty: "Beginner",
        estimatedTime: 10,
        category: "Strategy"
      },
      {
        id: "lesson-endgames-basic",
        slug: "endgames-basic",
        title: "King & Pawn Endgames: Opposition",
        description: "Turn single pawns into victorious Queens using opposition.",
        thumbnail: null,
        difficulty: "Intermediate",
        estimatedTime: 10,
        category: "Endgames"
      }
    ]
  }
];
