const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');

// Map of base module names to their canonical alias path
const symbolToPath = {
  // Account
  'AuthModal': '@/components/account-AuthModal',
  'ProfileContent': '@/components/account-ProfileContent',
  'ProtectedRoute': '@/components/account-ProtectedRoute',
  'SessionContext': '@/contexts/account-SessionContext',
  'sessionContext.instance': '@/contexts/account-sessionContext.instance',
  'useSession': '@/hooks/account-useSession',

  // Billing
  'CountrySelector': '@/components/billing-CountrySelector',
  'MembershipFeatureBanner': '@/components/billing-MembershipFeatureBanner',
  'MembershipFeaturesSection': '@/components/billing-MembershipFeaturesSection',
  'payment.service': '@/services/billing-payment.service',
  'payment.types': '@/types/billing-payment.types',
  'pricing.service': '@/services/billing-pricing.service',
  'pricingFeatures': '@/data/billing-pricingFeatures',
  'usePricing': '@/hooks/billing-usePricing',
  'useSubscription': '@/hooks/billing-useSubscription',

  // Creator
  'ChannelHero': '@/components/creator-ChannelHero',
  'ContentFilterBar': '@/components/creator-ContentFilterBar',
  'ContentGridCard': '@/components/creator-ContentGridCard',
  'MasterclassCard': '@/components/creator-MasterclassCard',
  'StudentBreakthroughs': '@/components/creator-StudentBreakthroughs',
  'creatorMockData': '@/data/creator-mockData',

  // Database
  'mockGames': '@/data/database-mockGames',

  // Join Us
  'DepartmentOpeningsCards': '@/components/joinus-DepartmentOpeningsCards',
  'DepartmentOpeningsTable': '@/components/joinus-DepartmentOpeningsTable',
  'OpeningDetails': '@/components/joinus-OpeningDetails',
  'joinUsData': '@/data/joinus-joinUsData',
  'assessment.service': '@/services/joinus-assessment.service',
  'assessmentTypes': '@/types/joinus-assessmentTypes',
  'questionTypeLabel': '@/utils/joinus-questionTypeLabel',
  'AssessmentAlreadyCompleteScreen': '@/components/joinus-AssessmentAlreadyCompleteScreen',
  'AssessmentComingSoon': '@/components/joinus-AssessmentComingSoon',
  'AssessmentResultScreen': '@/components/joinus-AssessmentResultScreen',
  'AssessmentShell': '@/components/joinus-AssessmentShell',
  'AssessmentSkeleton': '@/components/joinus-AssessmentSkeleton',
  'AssessmentSubmitConfirmModal': '@/components/joinus-AssessmentSubmitConfirmModal',
  'CodeBlock': '@/components/joinus-CodeBlock',
  'MobileQuestionNav': '@/components/joinus-MobileQuestionNav',
  'QuestionCard': '@/components/joinus-QuestionCard',
  'QuestionNavigator': '@/components/joinus-QuestionNavigator',
  'TimedCodingScreen': '@/components/joinus-TimedCodingScreen',
  'TimedSectionWarningModal': '@/components/joinus-TimedSectionWarningModal',
  'CheckboxGroupInput': '@/components/joinus-CheckboxGroupInput',
  'CodeInput': '@/components/joinus-CodeInput',
  'LongTextInput': '@/components/joinus-LongTextInput',
  'MultipleChoiceInput': '@/components/joinus-MultipleChoiceInput',
  'NumberInput': '@/components/joinus-NumberInput',
  'RadioWithTextInput': '@/components/joinus-RadioWithTextInput',
  'ShortTextInput': '@/components/joinus-ShortTextInput',

  // Landing
  'ChessAnimationLayer': '@/components/landing-ChessAnimationLayer',
  'Hero': '@/components/landing-Hero',
  'HeroPuzzle': '@/components/landing-HeroPuzzle',
  'HeroV2': '@/components/landing-HeroV2',
  'LegendsSectionV2': '@/components/landing-LegendsSectionV2',
  'LessonsSectionV2': '@/components/landing-LessonsSectionV2',
  'MoveAnnotation': '@/components/landing-MoveAnnotation',
  'PartnerCTA': '@/components/landing-PartnerCTA',
  'PuzzleSectionV2': '@/components/landing-PuzzleSectionV2',
  'useConfetti': '@/hooks/landing-useConfetti',
  'useMoveAnnotation': '@/hooks/landing-useMoveAnnotation',
  'useMoveTrail': '@/hooks/landing-useMoveTrail',

  // Lessons
  'builderLesson.service': '@/services/lessons-builderLesson.service',
  'lessonCache.service': '@/services/lessons-lessonCache.service',
  'lessonSync.service': '@/services/lessons-lessonSync.service',
  'publicLesson.service': '@/services/lessons-publicLesson.service',
  'AlignmentDropdown': '@/components/lessons-AlignmentDropdown',
  'CloudSyncButton': '@/components/lessons-CloudSyncButton',
  'ContextMenu': '@/components/lessons-ContextMenu',
  'EmbeddedChessboard': '@/components/lessons-EmbeddedChessboard',
  'FontSizeControl': '@/components/lessons-FontSizeControl',
  'LessonBuilderHeader': '@/components/lessons-LessonBuilderHeader',
  'LessonBuilderSidebar': '@/components/lessons-LessonBuilderSidebar',
  'LessonCanvas': '@/components/lessons-LessonCanvas',
  'LessonFooter': '@/components/lessons-LessonFooter',
  'LessonTextToolbar': '@/components/lessons-LessonTextToolbar',
  'LinkPopover': '@/components/lessons-LinkPopover',
  'PublishConfirmationModal': '@/components/lessons-PublishConfirmationModal',
  'RichTextEditor': '@/components/lessons-RichTextEditor',
  'ThumbnailComingSoonModal': '@/components/lessons-ThumbnailComingSoonModal',
  'ThumbnailEditorModal': '@/components/lessons-ThumbnailEditorModal',
  'types': '@/types/lessons-types',
  'lessonHasher': '@/utils/lessons-lessonHasher',
  'lessonNaming': '@/utils/lessons-lessonNaming',

  // News
  'NewsSettingsWidget': '@/components/news-NewsSettingsWidget',

  // Openings
  'OpeningBoard': '@/components/openings-OpeningBoard',
  'OpeningCoachPanel': '@/components/openings-OpeningCoachPanel',
  'OpeningCompletionCard': '@/components/openings-OpeningCompletionCard',
  'OpeningProgressBar': '@/components/openings-OpeningProgressBar',
  'openings.service': '@/services/openings-openings.service',
  'openings.types': '@/types/openings-openings.types',
  'useOpeningTrainer': '@/hooks/openings-useOpeningTrainer',
  'useOpenings': '@/hooks/openings-useOpenings',

  // Play
  'GameSessionContext': '@/contexts/play-GameSessionContext',
  'gameSessionContext.instance': '@/contexts/play-gameSessionContext.instance',
  'MatchmakingContext': '@/contexts/play-MatchmakingContext',
  'matchmakingContext.instance': '@/contexts/play-matchmakingContext.instance',
  'games.service': '@/services/play-games.service',
  'matchmaking.service': '@/services/play-matchmaking.service',
  'multiplayer.types': '@/types/play-multiplayer.types',
  'useChess960Game': '@/hooks/play-useChess960Game',
  'useGameSession': '@/hooks/play-useGameSession',
  'useMatchmaking': '@/hooks/play-useMatchmaking',
  'Chess960SetupPanel': '@/components/play-Chess960SetupPanel',
  'ConnectionIndicator': '@/components/play-ConnectionIndicator',
  'GameActionBar': '@/components/play-GameActionBar',
  'GameBoard': '@/components/play-GameBoard',
  'GameControls': '@/components/play-GameControls',
  'GameHistoryList': '@/components/play-GameHistoryList',
  'GameStatusBanner': '@/components/play-GameStatusBanner',
  'LeaderboardPanel': '@/components/play-LeaderboardPanel',
  'LeaveGameConfirmModal': '@/components/play-LeaveGameConfirmModal',
  'LiveRegion': '@/components/play-LiveRegion',
  'LobbyView': '@/components/play-LobbyView',
  'MatchFoundCard': '@/components/play-MatchFoundCard',
  'MoveLog': '@/components/play-MoveLog',
  'MultiplayerBoard': '@/components/play-MultiplayerBoard',
  'OpponentIdentity': '@/components/play-OpponentIdentity',
  'PlayChessGame': '@/components/play-PlayChessGame',
  'PlayHubOverview': '@/components/play-PlayHubOverview',
  'PlayOnlineView': '@/components/play-PlayOnlineView',
  'PlayerPanel': '@/components/play-PlayerPanel',
  'QueuePanel': '@/components/play-QueuePanel',
  'QuickGameBoard': '@/components/play-QuickGameBoard',
  'QuickGameView': '@/components/play-QuickGameView',
  'ResultRevealModal': '@/components/play-ResultRevealModal',
  'SideClock': '@/components/play-SideClock',
  'VariantCard': '@/components/play-VariantCard',
  'VariantsView': '@/components/play-VariantsView',

  // Puzzles
  'CoachChatBox': '@/components/puzzles-CoachChatBox',
  'CustomPuzzlePanel': '@/components/puzzles-CustomPuzzlePanel',
  'CustomPuzzleSession': '@/components/puzzles-CustomPuzzleSession',
  'PuzzleBoard': '@/components/puzzles-PuzzleBoard',
  'PuzzleCoach': '@/components/puzzles-PuzzleCoach',
  'matein1.json': '@/data/puzzles-matein1.json',
  'pathway.types': '@/types/puzzles-pathway.types',
  'pathwayProgress.service': '@/services/puzzles-pathwayProgress.service',
  'puzzle.service': '@/services/puzzles-puzzle.service',
  'puzzle.types': '@/types/puzzles-puzzle.types',
  'puzzleLoader': '@/utils/puzzles-puzzleLoader',
  'puzzleValidator': '@/utils/puzzles-puzzleValidator',
  'usePuzzleProgress': '@/hooks/puzzles-usePuzzleProgress',
  'CrystalPathway': '@/components/puzzles-CrystalPathway',
  'InfernoPathway': '@/components/puzzles-InfernoPathway',
  'ObsidianPathway': '@/components/puzzles-ObsidianPathway',
  'RoyalGoldPathway': '@/components/puzzles-RoyalGoldPathway',
  'RoyalPurplePathway': '@/components/puzzles-RoyalPurplePathway',
  'VerdantForestPathway': '@/components/puzzles-VerdantForestPathway',
  'pathways': '@/components/puzzles-pathways.index',
  'crystalNodes': '@/data/puzzles-crystalNodes',
  'infernoNodes': '@/data/puzzles-infernoNodes',
  'obsidianNodes': '@/data/puzzles-obsidianNodes',
  'royalGoldNodes': '@/data/puzzles-royalGoldNodes',
  'royalPurpleNodes': '@/data/puzzles-royalPurpleNodes',
  'verdantForestNodes': '@/data/puzzles-verdantForestNodes',

  // Report
  'ReportForm': '@/components/report-ReportForm',

  // Story Mode
  'StoryModeBattle': '@/components/storymode-StoryModeBattle',
  'StoryModeCharacterSelect': '@/components/storymode-StoryModeCharacterSelect',
  'StoryModeContext': '@/contexts/storymode-StoryModeContext',
  'StoryModeMap': '@/components/storymode-StoryModeMap',
  'StoryModeMapCanvas': '@/components/storymode-StoryModeMapCanvas',
  'StoryModeMerchant': '@/components/storymode-StoryModeMerchant',
  'StoryModeNodeIcon': '@/components/storymode-StoryModeNodeIcon',
  'StoryModePuzzleNode': '@/components/storymode-StoryModePuzzleNode',
  'StoryModeRestSite': '@/components/storymode-StoryModeRestSite',
  'storyModeMapData': '@/data/storymode-storyModeMapData',
  'ConfirmAbandonModal': '@/components/storymode-ConfirmAbandonModal',
  'ConfirmDeleteModal': '@/components/storymode-ConfirmDeleteModal',
  'GuestWarningModal': '@/components/storymode-GuestWarningModal',
  'OdysseyTitleScreen': '@/components/storymode-OdysseyTitleScreen',
  'PatchNotesButton': '@/components/storymode-PatchNotesButton',
  'SaveProfileScreen': '@/components/storymode-SaveProfileScreen',
  'SettingsButton': '@/components/storymode-SettingsButton',
  'StrategistPage': '@/components/storymode-StrategistPage',

  // Test Maia
  'maiaHelpers': '@/utils/testmaia-maiaHelpers',
  'MaiaMoveLog': '@/components/testmaia-MaiaMoveLog',
  'MaiaPlayerCard': '@/components/testmaia-MaiaPlayerCard',
  'TestMaiaBoard': '@/components/testmaia-TestMaiaBoard',
  'useMaia': '@/hooks/testmaia-useMaia',

  // App / Navigation
  'AvatarDropdown': '@/components/nav-AvatarDropdown',
  'MoreMenu': '@/components/nav-MoreMenu',
  'NavigationStackContext': '@/contexts/nav-NavigationStackContext',
  'navigationStackContext.instance': '@/contexts/nav-navigationStackContext.instance',
  'ScrollToTop': '@/components/nav-ScrollToTop',
  'SidebarLayout': '@/components/nav-SidebarLayout',
  'SoundToggle': '@/components/nav-SoundToggle',
  'ThemeSubmenu': '@/components/nav-ThemeSubmenu',
  'useNavigationStack': '@/hooks/nav-useNavigationStack',

  // Layouts
  'MainLayout': '@/components/layouts/MainLayout',
  'MinimalLayout': '@/components/layouts/MinimalLayout',
  'PageShell': '@/components/layouts/PageShell',

  // Router
  'AppRouter': '@/components/router-AppRouter',
  'routeMatcher': '@/utils/router-routeMatcher',
  'routes.config': '@/utils/router-routes.config',
  'routes': '@/components/router-routes',
  'useDocumentTitle': '@/hooks/router-useDocumentTitle',

  // Shared / Appearance
  'boardSettingsContext.instance': '@/contexts/appearance-boardSettingsContext.instance',
  'BoardSettingsContext': '@/contexts/appearance-BoardSettingsContext',
  'boardThemes': '@/data/appearance-boardThemes',
  'fallbackPuzzles': '@/data/appearance-fallbackPuzzles',
  'pieceSets': '@/data/appearance-pieceSets',
  'themeContext.instance': '@/contexts/appearance-themeContext.instance',
  'ThemeContext': '@/contexts/appearance-ThemeContext',
  'themeModes': '@/data/appearance-themeModes',
  'useBoardSettings': '@/hooks/appearance-useBoardSettings',
  'useTheme': '@/hooks/appearance-useTheme',

  // Shared / Chess
  'chess.types': '@/types/chess-chess.types',
  'chess960': '@/utils/chess-chess960',
  'chess960PositionId': '@/utils/chess-chess960PositionId',
  'chessHelpers': '@/utils/chess-chessHelpers',
  'editModeInteraction': '@/utils/chess-editModeInteraction',
  'mapGenerator': '@/utils/chess-mapGenerator',
  'positionEditor': '@/utils/chess-positionEditor',

  // Shared / Hooks
  'useButtonGlow': '@/hooks/ui-useButtonGlow',
  'useClickToMove': '@/hooks/ui-useClickToMove',
  'useGSAP': '@/hooks/ui-useGSAP',
  'useMagneticButton': '@/hooks/ui-useMagneticButton',
  'useScrollReveal': '@/hooks/ui-useScrollReveal',
  'useStockfish': '@/hooks/ui-useStockfish',

  // Shared / Lib
  'featureFlags': '@/lib/featureFlags',
  'gsapConfig': '@/lib/gsapConfig',
  'pluralize': '@/lib/pluralize',
  'rollbar': '@/lib/rollbar',
  'SoundManager': '@/lib/SoundManager',

  // Shared / UI
  'BoardCoordinates': '@/components/ui-BoardCoordinates',
  'BoardPreview': '@/components/ui-BoardPreview',
  'Confetti': '@/components/ui-Confetti',
  'EditPositionBoard': '@/components/ui-EditPositionBoard',
  'EditPositionModal': '@/components/ui-EditPositionModal',
  'EvaluationBar': '@/components/ui-EvaluationBar',
  'RollbarFallback': '@/components/ui-RollbarFallback',
  'ThemedChessboard': '@/components/ui-ThemedChessboard'
};

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (/\.(tsx?|json)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = getAllFiles(srcDir);

// Sort keys descending by length
const sortedSymbols = Object.keys(symbolToPath).sort((a, b) => b.length - a.length);

allFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix remaining '@/features/...' or '@/app/...' or '@/shared/...' imports
  if (content.includes('@/features/') || content.includes('@/app/') || content.includes('@/shared/')) {
    content = content.replace(/@\/features\/[a-zA-Z0-9_\-\/]+/g, (match) => {
      const parts = match.split('/');
      const base = parts[parts.length - 1];
      return symbolToPath[base] || match;
    });
    content = content.replace(/@\/app\/[a-zA-Z0-9_\-\/]+/g, (match) => {
      const parts = match.split('/');
      const base = parts[parts.length - 1];
      return symbolToPath[base] || match;
    });
    content = content.replace(/@\/shared\/[a-zA-Z0-9_\-\/]+/g, (match) => {
      const parts = match.split('/');
      const base = parts[parts.length - 1];
      return symbolToPath[base] || match;
    });
    changed = true;
  }

  // Fix relative imports: from './X' or from '../X' or from '../../X'
  for (const symbol of sortedSymbols) {
    const target = symbolToPath[symbol];
    
    // regex matching import ... from './symbol' or '../symbol' etc.
    const relRegex = new RegExp(`(['"])\\.\\.?(\\/[^'"]*)*\\/${symbol}(['"])`, 'g');
    if (relRegex.test(content)) {
      content = content.replace(relRegex, `$1${target}$3`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('Intra-file imports successfully updated.');
