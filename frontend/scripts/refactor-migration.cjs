const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src');

// 1. Target directories to ensure exist
const targetDirs = [
  'hooks',
  'services',
  'contexts',
  'types',
  'utils',
  'lib',
  'data',
  'components',
  'components/atoms',
  'components/molecules',
  'components/organisms',
  'components/layouts'
].map(d => path.join(srcDir, d));

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 2. Define explicit file movement mapping (from relative src path to relative src path)
const fileMap = {
  // --- Account ---
  'features/account/AuthModal.tsx': 'components/account-AuthModal.tsx',
  'features/account/ProfileContent.tsx': 'components/account-ProfileContent.tsx',
  'features/account/ProtectedRoute.tsx': 'components/account-ProtectedRoute.tsx',
  'features/account/SessionContext.tsx': 'contexts/account-SessionContext.tsx',
  'features/account/sessionContext.instance.ts': 'contexts/account-sessionContext.instance.ts',
  'features/account/useSession.ts': 'hooks/account-useSession.ts',

  // --- Billing ---
  'features/billing/CountrySelector.tsx': 'components/billing-CountrySelector.tsx',
  'features/billing/MembershipFeatureBanner.tsx': 'components/billing-MembershipFeatureBanner.tsx',
  'features/billing/MembershipFeaturesSection.tsx': 'components/billing-MembershipFeaturesSection.tsx',
  'features/billing/payment.service.ts': 'services/billing-payment.service.ts',
  'features/billing/payment.types.ts': 'types/billing-payment.types.ts',
  'features/billing/pricing.service.ts': 'services/billing-pricing.service.ts',
  'features/billing/pricingFeatures.ts': 'data/billing-pricingFeatures.ts',
  'features/billing/usePricing.ts': 'hooks/billing-usePricing.ts',
  'features/billing/useSubscription.ts': 'hooks/billing-useSubscription.ts',

  // --- Creator ---
  'features/creator/ChannelHero.tsx': 'components/creator-ChannelHero.tsx',
  'features/creator/ContentFilterBar.tsx': 'components/creator-ContentFilterBar.tsx',
  'features/creator/ContentGridCard.tsx': 'components/creator-ContentGridCard.tsx',
  'features/creator/MasterclassCard.tsx': 'components/creator-MasterclassCard.tsx',
  'features/creator/StudentBreakthroughs.tsx': 'components/creator-StudentBreakthroughs.tsx',
  'features/creator/creatorMockData.ts': 'data/creator-mockData.ts',

  // --- Database ---
  'features/database/mockGames.ts': 'data/database-mockGames.ts',

  // --- Join Us ---
  'features/join-us/DepartmentOpeningsCards.tsx': 'components/joinus-DepartmentOpeningsCards.tsx',
  'features/join-us/DepartmentOpeningsTable.tsx': 'components/joinus-DepartmentOpeningsTable.tsx',
  'features/join-us/OpeningDetails.tsx': 'components/joinus-OpeningDetails.tsx',
  'features/join-us/joinUsData.ts': 'data/joinus-joinUsData.ts',
  'features/join-us/assessment/assessment.service.ts': 'services/joinus-assessment.service.ts',
  'features/join-us/assessment/assessmentTypes.ts': 'types/joinus-assessmentTypes.ts',
  'features/join-us/assessment/questionTypeLabel.ts': 'utils/joinus-questionTypeLabel.ts',
  'features/join-us/assessment/components/AssessmentAlreadyCompleteScreen.tsx': 'components/joinus-AssessmentAlreadyCompleteScreen.tsx',
  'features/join-us/assessment/components/AssessmentComingSoon.tsx': 'components/joinus-AssessmentComingSoon.tsx',
  'features/join-us/assessment/components/AssessmentResultScreen.tsx': 'components/joinus-AssessmentResultScreen.tsx',
  'features/join-us/assessment/components/AssessmentShell.tsx': 'components/joinus-AssessmentShell.tsx',
  'features/join-us/assessment/components/AssessmentSkeleton.tsx': 'components/joinus-AssessmentSkeleton.tsx',
  'features/join-us/assessment/components/AssessmentSubmitConfirmModal.tsx': 'components/joinus-AssessmentSubmitConfirmModal.tsx',
  'features/join-us/assessment/components/CodeBlock.tsx': 'components/joinus-CodeBlock.tsx',
  'features/join-us/assessment/components/MobileQuestionNav.tsx': 'components/joinus-MobileQuestionNav.tsx',
  'features/join-us/assessment/components/QuestionCard.tsx': 'components/joinus-QuestionCard.tsx',
  'features/join-us/assessment/components/QuestionNavigator.tsx': 'components/joinus-QuestionNavigator.tsx',
  'features/join-us/assessment/components/TimedCodingScreen.tsx': 'components/joinus-TimedCodingScreen.tsx',
  'features/join-us/assessment/components/TimedSectionWarningModal.tsx': 'components/joinus-TimedSectionWarningModal.tsx',
  'features/join-us/assessment/components/inputs/CheckboxGroupInput.tsx': 'components/joinus-CheckboxGroupInput.tsx',
  'features/join-us/assessment/components/inputs/CodeInput.tsx': 'components/joinus-CodeInput.tsx',
  'features/join-us/assessment/components/inputs/LongTextInput.tsx': 'components/joinus-LongTextInput.tsx',
  'features/join-us/assessment/components/inputs/MultipleChoiceInput.tsx': 'components/joinus-MultipleChoiceInput.tsx',
  'features/join-us/assessment/components/inputs/NumberInput.tsx': 'components/joinus-NumberInput.tsx',
  'features/join-us/assessment/components/inputs/RadioWithTextInput.tsx': 'components/joinus-RadioWithTextInput.tsx',
  'features/join-us/assessment/components/inputs/ShortTextInput.tsx': 'components/joinus-ShortTextInput.tsx',

  // --- Landing ---
  'features/landing/ChessAnimationLayer.tsx': 'components/landing-ChessAnimationLayer.tsx',
  'features/landing/Hero.tsx': 'components/landing-Hero.tsx',
  'features/landing/HeroPuzzle.tsx': 'components/landing-HeroPuzzle.tsx',
  'features/landing/HeroV2.tsx': 'components/landing-HeroV2.tsx',
  'features/landing/LegendsSectionV2.tsx': 'components/landing-LegendsSectionV2.tsx',
  'features/landing/LessonsSectionV2.tsx': 'components/landing-LessonsSectionV2.tsx',
  'features/landing/MoveAnnotation.tsx': 'components/landing-MoveAnnotation.tsx',
  'features/landing/PartnerCTA.tsx': 'components/landing-PartnerCTA.tsx',
  'features/landing/PuzzleSectionV2.tsx': 'components/landing-PuzzleSectionV2.tsx',
  'features/landing/useConfetti.ts': 'hooks/landing-useConfetti.ts',
  'features/landing/useMoveAnnotation.ts': 'hooks/landing-useMoveAnnotation.ts',
  'features/landing/useMoveTrail.ts': 'hooks/landing-useMoveTrail.ts',

  // --- Lessons ---
  'features/lessons/builderLesson.service.ts': 'services/lessons-builderLesson.service.ts',
  'features/lessons/lessonCache.service.ts': 'services/lessons-lessonCache.service.ts',
  'features/lessons/lessonSync.service.ts': 'services/lessons-lessonSync.service.ts',
  'features/lessons/publicLesson.service.ts': 'services/lessons-publicLesson.service.ts',
  'features/lessons/components/AlignmentDropdown.tsx': 'components/lessons-AlignmentDropdown.tsx',
  'features/lessons/components/CloudSyncButton.tsx': 'components/lessons-CloudSyncButton.tsx',
  'features/lessons/components/ContextMenu.tsx': 'components/lessons-ContextMenu.tsx',
  'features/lessons/components/EmbeddedChessboard.tsx': 'components/lessons-EmbeddedChessboard.tsx',
  'features/lessons/components/FontSizeControl.tsx': 'components/lessons-FontSizeControl.tsx',
  'features/lessons/components/LessonBuilderHeader.tsx': 'components/lessons-LessonBuilderHeader.tsx',
  'features/lessons/components/LessonBuilderSidebar.tsx': 'components/lessons-LessonBuilderSidebar.tsx',
  'features/lessons/components/LessonCanvas.tsx': 'components/lessons-LessonCanvas.tsx',
  'features/lessons/components/LessonFooter.tsx': 'components/lessons-LessonFooter.tsx',
  'features/lessons/components/LessonTextToolbar.tsx': 'components/lessons-LessonTextToolbar.tsx',
  'features/lessons/components/LinkPopover.tsx': 'components/lessons-LinkPopover.tsx',
  'features/lessons/components/PublishConfirmationModal.tsx': 'components/lessons-PublishConfirmationModal.tsx',
  'features/lessons/components/RichTextEditor.tsx': 'components/lessons-RichTextEditor.tsx',
  'features/lessons/components/ThumbnailComingSoonModal.tsx': 'components/lessons-ThumbnailComingSoonModal.tsx',
  'features/lessons/components/ThumbnailEditorModal.tsx': 'components/lessons-ThumbnailEditorModal.tsx',
  'features/lessons/components/types.ts': 'types/lessons-types.ts',
  'features/lessons/utils/lessonHasher.ts': 'utils/lessons-lessonHasher.ts',
  'features/lessons/utils/lessonNaming.ts': 'utils/lessons-lessonNaming.ts',

  // --- News ---
  'features/news/NewsSettingsWidget.tsx': 'components/news-NewsSettingsWidget.tsx',

  // --- Openings ---
  'features/openings/OpeningBoard.tsx': 'components/openings-OpeningBoard.tsx',
  'features/openings/OpeningCoachPanel.tsx': 'components/openings-OpeningCoachPanel.tsx',
  'features/openings/OpeningCompletionCard.tsx': 'components/openings-OpeningCompletionCard.tsx',
  'features/openings/OpeningProgressBar.tsx': 'components/openings-OpeningProgressBar.tsx',
  'features/openings/openings.service.ts': 'services/openings-openings.service.ts',
  'features/openings/openings.types.ts': 'types/openings-openings.types.ts',
  'features/openings/useOpeningTrainer.ts': 'hooks/openings-useOpeningTrainer.ts',
  'features/openings/useOpenings.ts': 'hooks/openings-useOpenings.ts',

  // --- Play ---
  'features/play/GameSessionContext.tsx': 'contexts/play-GameSessionContext.tsx',
  'features/play/gameSessionContext.instance.ts': 'contexts/play-gameSessionContext.instance.ts',
  'features/play/MatchmakingContext.tsx': 'contexts/play-MatchmakingContext.tsx',
  'features/play/matchmakingContext.instance.ts': 'contexts/play-matchmakingContext.instance.ts',
  'features/play/games.service.ts': 'services/play-games.service.ts',
  'features/play/matchmaking.service.ts': 'services/play-matchmaking.service.ts',
  'features/play/multiplayer.types.ts': 'types/play-multiplayer.types.ts',
  'features/play/useChess960Game.ts': 'hooks/play-useChess960Game.ts',
  'features/play/useGameSession.ts': 'hooks/play-useGameSession.ts',
  'features/play/useMatchmaking.ts': 'hooks/play-useMatchmaking.ts',
  'features/play/components/Chess960SetupPanel.tsx': 'components/play-Chess960SetupPanel.tsx',
  'features/play/components/ConnectionIndicator.tsx': 'components/play-ConnectionIndicator.tsx',
  'features/play/components/GameActionBar.tsx': 'components/play-GameActionBar.tsx',
  'features/play/components/GameBoard.tsx': 'components/play-GameBoard.tsx',
  'features/play/components/GameControls.tsx': 'components/play-GameControls.tsx',
  'features/play/components/GameHistoryList.tsx': 'components/play-GameHistoryList.tsx',
  'features/play/components/GameStatusBanner.tsx': 'components/play-GameStatusBanner.tsx',
  'features/play/components/LeaderboardPanel.tsx': 'components/play-LeaderboardPanel.tsx',
  'features/play/components/LeaveGameConfirmModal.tsx': 'components/play-LeaveGameConfirmModal.tsx',
  'features/play/components/LiveRegion.tsx': 'components/play-LiveRegion.tsx',
  'features/play/components/LobbyView.tsx': 'components/play-LobbyView.tsx',
  'features/play/components/MatchFoundCard.tsx': 'components/play-MatchFoundCard.tsx',
  'features/play/components/MoveLog.tsx': 'components/play-MoveLog.tsx',
  'features/play/components/MultiplayerBoard.tsx': 'components/play-MultiplayerBoard.tsx',
  'features/play/components/OpponentIdentity.tsx': 'components/play-OpponentIdentity.tsx',
  'features/play/components/PlayChessGame.tsx': 'components/play-PlayChessGame.tsx',
  'features/play/components/PlayHubOverview.tsx': 'components/play-PlayHubOverview.tsx',
  'features/play/components/PlayOnlineView.tsx': 'components/play-PlayOnlineView.tsx',
  'features/play/components/PlayerPanel.tsx': 'components/play-PlayerPanel.tsx',
  'features/play/components/QueuePanel.tsx': 'components/play-QueuePanel.tsx',
  'features/play/components/QuickGameBoard.tsx': 'components/play-QuickGameBoard.tsx',
  'features/play/components/QuickGameView.tsx': 'components/play-QuickGameView.tsx',
  'features/play/components/ResultRevealModal.tsx': 'components/play-ResultRevealModal.tsx',
  'features/play/components/SideClock.tsx': 'components/play-SideClock.tsx',
  'features/play/components/VariantCard.tsx': 'components/play-VariantCard.tsx',
  'features/play/components/VariantsView.tsx': 'components/play-VariantsView.tsx',

  // --- Puzzles ---
  'features/puzzles/components/CoachChatBox.tsx': 'components/puzzles-CoachChatBox.tsx',
  'features/puzzles/components/CustomPuzzlePanel.tsx': 'components/puzzles-CustomPuzzlePanel.tsx',
  'features/puzzles/components/CustomPuzzleSession.tsx': 'components/puzzles-CustomPuzzleSession.tsx',
  'features/puzzles/components/PuzzleBoard.tsx': 'components/puzzles-PuzzleBoard.tsx',
  'features/puzzles/components/PuzzleCoach.tsx': 'components/puzzles-PuzzleCoach.tsx',
  'features/puzzles/matein1.json': 'data/puzzles-matein1.json',
  'features/puzzles/pathway.types.ts': 'types/puzzles-pathway.types.ts',
  'features/puzzles/pathwayProgress.service.ts': 'services/puzzles-pathwayProgress.service.ts',
  'features/puzzles/puzzle.service.ts': 'services/puzzles-puzzle.service.ts',
  'features/puzzles/puzzle.types.ts': 'types/puzzles-puzzle.types.ts',
  'features/puzzles/puzzleLoader.ts': 'utils/puzzles-puzzleLoader.ts',
  'features/puzzles/puzzleValidator.ts': 'utils/puzzles-puzzleValidator.ts',
  'features/puzzles/usePuzzleProgress.ts': 'hooks/puzzles-usePuzzleProgress.ts',
  'features/puzzles/pathways/CrystalPathway.tsx': 'components/puzzles-CrystalPathway.tsx',
  'features/puzzles/pathways/InfernoPathway.tsx': 'components/puzzles-InfernoPathway.tsx',
  'features/puzzles/pathways/ObsidianPathway.tsx': 'components/puzzles-ObsidianPathway.tsx',
  'features/puzzles/pathways/RoyalGoldPathway.tsx': 'components/puzzles-RoyalGoldPathway.tsx',
  'features/puzzles/pathways/RoyalPurplePathway.tsx': 'components/puzzles-RoyalPurplePathway.tsx',
  'features/puzzles/pathways/VerdantForestPathway.tsx': 'components/puzzles-VerdantForestPathway.tsx',
  'features/puzzles/pathways/index.ts': 'components/puzzles-pathways.index.ts',
  'features/puzzles/pathways/crystalNodes.ts': 'data/puzzles-crystalNodes.ts',
  'features/puzzles/pathways/infernoNodes.ts': 'data/puzzles-infernoNodes.ts',
  'features/puzzles/pathways/obsidianNodes.ts': 'data/puzzles-obsidianNodes.ts',
  'features/puzzles/pathways/royalGoldNodes.ts': 'data/puzzles-royalGoldNodes.ts',
  'features/puzzles/pathways/royalPurpleNodes.ts': 'data/puzzles-royalPurpleNodes.ts',
  'features/puzzles/pathways/verdantForestNodes.ts': 'data/puzzles-verdantForestNodes.ts',

  // --- Report ---
  'features/report/ReportForm.tsx': 'components/report-ReportForm.tsx',

  // --- Story Mode ---
  'features/story-mode/StoryModeBattle.tsx': 'components/storymode-StoryModeBattle.tsx',
  'features/story-mode/StoryModeCharacterSelect.tsx': 'components/storymode-StoryModeCharacterSelect.tsx',
  'features/story-mode/StoryModeContext.tsx': 'contexts/storymode-StoryModeContext.tsx',
  'features/story-mode/StoryModeMap.tsx': 'components/storymode-StoryModeMap.tsx',
  'features/story-mode/StoryModeMapCanvas.tsx': 'components/storymode-StoryModeMapCanvas.tsx',
  'features/story-mode/StoryModeMerchant.tsx': 'components/storymode-StoryModeMerchant.tsx',
  'features/story-mode/StoryModeNodeIcon.tsx': 'components/storymode-StoryModeNodeIcon.tsx',
  'features/story-mode/StoryModePuzzleNode.tsx': 'components/storymode-StoryModePuzzleNode.tsx',
  'features/story-mode/StoryModeRestSite.tsx': 'components/storymode-StoryModeRestSite.tsx',
  'features/story-mode/storyModeMapData.ts': 'data/storymode-storyModeMapData.ts',
  'features/story-mode/TitleScreen/ConfirmAbandonModal.tsx': 'components/storymode-ConfirmAbandonModal.tsx',
  'features/story-mode/TitleScreen/ConfirmDeleteModal.tsx': 'components/storymode-ConfirmDeleteModal.tsx',
  'features/story-mode/TitleScreen/GuestWarningModal.tsx': 'components/storymode-GuestWarningModal.tsx',
  'features/story-mode/TitleScreen/OdysseyTitleScreen.tsx': 'components/storymode-OdysseyTitleScreen.tsx',
  'features/story-mode/TitleScreen/PatchNotesButton.tsx': 'components/storymode-PatchNotesButton.tsx',
  'features/story-mode/TitleScreen/SaveProfileScreen.tsx': 'components/storymode-SaveProfileScreen.tsx',
  'features/story-mode/TitleScreen/SettingsButton.tsx': 'components/storymode-SettingsButton.tsx',
  'features/story-mode/TitleScreen/StrategistPage.tsx': 'components/storymode-StrategistPage.tsx',

  // --- Test Maia ---
  'features/test-maia/maiaHelpers.ts': 'utils/testmaia-maiaHelpers.ts',
  'features/test-maia/MaiaMoveLog.tsx': 'components/testmaia-MaiaMoveLog.tsx',
  'features/test-maia/MaiaPlayerCard.tsx': 'components/testmaia-MaiaPlayerCard.tsx',
  'features/test-maia/TestMaiaBoard.tsx': 'components/testmaia-TestMaiaBoard.tsx',
  'features/test-maia/useMaia.ts': 'hooks/testmaia-useMaia.ts',

  // --- App / Navigation ---
  'app/navigation/AvatarDropdown.tsx': 'components/nav-AvatarDropdown.tsx',
  'app/navigation/MoreMenu.tsx': 'components/nav-MoreMenu.tsx',
  'app/navigation/NavigationStackContext.tsx': 'contexts/nav-NavigationStackContext.tsx',
  'app/navigation/navigationStackContext.instance.ts': 'contexts/nav-navigationStackContext.instance.ts',
  'app/navigation/ScrollToTop.tsx': 'components/nav-ScrollToTop.tsx',
  'app/navigation/SidebarLayout.tsx': 'components/nav-SidebarLayout.tsx',
  'app/navigation/SoundToggle.tsx': 'components/nav-SoundToggle.tsx',
  'app/navigation/ThemeSubmenu.tsx': 'components/nav-ThemeSubmenu.tsx',
  'app/navigation/useNavigationStack.ts': 'hooks/nav-useNavigationStack.ts',

  // --- App / Layouts ---
  'app/layouts/MainLayout.tsx': 'components/layouts/MainLayout.tsx',
  'app/layouts/MinimalLayout.tsx': 'components/layouts/MinimalLayout.tsx',

  // --- App / Router ---
  'app/router/AppRouter.tsx': 'components/router-AppRouter.tsx',
  'app/router/routeMatcher.ts': 'utils/router-routeMatcher.ts',
  'app/router/routes.config.ts': 'utils/router-routes.config.ts',
  'app/router/routes.tsx': 'components/router-routes.tsx',
  'app/router/useDocumentTitle.ts': 'hooks/router-useDocumentTitle.ts',

  // --- Shared / Appearance ---
  'shared/appearance/boardSettingsContext.instance.ts': 'contexts/appearance-boardSettingsContext.instance.ts',
  'shared/appearance/BoardSettingsContext.tsx': 'contexts/appearance-BoardSettingsContext.tsx',
  'shared/appearance/boardThemes.ts': 'data/appearance-boardThemes.ts',
  'shared/appearance/fallbackPuzzles.ts': 'data/appearance-fallbackPuzzles.ts',
  'shared/appearance/pieceSets.tsx': 'data/appearance-pieceSets.tsx',
  'shared/appearance/themeContext.instance.ts': 'contexts/appearance-themeContext.instance.ts',
  'shared/appearance/ThemeContext.tsx': 'contexts/appearance-ThemeContext.tsx',
  'shared/appearance/themeModes.ts': 'data/appearance-themeModes.ts',
  'shared/appearance/useBoardSettings.ts': 'hooks/appearance-useBoardSettings.ts',
  'shared/appearance/useTheme.ts': 'hooks/appearance-useTheme.ts',

  // --- Shared / Chess ---
  'shared/chess/chess.types.ts': 'types/chess-chess.types.ts',
  'shared/chess/chess960.ts': 'utils/chess-chess960.ts',
  'shared/chess/chess960PositionId.ts': 'utils/chess-chess960PositionId.ts',
  'shared/chess/chessHelpers.ts': 'utils/chess-chessHelpers.ts',
  'shared/chess/editModeInteraction.ts': 'utils/chess-editModeInteraction.ts',
  'shared/chess/mapGenerator.ts': 'utils/chess-mapGenerator.ts',
  'shared/chess/positionEditor.ts': 'utils/chess-positionEditor.ts',

  // --- Shared / Hooks ---
  'shared/hooks/useButtonGlow.ts': 'hooks/ui-useButtonGlow.ts',
  'shared/hooks/useClickToMove.ts': 'hooks/ui-useClickToMove.ts',
  'shared/hooks/useGSAP.ts': 'hooks/ui-useGSAP.ts',
  'shared/hooks/useMagneticButton.ts': 'hooks/ui-useMagneticButton.ts',
  'shared/hooks/useScrollReveal.ts': 'hooks/ui-useScrollReveal.ts',
  'shared/hooks/useStockfish.ts': 'hooks/ui-useStockfish.ts',

  // --- Shared / Lib ---
  'shared/lib/featureFlags.ts': 'lib/featureFlags.ts',
  'shared/lib/gsapConfig.ts': 'lib/gsapConfig.ts',
  'shared/lib/pluralize.ts': 'lib/pluralize.ts',
  'shared/lib/rollbar.ts': 'lib/rollbar.ts',
  'shared/lib/SoundManager.ts': 'lib/SoundManager.ts',

  // --- Shared / UI ---
  'shared/ui/BoardCoordinates.tsx': 'components/ui-BoardCoordinates.tsx',
  'shared/ui/BoardPreview.tsx': 'components/ui-BoardPreview.tsx',
  'shared/ui/Confetti.tsx': 'components/ui-Confetti.tsx',
  'shared/ui/EditPositionBoard.tsx': 'components/ui-EditPositionBoard.tsx',
  'shared/ui/EditPositionModal.tsx': 'components/ui-EditPositionModal.tsx',
  'shared/ui/EvaluationBar.tsx': 'components/ui-EvaluationBar.tsx',
  'shared/ui/RollbarFallback.tsx': 'components/ui-RollbarFallback.tsx',
  'shared/ui/ThemedChessboard.tsx': 'components/ui-ThemedChessboard.tsx'
};

// 3. Perform file copy/move
console.log('Copying files to new structure...');
for (const [srcRel, destRel] of Object.entries(fileMap)) {
  const fullSrc = path.join(srcDir, srcRel);
  const fullDest = path.join(srcDir, destRel);
  
  if (fs.existsSync(fullSrc)) {
    const destFolder = path.dirname(fullDest);
    if (!fs.existsSync(destFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });
    }
    fs.copyFileSync(fullSrc, fullDest);
  } else {
    console.warn(`Source file not found: ${srcRel}`);
  }
}

console.log('Building alias replacement maps...');

// Build regex mapping for all module imports
// We need to map old paths (both with extension and without) to new paths
const importMappings = [];

for (const [srcRel, destRel] of Object.entries(fileMap)) {
  const cleanSrc = srcRel.replace(/\.(tsx?|json)$/, '');
  const cleanDest = destRel.replace(/\.(tsx?|json)$/, '');

  // 1. Alias imports: @/features/..., @/app/..., @/shared/...
  importMappings.push({
    from: cleanSrc,
    to: cleanDest
  });
}

// Sort by length descending so more specific paths match first
importMappings.sort((a, b) => b.from.length - a.from.length);

console.log('Updating imports across all files in src/ ...');

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (/\.(tsx?|css|html|json)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = getAllFiles(srcDir);

allFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace alias imports: '@/features/...', '@/app/...', '@/shared/...'
  for (const { from, to } of importMappings) {
    const aliasFrom = `@/${from}`;
    const aliasTo = `@/${to}`;
    
    if (content.includes(aliasFrom)) {
      // Use regex with quote or slash boundary
      const regex = new RegExp(`(['"])${aliasFrom}(['"/])`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `$1${aliasTo}$2`);
        changed = true;
      }
    }
  }

  // Also replace relative imports that might exist inside migrated files
  // E.g. './crystalNodes' in components/puzzles-CrystalPathway.tsx -> '@/data/puzzles-crystalNodes'
  // Or '../components/...' in migrated files
  for (const { from, to } of importMappings) {
    // Check if filename matches something relative
    const baseFrom = from.split('/').pop();
    const aliasTo = `@/${to}`;
    
    // Replace exact relative imports like import ... from './baseFrom' or '../baseFrom'
    const relRegex = new RegExp(`(['"])\\.\\.?(\\/[^'"]*\\/)?${baseFrom}(['"])`, 'g');
    if (relRegex.test(content)) {
      content = content.replace(relRegex, `$1${aliasTo}$3`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('Migration script complete.');
