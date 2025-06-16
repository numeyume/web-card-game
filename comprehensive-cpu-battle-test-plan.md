# Comprehensive CPU Battle Test Plan

Based on my analysis of the codebase, here's a detailed test plan to verify CPU battle functionality at http://localhost:5174.

## Code Analysis Summary

The CPU battle system is implemented with the following key components:

1. **Entry Point**: Lobby.tsx - "🤖 すぐに対戦" button (line 207)
2. **Handler**: App.tsx - `onStartDominionDirect` function (lines 238-242)
3. **Game Engine**: InteractiveTutorial.tsx with `isCPUMode=true` (line 128)
4. **CPU AI**: DominionEngine.ts with automated CPU turn execution (lines 692-873)

## Test Execution Plan

### Phase 1: Initial Access and Navigation

1. **Open Application**
   - Navigate to `http://localhost:5174`
   - **Expected**: Application loads with dark theme and lobby interface
   - **Verify**: No console errors, connection status shows "接続済み" (connected)

2. **Lobby Interface Verification**
   - **Expected Elements**:
     - Header: "🎴 ウェブカードゲーム"
     - Six game mode cards including "CPU対戦"
     - CPU battle card has 2 buttons: "🎴 カード選択して対戦" and "🤖 すぐに対戦"
   - **Target Button**: "🤖 すぐに対戦" (immediate battle button)

### Phase 2: CPU Battle Initiation

3. **Click "🤖 すぐに対戦" Button**
   - **Expected Behavior**:
     - Console log: "🤖 すぐに対戦開始 - カスタムカードなし"
     - App state changes to `currentView: 'dominion'`
     - Triggers InteractiveTutorial component with `isCPUMode: true`, `selectedCards: []`

4. **Game Initialization Screen**
   - **Expected Display**:
     - Title: "🎯 CPU対戦"
     - Description: "CPUプレイヤーと1対1で対戦しましょう"
     - Debug info panel showing:
       - モード: CPU対戦
       - 選択カード数: 0 (標準ドミニオン)
       - ゲームエンジン: ✅ OK
       - ゲーム状態: ❌ 未初期化
     - Loading indicator: "ゲーム初期化中..."

### Phase 3: Automatic Game Start

5. **Auto-Initialization Process**
   - **Expected Sequence**:
     - useEffect triggers `startGame()` after 100ms delay
     - DominionEngine.startGame() called with `['プレイヤー', 'CPU']`
     - Game state initialized with standard Dominion cards
     - Success toast: "🎯 CPU対戦が開始されました！（標準ドミニオン）"

6. **Game Board Display**
   - **Expected Elements**:
     - Header: "🎯 CPU対戦" with turn counter
     - Player stats section with Human vs CPU statistics
     - Victory condition progress (Province count, empty supply piles)
     - Current player status (should be Human player's turn first)

### Phase 4: Game Flow Verification

7. **Human Player Turn (Action Phase)**
   - **Expected State**:
     - Phase indicator: "🎯 アクション"
     - Player resources: Actions=1, Buys=1, Coins=0
     - Hand: 5 cards (3 Estates, 7 Coppers initially)
     - Supply: All Dominion cards visible with correct counts
   - **Actions Available**:
     - Click action cards (if any)
     - "購入へ" button to move to buy phase

8. **Human Player Turn (Buy Phase)**
   - **Expected State**:
     - Phase indicator: "💰 購入"
     - "💰 財宝一括" button available
     - Supply cards show purchase eligibility (green border for affordable cards)
   - **Test Actions**:
     - Click "財宝一括" to play all treasure cards
     - Verify coins increase appropriately
     - Click an affordable supply card to select it
     - Confirm purchase with "✅ 購入" button

9. **Turn Transition to CPU**
   - **Expected Behavior**:
     - Click "ターン終了" button
     - Cleanup phase executes (discard hand, draw 5 new cards)
     - Turn counter increases
     - CPU turn starts automatically

### Phase 5: CPU Behavior Verification

10. **CPU Turn Execution**
    - **Expected Sequence**:
      - CPU indicator: "🤖 [CPU名] のターン" with animated robot icon
      - Phase indicators: "⚡ アクションを検討中..." → "💰 購入を検討中..."
      - Console logs showing CPU decision making
      - Automatic action card plays (if CPU has any)
      - Automatic treasure card plays
      - Strategic purchases based on turn number
    - **CPU Strategy Verification**:
      - Early game: Buy Silver, Village, Woodcutter
      - Mid game: Buy Gold, Market, Laboratory, Smithy
      - Late game (turn 8+): Buy Victory cards (Province > Duchy > Estate)

11. **CPU Turn Completion**
    - **Expected Behavior**:
      - CPU completes all phases automatically
      - Turn returns to human player after ~1-2 seconds
      - Game log shows CPU actions
      - Supply counts updated based on CPU purchases

### Phase 6: Game Progression and End Conditions

12. **Multi-Turn Gameplay**
    - **Verify Multiple Cycles**:
      - Human and CPU alternate turns correctly
      - Turn counter increments properly
      - Victory point tracking updates
      - Supply depletion progresses realistically

13. **End Game Conditions**
    - **Test Scenarios**:
      - Province pile exhaustion (12 → 0)
      - Three supply piles exhausted
      - End game modal displays correctly
      - Final scores calculated properly

### Phase 7: Error Handling and Edge Cases

14. **Error Scenarios**
    - **Test Invalid Actions**:
      - Clicking during CPU turn (should show error)
      - Trying to buy unaffordable cards
      - Playing cards in wrong phase
    - **Expected**: Appropriate error toasts, no game crashes

15. **Browser Console Monitoring**
    - **Watch For**:
      - No uncaught JavaScript errors
      - Proper state update logs
      - CPU decision-making logs
      - Network request logs (should be minimal for CPU mode)

## Success Criteria

### ✅ PASS Conditions:
- [ ] Application loads without errors
- [ ] "🤖 すぐに対戦" button initiates CPU battle
- [ ] Game initializes with standard Dominion cards
- [ ] Human player can perform all actions (play cards, buy cards, end turn)
- [ ] CPU automatically takes turns with visible feedback
- [ ] Game alternates between human and CPU properly
- [ ] CPU makes strategic decisions appropriate to game phase
- [ ] Game ends correctly with proper winner determination
- [ ] No JavaScript errors or crashes during gameplay
- [ ] All UI elements respond correctly

### ❌ FAIL Conditions:
- Black screen after clicking battle button
- Game initialization hangs or times out
- CPU turn never completes or gets stuck
- JavaScript errors in console
- Game state becomes corrupted
- UI becomes unresponsive
- Network errors for local-only functionality

## Testing Tools and Techniques

1. **Browser Developer Tools**
   - Console: Monitor logs and errors
   - Network: Verify minimal external requests
   - Performance: Check for memory leaks during long games

2. **Manual Testing Approach**
   - Step-by-step verification of each phase
   - Multiple game sessions to test consistency
   - Different browser tab/window scenarios

3. **Automated Verification (if available)**
   - Run any existing test suites
   - Check for test coverage of CPU battle scenarios

## Expected Output Report

After completing this test plan, the report should include:

1. **Screenshots/Visual Evidence**:
   - Lobby interface showing CPU battle options
   - Game initialization screen
   - Active gameplay with human turn
   - CPU turn in progress
   - End game modal

2. **Console Logs**:
   - Game initialization logs
   - State transition logs
   - CPU decision logs
   - Any error messages

3. **Functionality Assessment**:
   - Each test phase result (PASS/FAIL)
   - Specific issues encountered
   - Performance observations
   - User experience quality

4. **Final Verdict**:
   - Overall functionality rating
   - Readiness for production
   - Recommended fixes or improvements

This comprehensive test plan should provide definitive verification of whether the CPU battle functionality works as intended in the browser environment.