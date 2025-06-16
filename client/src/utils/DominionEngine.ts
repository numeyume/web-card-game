// 正確なドミニオンルール実装
import type { Card } from '@/types'

// ドミニオン専用のゲーム状態
interface DominionGameState {
  gameId: string
  players: DominionPlayer[]
  currentPlayerIndex: number
  turn: number
  phase: 'action' | 'buy' | 'cleanup'
  supply: DominionSupply
  trash: Card[]
  log: GameLogEntry[]
  isGameEnded: boolean
  winner?: DominionPlayer
  endReason?: string
}

interface DominionPlayer {
  id: string
  name: string
  isHuman: boolean
  
  // ドミニオンの3つの領域
  deck: Card[]           // 山札（上が次にドローするカード）
  hand: Card[]           // 手札
  discard: Card[]        // 捨て札
  
  // ターン中の一時状態
  actions: number        // 残りアクション数
  buys: number          // 残り購入数
  coins: number         // 今ターンのコイン
  
  // プレイエリア（このターンでプレイしたカード）
  playArea: Card[]
  
  // 統計
  totalVictoryPoints: number
  turnsPlayed: number
}

interface DominionSupply {
  // 財宝カード
  copper: SupplyPile
  silver: SupplyPile
  gold: SupplyPile
  
  // 勝利点カード
  estate: SupplyPile
  duchy: SupplyPile
  province: SupplyPile
  
  // 王国カード（アクションカード）
  village: SupplyPile
  market: SupplyPile
  smithy: SupplyPile
  laboratory: SupplyPile
  woodcutter: SupplyPile
}

interface SupplyPile {
  card: Card
  count: number
  cost: number
}

interface GameLogEntry {
  turn: number
  player: string
  action: string
  details?: any
  timestamp: string
}

export class DominionEngine {
  private gameState: DominionGameState | null = null
  private onStateUpdate?: (gameState: DominionGameState) => void

  constructor(onStateUpdate?: (gameState: DominionGameState) => void) {
    this.onStateUpdate = onStateUpdate
  }

  // ゲーム開始
  async startGame(playerNames: string[] = ['プレイヤー', 'CPU'], selectedCards?: Card[]): Promise<DominionGameState> {
    console.log('🎯 ドミニオンゲーム開始')
    
    // プレイヤー初期化
    const players: DominionPlayer[] = playerNames.map((name, index) => ({
      id: `player_${index}`,
      name,
      isHuman: index === 0, // 最初のプレイヤーは人間
      deck: [],
      hand: [],
      discard: [],
      actions: 1,
      buys: 1,
      coins: 0,
      playArea: [],
      totalVictoryPoints: 0,
      turnsPlayed: 0
    }))

    // サプライ初期化（カスタムカードを含む）
    const supply = await this.createSupplyWithCustomCards(selectedCards)

    // ゲーム状態初期化
    this.gameState = {
      gameId: `dominion_${Date.now()}`,
      players,
      currentPlayerIndex: 0,
      turn: 1,
      phase: 'action',
      supply,
      trash: [],
      log: [],
      isGameEnded: false
    }

    // 各プレイヤーの初期デッキ作成
    this.initializePlayerDecks()

    // 初期手札を配る
    this.players.forEach(player => {
      this.drawCards(player, 5)
    })

    this.addLog('ゲーム開始', 'ドミニオンゲームが開始されました')
    this.triggerStateUpdate()

    return this.gameState
  }

  // カスタムカードを含むサプライ作成
  private async createSupplyWithCustomCards(selectedCards?: Card[]): Promise<DominionSupply> {
    const standardSupply = this.createStandardSupply()
    
    try {
      let customCards: Card[] = []
      
      if (selectedCards && selectedCards.length > 0) {
        // 選択されたカードを使用
        customCards = selectedCards.filter(card => card.type === 'Action')
        console.log(`🎯 ${customCards.length}枚の選択されたカードをサプライに追加します`)
      } else {
        // selectedCardsがundefinedまたは空配列の場合、カスタムカードは追加しない
        console.log(`🎯 カスタムカードなしで標準ドミニオンゲームを開始します`)
      }
      
      // カスタムカードをサプライに追加
      customCards.slice(0, 3).forEach((card, index) => {
        const cardKey = `custom_${index + 1}` as keyof DominionSupply
        ;(standardSupply as any)[cardKey] = {
          card: {
            ...card,
            id: `custom_${card.id}` // IDの重複を避ける
          },
          count: 10,
          cost: card.cost || 3
        }
      })
      
    } catch (error) {
      console.warn('⚠️ カスタムカードの処理に失敗しました。標準カードのみでゲームを開始します:', error)
    }
    
    return standardSupply
  }

  // 標準サプライ作成（ドミニオン基本セット）
  private createStandardSupply(): DominionSupply {
    return {
      // 財宝カード
      copper: {
        card: {
          id: 'copper',
          name: '銅貨',
          type: 'Treasure',
          cost: 0,
          effects: [{ type: 'gain_coin', value: 1 }],
          description: '+1コイン'
        },
        count: 60, // 無制限に近い
        cost: 0
      },
      silver: {
        card: {
          id: 'silver',
          name: '銀貨',
          type: 'Treasure',
          cost: 3,
          effects: [{ type: 'gain_coin', value: 2 }],
          description: '+2コイン'
        },
        count: 40,
        cost: 3
      },
      gold: {
        card: {
          id: 'gold',
          name: '金貨',
          type: 'Treasure',
          cost: 6,
          effects: [{ type: 'gain_coin', value: 3 }],
          description: '+3コイン'
        },
        count: 30,
        cost: 6
      },

      // 勝利点カード
      estate: {
        card: {
          id: 'estate',
          name: '屋敷',
          type: 'Victory',
          cost: 2,
          victoryPoints: 1,
          description: '1勝利点'
        },
        count: 24, // 2プレイヤーで12枚ずつ
        cost: 2
      },
      duchy: {
        card: {
          id: 'duchy',
          name: '公領',
          type: 'Victory',
          cost: 5,
          victoryPoints: 3,
          description: '3勝利点'
        },
        count: 12, // 2プレイヤーで12枚
        cost: 5
      },
      province: {
        card: {
          id: 'province',
          name: '属州',
          type: 'Victory',
          cost: 8,
          victoryPoints: 6,
          description: '6勝利点'
        },
        count: 12, // 2プレイヤーで12枚
        cost: 8
      },

      // 王国カード（基本的なアクションカード）
      village: {
        card: {
          id: 'village',
          name: '村',
          type: 'Action',
          cost: 3,
          effects: [
            { type: 'draw', value: 1 },
            { type: 'gain_action', value: 2 }
          ],
          description: '+1カード、+2アクション'
        },
        count: 10,
        cost: 3
      },
      market: {
        card: {
          id: 'market',
          name: '市場',
          type: 'Action',
          cost: 5,
          effects: [
            { type: 'draw', value: 1 },
            { type: 'gain_action', value: 1 },
            { type: 'gain_buy', value: 1 },
            { type: 'gain_coin', value: 1 }
          ],
          description: '+1カード、+1アクション、+1購入、+1コイン'
        },
        count: 10,
        cost: 5
      },
      smithy: {
        card: {
          id: 'smithy',
          name: '鍛冶屋',
          type: 'Action',
          cost: 4,
          effects: [{ type: 'draw', value: 3 }],
          description: '+3カード'
        },
        count: 10,
        cost: 4
      },
      laboratory: {
        card: {
          id: 'laboratory',
          name: '研究所',
          type: 'Action',
          cost: 5,
          effects: [
            { type: 'draw', value: 2 },
            { type: 'gain_action', value: 1 }
          ],
          description: '+2カード、+1アクション'
        },
        count: 10,
        cost: 5
      },
      woodcutter: {
        card: {
          id: 'woodcutter',
          name: '木こり',
          type: 'Action',
          cost: 3,
          effects: [
            { type: 'gain_buy', value: 1 },
            { type: 'gain_coin', value: 2 }
          ],
          description: '+1購入、+2コイン'
        },
        count: 10,
        cost: 3
      }
    }
  }

  // プレイヤー初期デッキ作成
  private initializePlayerDecks() {
    if (!this.gameState) return

    this.players.forEach(player => {
      // 初期デッキ: 銅貨7枚、屋敷3枚
      const initialDeck: Card[] = []
      
      // 銅貨7枚
      for (let i = 0; i < 7; i++) {
        initialDeck.push({
          ...this.gameState!.supply.copper.card,
          id: `copper_${player.id}_${i}`
        })
      }
      
      // 屋敷3枚
      for (let i = 0; i < 3; i++) {
        initialDeck.push({
          ...this.gameState!.supply.estate.card,
          id: `estate_${player.id}_${i}`
        })
      }

      // デッキをシャッフル
      player.deck = this.shuffleDeck(initialDeck)
      player.hand = []
      player.discard = []
      player.playArea = []

      console.log(`${player.name}の初期デッキ作成完了: ${player.deck.length}枚`)
    })
  }

  // カードをシャッフル
  private shuffleDeck(cards: Card[]): Card[] {
    const shuffled = [...cards]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // カードをドロー
  private drawCards(player: DominionPlayer, count: number): Card[] {
    const drawnCards: Card[] = []
    
    for (let i = 0; i < count; i++) {
      // デッキが空なら捨て札をシャッフルしてデッキに
      if (player.deck.length === 0 && player.discard.length > 0) {
        player.deck = this.shuffleDeck([...player.discard])
        player.discard = []
        console.log(`${player.name}: 捨て札をシャッフルしてデッキに追加`)
      }
      
      // デッキからカードをドロー
      if (player.deck.length > 0) {
        const card = player.deck.shift()! // 上からドロー
        player.hand.push(card)
        drawnCards.push(card)
      }
    }
    
    if (drawnCards.length > 0) {
      this.addLog(`${player.name}が${drawnCards.length}枚ドロー`)
    }
    
    return drawnCards
  }

  // ゲッター
  get players(): DominionPlayer[] {
    return this.gameState?.players || []
  }

  get currentPlayer(): DominionPlayer {
    if (!this.gameState) throw new Error('ゲームが開始されていません')
    return this.gameState.players[this.gameState.currentPlayerIndex]
  }

  get humanPlayer(): DominionPlayer {
    const human = this.players.find(p => p.isHuman)
    if (!human) throw new Error('人間プレイヤーが見つかりません')
    return human
  }

  get cpuPlayer(): DominionPlayer {
    const cpu = this.players.find(p => !p.isHuman)
    if (!cpu) throw new Error('CPUプレイヤーが見つかりません')
    return cpu
  }

  // ログ追加
  private addLog(action: string, details?: string) {
    if (!this.gameState) return
    
    this.gameState.log.push({
      turn: this.gameState.turn,
      player: this.currentPlayer.name,
      action,
      details,
      timestamp: new Date().toISOString()
    })
  }

  // 状態更新コールバック
  private triggerStateUpdate() {
    if (this.onStateUpdate && this.gameState) {
      this.onStateUpdate(this.gameState)
    }
  }

  // === ゲームアクション ===

  // アクションカードをプレイ
  playActionCard(cardId: string): boolean {
    if (!this.gameState || this.gameState.isGameEnded) return false
    
    const player = this.currentPlayer
    if (this.gameState.phase !== 'action') {
      throw new Error('アクションカードはアクションフェーズでのみプレイできます')
    }
    
    if (player.actions <= 0) {
      throw new Error('アクション回数が残っていません')
    }

    // 手札からカードを探す
    const cardIndex = player.hand.findIndex(card => card.id === cardId)
    if (cardIndex === -1) {
      throw new Error('カードが手札にありません')
    }

    const card = player.hand[cardIndex]
    if (card.type !== 'Action') {
      throw new Error('アクションカードではありません')
    }

    // カードを手札からプレイエリアに移動
    player.hand.splice(cardIndex, 1)
    player.playArea.push(card)

    // アクション回数を消費
    player.actions--

    // カード効果を実行
    this.executeCardEffects(player, card)

    this.addLog(`「${card.name}」をプレイ`, `残りアクション: ${player.actions}`)
    this.triggerStateUpdate()

    return true
  }

  // 財宝カードをプレイ
  playTreasureCard(cardId: string): boolean {
    if (!this.gameState || this.gameState.isGameEnded) return false
    
    const player = this.currentPlayer
    if (this.gameState.phase !== 'buy') {
      throw new Error('財宝カードは購入フェーズでのみプレイできます')
    }

    // 手札からカードを探す
    const cardIndex = player.hand.findIndex(card => card.id === cardId)
    if (cardIndex === -1) {
      throw new Error('カードが手札にありません')
    }

    const card = player.hand[cardIndex]
    if (card.type !== 'Treasure') {
      throw new Error('財宝カードではありません')
    }

    // カードを手札からプレイエリアに移動
    player.hand.splice(cardIndex, 1)
    player.playArea.push(card)

    // 財宝効果を実行（コイン獲得）
    const coinEffect = card.effects?.find(effect => effect.type === 'gain_coin')
    if (coinEffect) {
      player.coins += coinEffect.value
    }

    this.addLog(`「${card.name}」をプレイ`, `+${coinEffect?.value || 0}コイン (合計: ${player.coins})`)
    this.triggerStateUpdate()

    return true
  }

  // カードを購入
  buyCard(cardId: string): boolean {
    if (!this.gameState || this.gameState.isGameEnded) return false
    
    const player = this.currentPlayer
    if (this.gameState.phase !== 'buy') {
      throw new Error('カードの購入は購入フェーズでのみ可能です')
    }

    if (player.buys <= 0) {
      throw new Error('購入回数が残っていません')
    }

    const pile = this.gameState.supply[cardId as keyof DominionSupply]
    if (!pile) {
      throw new Error(`カードが見つかりません: ${cardId}`)
    }

    if (pile.count <= 0) {
      throw new Error('カードの在庫がありません')
    }

    if (pile.cost > player.coins) {
      throw new Error(`コインが不足しています（必要: ${pile.cost}, 所持: ${player.coins}）`)
    }

    // 購入処理
    player.coins -= pile.cost
    player.buys--
    pile.count--

    // カードを獲得（捨て札に追加）
    const acquiredCard = {
      ...pile.card,
      id: `${cardId}_${player.id}_${Date.now()}`
    }
    player.discard.push(acquiredCard)

    this.addLog(`「${pile.card.name}」を購入`, `コイン: ${pile.cost}, 残りコイン: ${player.coins}`)
    this.triggerStateUpdate()

    return true
  }

  // フェーズ移行
  moveToNextPhase(): boolean {
    if (!this.gameState || this.gameState.isGameEnded) return false

    switch (this.gameState.phase) {
      case 'action':
        this.gameState.phase = 'buy'
        this.addLog('購入フェーズに移行')
        break
      
      case 'buy':
        this.gameState.phase = 'cleanup'
        this.performCleanup()
        // クリーンアップ後、即座に次のプレイヤーに交代
        setTimeout(() => {
          this.nextPlayer()
        }, 500) // 短い待機時間でクリーンアップを視覚的に確認
        break
      
      case 'cleanup':
        // 即座に次のプレイヤーに移行
        this.nextPlayer()
        break
    }

    this.triggerStateUpdate()
    return true
  }

  // クリーンアップフェーズ実行
  private performCleanup() {
    if (!this.gameState) return

    const player = this.currentPlayer

    // 手札とプレイエリアのカードを全て捨て札に
    player.discard.push(...player.hand, ...player.playArea)
    player.hand = []
    player.playArea = []

    // 5枚ドロー
    this.drawCards(player, 5)

    // ターン状態リセット
    player.actions = 1
    player.buys = 1
    player.coins = 0
    player.turnsPlayed++

    this.addLog('クリーンアップ完了', '5枚ドロー、ターン状態リセット')
  }

  // 次のプレイヤーに交代
  private nextPlayer() {
    if (!this.gameState) return

    this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + 1) % this.players.length
    
    // 最初のプレイヤーに戻ったらターン数増加
    if (this.gameState.currentPlayerIndex === 0) {
      this.gameState.turn++
    }

    this.gameState.phase = 'action'
    
    this.addLog(`${this.currentPlayer.name}のターン開始`)

    // ゲーム終了チェック
    if (this.checkGameEnd()) {
      this.endGame()
      return
    }

    // 状態更新をトリガー
    this.triggerStateUpdate()

    // CPUのターンなら自動実行のスケジュール（状態更新後に実行される）
    if (!this.currentPlayer.isHuman) {
      console.log(`🤖 ${this.currentPlayer.name}のターンが開始されます`)
      console.log(`現在の状態: フェーズ=${this.gameState.phase}, プレイヤー=${this.currentPlayer.name}`)
      // 状態更新後にCPUターンを実行するため、setTimeoutを使用
      setTimeout(() => {
        console.log(`🤖 CPUターン実行開始...`)
        this.executeCPUTurn()
      }, 1000)
    } else {
      console.log(`👤 ${this.currentPlayer.name}のターンです`)
      console.log(`現在の状態: フェーズ=${this.gameState.phase}, プレイヤー=${this.currentPlayer.name}`)
    }
  }

  // カード効果実行
  private executeCardEffects(player: DominionPlayer, card: Card) {
    if (!card.effects) return

    card.effects.forEach(effect => {
      switch (effect.type) {
        case 'draw':
          this.drawCards(player, effect.value)
          break
        case 'gain_action':
          player.actions += effect.value
          break
        case 'gain_buy':
          player.buys += effect.value
          break
        case 'gain_coin':
          player.coins += effect.value
          break
      }
    })
  }

  // === CPU AI ===

  // CPUターン実行
  private async executeCPUTurn() {
    console.log('🤖 CPUターン実行チェック開始')
    console.log(`ゲーム状態: 終了=${this.gameState?.isGameEnded}, 現在プレイヤー=${this.currentPlayer?.name}, 人間=${this.currentPlayer?.isHuman}`)
    
    if (!this.gameState || this.gameState.isGameEnded) {
      console.log('❌ ゲーム状態が無効またはゲーム終了済み')
      return
    }
    
    // CPUプレイヤーのIDを記録（フェーズ移行中にプレイヤーが変わっても追跡）
    const cpuPlayerId = this.currentPlayer.id
    const cpuPlayerName = this.currentPlayer.name
    
    if (this.currentPlayer.isHuman) {
      console.log('❌ 現在のプレイヤーが人間です - CPUターンをスキップ')
      return
    }

    console.log(`🤖 CPUターン開始: ${cpuPlayerName} (ID: ${cpuPlayerId})`)
    console.log(`現在のフェーズ: ${this.gameState.phase}`)
    
    try {
      // アクションフェーズ
      if (this.gameState.phase === 'action') {
        console.log('🎯 CPUアクションフェーズ実行')
        await this.executeCPUActionPhase()
        
        // 購入フェーズに移行
        console.log('🔄 CPU: action → buy フェーズ移行')
        this.moveToNextPhase()
        await new Promise(resolve => setTimeout(resolve, 800))
      }
      
      // 購入フェーズ（CPUプレイヤーのターン中であることを確認）
      if (this.gameState.phase === 'buy' && this.currentPlayer.id === cpuPlayerId) {
        console.log('💰 CPU購入フェーズ実行')
        await this.executeCPUBuyPhase()
        
        // ターン終了（クリーンアップに移行）
        console.log('🔄 CPU: buy → cleanup フェーズ移行')
        this.moveToNextPhase()
        await new Promise(resolve => setTimeout(resolve, 600))
      }
      
      // クリーンアップフェーズから次のプレイヤーへ（まだCPUのターン中なら）
      if (this.gameState.phase === 'cleanup' && this.currentPlayer.id === cpuPlayerId) {
        console.log('🔄 CPU: cleanup完了 → 次のプレイヤーへ移行')
        this.moveToNextPhase()  // cleanup → next player
        console.log(`🔄 ターン交代完了: ${this.currentPlayer.name}のターンになりました`)
      }
      
      console.log('🤖 CPUターン完了 - プレイヤーターンに戻ります')
      
      // 最終的な状態更新を強制的にトリガー
      this.triggerStateUpdate()
      
    } catch (error) {
      console.error('❌ CPUターンエラー:', error)
      // エラーが発生した場合でもプレイヤーターンに戻す
      try {
        console.log('🔄 エラー発生 - 強制的にプレイヤーターンに戻します')
        // 現在のプレイヤーがまだCPUの場合のみnextPlayerを実行
        if (this.currentPlayer.id === cpuPlayerId) {
          this.nextPlayer()
        }
      } catch (recoveryError) {
        console.error('❌ 復旧にも失敗:', recoveryError)
      }
    }
  }

  // CPUアクションフェーズ
  private async executeCPUActionPhase() {
    const player = this.currentPlayer
    console.log('🎯 CPUアクションフェーズ')

    while (player.actions > 0) {
      const actionCards = player.hand.filter(card => card.type === 'Action')
      if (actionCards.length === 0) break

      // 最も価値の高いアクションカードを選択
      const bestAction = this.chooseBestActionCard(actionCards)
      if (!bestAction) break

      console.log(`🎯 CPU: ${bestAction.name}をプレイ`)
      this.playActionCard(bestAction.id)
      await new Promise(resolve => setTimeout(resolve, 800))
    }
  }

  // CPUの最適アクションカード選択
  private chooseBestActionCard(actionCards: Card[]): Card | null {
    if (actionCards.length === 0) return null

    // 優先順位: カードドロー > アクション追加 > コイン/購入
    const priorities = {
      'smithy': 9,      // +3カード
      'laboratory': 8,  // +2カード、+1アクション
      'village': 7,     // +1カード、+2アクション
      'market': 6,      // +1カード、+1アクション、+1購入、+1コイン
      'woodcutter': 5   // +1購入、+2コイン
    }

    return actionCards.sort((a, b) => {
      const aPriority = priorities[a.id as keyof typeof priorities] || 0
      const bPriority = priorities[b.id as keyof typeof priorities] || 0
      return bPriority - aPriority
    })[0]
  }

  // CPU購入フェーズ
  private async executeCPUBuyPhase() {
    const player = this.currentPlayer
    console.log('💰 CPU購入フェーズ')

    // 全ての財宝カードをプレイ
    const treasureCards = player.hand.filter(card => card.type === 'Treasure')
    for (const treasure of treasureCards) {
      console.log(`💰 CPU: ${treasure.name}をプレイ`)
      this.playTreasureCard(treasure.id)
      await new Promise(resolve => setTimeout(resolve, 400))
    }

    // 戦略的購入
    await this.executeCPUPurchaseStrategy()
  }

  // CPU購入戦略
  private async executeCPUPurchaseStrategy() {
    const player = this.currentPlayer
    const turn = this.gameState!.turn

    while (player.buys > 0 && player.coins > 0) {
      let purchased = false

      // 終盤: 勝利点カード優先
      if (turn >= 8) {
        if (player.coins >= 8 && this.gameState!.supply.province.count > 0) {
          console.log('🏆 CPU: 属州を購入')
          this.buyCard('province')
          purchased = true
        } else if (player.coins >= 5 && this.gameState!.supply.duchy.count > 0) {
          console.log('🏠 CPU: 公領を購入')
          this.buyCard('duchy')
          purchased = true
        } else if (player.coins >= 2 && this.gameState!.supply.estate.count > 0) {
          console.log('🏘️ CPU: 屋敷を購入')
          this.buyCard('estate')
          purchased = true
        }
      }

      // 中盤: 強力カード優先
      if (!purchased && turn >= 4) {
        if (player.coins >= 6 && this.gameState!.supply.gold.count > 0) {
          console.log('💰 CPU: 金貨を購入')
          this.buyCard('gold')
          purchased = true
        } else if (player.coins >= 5 && this.gameState!.supply.market.count > 0) {
          console.log('🏪 CPU: 市場を購入')
          this.buyCard('market')
          purchased = true
        } else if (player.coins >= 5 && this.gameState!.supply.laboratory.count > 0) {
          console.log('🔬 CPU: 研究所を購入')
          this.buyCard('laboratory')
          purchased = true
        } else if (player.coins >= 4 && this.gameState!.supply.smithy.count > 0) {
          console.log('🔨 CPU: 鍛冶屋を購入')
          this.buyCard('smithy')
          purchased = true
        }
      }

      // 序盤: 基本強化
      if (!purchased) {
        if (player.coins >= 3 && this.gameState!.supply.silver.count > 0) {
          console.log('🥈 CPU: 銀貨を購入')
          this.buyCard('silver')
          purchased = true
        } else if (player.coins >= 3 && this.gameState!.supply.village.count > 0) {
          console.log('🏘️ CPU: 村を購入')
          this.buyCard('village')
          purchased = true
        } else if (player.coins >= 3 && this.gameState!.supply.woodcutter.count > 0) {
          console.log('🪓 CPU: 木こりを購入')
          this.buyCard('woodcutter')
          purchased = true
        }
      }

      if (!purchased) break
      await new Promise(resolve => setTimeout(resolve, 600))
    }
  }

  // === ゲーム終了処理 ===

  // ゲーム終了条件チェック
  private checkGameEnd(): boolean {
    if (!this.gameState) return false

    const supply = this.gameState.supply

    // 属州が尽きたら終了
    if (supply.province.count === 0) {
      this.gameState.endReason = '属州が尽きました'
      return true
    }

    // 3つのサプライが尽きたら終了
    const emptyPiles = Object.values(supply).filter(pile => pile.count === 0).length
    if (emptyPiles >= 3) {
      this.gameState.endReason = '3つのサプライが尽きました'
      return true
    }

    return false
  }

  // ゲーム終了
  private endGame() {
    if (!this.gameState) return

    console.log('🏁 ゲーム終了')

    // 最終スコア計算
    this.players.forEach(player => {
      player.totalVictoryPoints = this.calculateVictoryPoints(player)
    })

    // 勝者決定
    const winner = this.players.reduce((winner, player) => 
      player.totalVictoryPoints > winner.totalVictoryPoints ? player : winner
    )

    this.gameState.winner = winner
    this.gameState.isGameEnded = true

    this.addLog('ゲーム終了', `勝者: ${winner.name} (${winner.totalVictoryPoints}点)`)
    this.triggerStateUpdate()
  }

  // 勝利点計算
  private calculateVictoryPoints(player: DominionPlayer): number {
    const allCards = [...player.hand, ...player.deck, ...player.discard]
    return allCards.reduce((total, card) => {
      return total + (card.victoryPoints || 0)
    }, 0)
  }

  // ゲーム状態取得
  getGameState(): DominionGameState | null {
    return this.gameState
  }

  // プレイヤー情報取得
  getPlayer(playerId: string): DominionPlayer | null {
    return this.players.find(p => p.id === playerId) || null
  }

  // 現在のプレイヤーが人間かチェック
  isCurrentPlayerHuman(): boolean {
    return this.currentPlayer?.isHuman || false
  }
}