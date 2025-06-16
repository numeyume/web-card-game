import type { Card } from '@/types'

interface Player {
  id: string
  name: string
  hand: Card[]
  deck: Card[]
  discard: Card[]
  coins: number
  actions: number
  buys: number
  score: number
  isHuman: boolean
}

interface LocalGameState {
  gameId: string
  players: Record<string, Player>
  currentPlayer: string
  turn: number
  phase: 'action' | 'buy' | 'cleanup'
  supply: Record<string, any>
  log: Array<{ message: string; timestamp: string; turn: number }>
  winner?: Player
  endReason?: string
}

export class LocalCPUEngine {
  private gameState: LocalGameState | null = null
  private humanPlayerId = 'human_player'
  private cpuPlayerId = 'cpu_player'
  private onStateUpdate?: (gameState: LocalGameState) => void

  constructor(onStateUpdate?: (gameState: LocalGameState) => void) {
    this.onStateUpdate = onStateUpdate
  }

  // ゲーム開始
  startGame(difficulty: string = 'normal'): LocalGameState {
    console.log('🎯 ローカルCPU対戦開始:', difficulty)
    console.log('🎯 プレイヤーID設定:', {
      humanPlayerId: this.humanPlayerId,
      cpuPlayerId: this.cpuPlayerId
    })

    this.gameState = {
      gameId: `local_cpu_${Date.now()}`,
      players: {
        [this.humanPlayerId]: {
          id: this.humanPlayerId,
          name: 'プレイヤー',
          hand: [],
          deck: [],
          discard: [],
          coins: 0,
          actions: 1,
          buys: 1,
          score: 0,
          isHuman: true
        },
        [this.cpuPlayerId]: {
          id: this.cpuPlayerId,
          name: 'CPU',
          hand: [],
          deck: [],
          discard: [],
          coins: 0,
          actions: 1,
          buys: 1,
          score: 0,
          isHuman: false
        }
      },
      currentPlayer: this.humanPlayerId, // IDで管理
      turn: 1,
      phase: 'action',
      supply: this.createBasicSupply(),
      log: []
    }

    console.log('🎯 ゲーム状態初期化完了:', {
      currentPlayer: this.gameState.currentPlayer,
      playerKeys: Object.keys(this.gameState.players),
      isHumanTurn: this.gameState.currentPlayer === this.humanPlayerId
    })

    // 各プレイヤーの初期デッキを作成
    this.initializePlayerDecks()
    
    // 状態更新コールバック実行
    this.triggerStateUpdate()
    
    return this.gameState
  }

  // 基本サプライ作成
  private createBasicSupply() {
    return {
      copper: {
        id: 'copper',
        name: '銅貨',
        cost: 0,
        type: 'Treasure',
        effects: [{ type: 'gain_coin', value: 1 }],
        count: 30
      },
      silver: {
        id: 'silver',
        name: '銀貨',
        cost: 3,
        type: 'Treasure',
        effects: [{ type: 'gain_coin', value: 2 }],
        count: 20
      },
      gold: {
        id: 'gold',
        name: '金貨',
        cost: 6,
        type: 'Treasure',
        effects: [{ type: 'gain_coin', value: 3 }],
        count: 15
      },
      estate: {
        id: 'estate',
        name: '屋敷',
        cost: 2,
        type: 'Victory',
        victoryPoints: 1,
        count: 12
      },
      duchy: {
        id: 'duchy',
        name: '公領',
        cost: 5,
        type: 'Victory',
        victoryPoints: 3,
        count: 8
      },
      province: {
        id: 'province',
        name: '属州',
        cost: 8,
        type: 'Victory',
        victoryPoints: 6,
        count: 6
      },
      village: {
        id: 'village',
        name: '村',
        cost: 3,
        type: 'Action',
        effects: [
          { type: 'draw', value: 1 },
          { type: 'gain_action', value: 2 }
        ],
        count: 10
      },
      market: {
        id: 'market',
        name: '市場',
        cost: 5,
        type: 'Action',
        effects: [
          { type: 'draw', value: 1 },
          { type: 'gain_action', value: 1 },
          { type: 'gain_buy', value: 1 },
          { type: 'gain_coin', value: 1 }
        ],
        count: 10
      },
      smithy: {
        id: 'smithy',
        name: '鍛冶屋',
        cost: 4,
        type: 'Action',
        effects: [{ type: 'draw', value: 3 }],
        count: 10
      }
    }
  }

  // プレイヤーの初期デッキ設定
  private initializePlayerDecks() {
    if (!this.gameState) return

    Object.values(this.gameState.players).forEach(player => {
      // 初期デッキ: 銅貨7枚、屋敷3枚
      const initialDeck = [
        ...Array(7).fill(null).map((_, i) => ({ 
          ...this.gameState!.supply.copper, 
          id: `copper_${player.id}_${i}` 
        })),
        ...Array(3).fill(null).map((_, i) => ({ 
          ...this.gameState!.supply.estate, 
          id: `estate_${player.id}_${i}` 
        }))
      ]
      
      player.deck = this.shuffleDeck(initialDeck)
      player.hand = []
      player.discard = []
      
      // 初期手札を5枚ドロー
      this.drawCards(player.id, 5)
    })
  }

  // デッキシャッフル
  private shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // カードドロー
  private drawCards(playerId: string, count: number): Card[] {
    if (!this.gameState) {
      console.error('❌ drawCards: ゲーム状態がnull')
      return []
    }
    
    const player = this.gameState.players[playerId]
    if (!player) {
      console.error('❌ drawCards: プレイヤーが見つからない:', playerId)
      return []
    }
    
    const drawnCards: Card[] = []
    
    for (let i = 0; i < count; i++) {
      if (player.deck.length === 0 && player.discard.length > 0) {
        // デッキが空の場合、捨て札をシャッフルしてデッキに
        player.deck = this.shuffleDeck([...player.discard])
        player.discard = []
      }
      
      if (player.deck.length > 0) {
        const card = player.deck.pop()!
        player.hand.push(card)
        drawnCards.push(card)
      }
    }
    
    this.addToLog(`${player.name}が${drawnCards.length}枚ドロー`)
    return drawnCards
  }

  // カードプレイ（ドミニオンルール）
  playCard(playerId: string, cardId: string): Card {
    if (!this.gameState) throw new Error('ゲームが開始されていません')
    
    const player = this.gameState.players[playerId]
    if (!player) {
      throw new Error(`プレイヤーが見つかりません: ${playerId}`)
    }
    
    if (this.gameState.phase !== 'action') {
      throw new Error('アクションカードはアクションフェーズでのみプレイできます')
    }
    
    if (player.actions <= 0) {
      throw new Error('アクション回数が残っていません')
    }
    
    if (!player.hand || !Array.isArray(player.hand)) {
      throw new Error(`プレイヤーの手札が無効です: ${playerId}`)
    }
    
    const cardIndex = player.hand.findIndex(card => card && card.id === cardId)
    if (cardIndex === -1) {
      throw new Error('カードが手札にありません')
    }
    
    const card = player.hand[cardIndex]
    if (card.type !== 'Action') {
      throw new Error('アクションカードではありません')
    }
    
    // カードを手札から除去
    player.hand.splice(cardIndex, 1)
    
    // アクション回数を消費
    player.actions--
    
    // カード効果を実行
    this.executeCardEffects(playerId, card)
    
    // カードを捨て札に
    player.discard.push(card)
    
    this.addToLog(`${player.name}が「${card.name}」をプレイ（残りアクション: ${player.actions}）`)
    
    // 状態更新コールバック実行
    this.triggerStateUpdate()
    
    return card
  }

  // カード効果実行
  private executeCardEffects(playerId: string, card: Card) {
    if (!this.gameState) return
    
    const player = this.gameState.players[playerId]
    
    if (card.effects) {
      card.effects.forEach(effect => {
        switch (effect.type) {
          case 'draw':
            this.drawCards(playerId, effect.value)
            break
          case 'gain_coin':
            player.coins += effect.value
            break
          case 'gain_action':
            player.actions += effect.value
            break
          case 'gain_buy':
            player.buys += effect.value
            break
        }
      })
    }
  }

  // カード購入（ドミニオンルール）
  buyCard(playerId: string, cardId: string): Card {
    if (!this.gameState) throw new Error('ゲームが開始されていません')
    
    const player = this.gameState.players[playerId]
    if (!player) {
      throw new Error(`プレイヤーが見つかりません: ${playerId}`)
    }
    
    if (this.gameState.phase !== 'buy') {
      throw new Error('カードの購入は購入フェーズでのみ可能です')
    }
    
    if (player.buys <= 0) {
      throw new Error('購入回数が残っていません')
    }
    
    const card = this.gameState.supply[cardId]
    if (!card) {
      throw new Error(`カードが見つかりません: ${cardId}`)
    }
    
    if (card.count <= 0) {
      throw new Error('カードの在庫がありません')
    }
    
    if (card.cost > player.coins) {
      throw new Error(`コインが不足しています（必要: ${card.cost}, 所持: ${player.coins}）`)
    }
    
    // 購入処理
    player.coins -= card.cost
    player.buys--
    card.count--
    
    // カードを獲得
    const acquiredCard = { 
      ...card, 
      id: `${cardId}_${player.id}_${Date.now()}` 
    }
    player.discard.push(acquiredCard)
    
    this.addToLog(`${player.name}が「${card.name}」を購入（残り購入: ${player.buys}, 残りコイン: ${player.coins}）`)
    
    // 状態更新コールバック実行
    this.triggerStateUpdate()
    
    return acquiredCard
  }

  // フェーズ移行（ドミニオンルール）
  moveToPhase(phase: 'action' | 'buy' | 'cleanup') {
    if (!this.gameState) return
    
    this.gameState.phase = phase
    this.addToLog(`フェーズを${phase === 'action' ? 'アクション' : phase === 'buy' ? '購入' : 'クリーンアップ'}に移行`)
    this.triggerStateUpdate()
  }

  // ターン終了
  endTurn(): boolean {
    console.log('🔄 LocalCPUEngine.endTurn() 開始')
    
    if (!this.gameState) {
      console.error('❌ gameStateがnullです')
      return false
    }
    
    const currentPlayer = this.gameState.players[this.gameState.currentPlayer]
    console.log(`🔄 ${currentPlayer.name}のターン終了処理開始`, {
      currentPlayerId: this.gameState.currentPlayer,
      phase: this.gameState.phase,
      turn: this.gameState.turn
    })
    
    // 手札を全て捨て札に
    currentPlayer.discard.push(...currentPlayer.hand)
    currentPlayer.hand = []
    
    // 新しい手札を5枚ドロー
    this.drawCards(currentPlayer.id, 5)
    
    // アクション、購入、コインをリセット
    currentPlayer.actions = 1
    currentPlayer.buys = 1
    currentPlayer.coins = 0
    
    // 次のプレイヤーに交代
    this.switchToNextPlayer()
    
    this.addToLog(`${currentPlayer.name}のターン終了`)
    
    console.log(`✅ ターン終了: 次は${this.gameState.players[this.gameState.currentPlayer].name}`, {
      newCurrentPlayer: this.gameState.currentPlayer,
      newPhase: this.gameState.phase,
      newTurn: this.gameState.turn,
      isCPUTurn: this.gameState.currentPlayer === this.cpuPlayerId
    })
    
    // 状態更新コールバック実行
    this.triggerStateUpdate()
    
    // ゲーム終了チェック
    const gameEnded = this.checkGameEnd()
    if (gameEnded) {
      console.log('🏁 ゲーム終了!')
      return true
    }
    
    // CPUのターンなら自動実行（シンプルで確実な判定）
    const isCPUTurn = this.gameState.currentPlayer === this.cpuPlayerId
    
    console.log('🤖 CPUターン判定:', {
      currentPlayer: this.gameState.currentPlayer,
      cpuPlayerId: this.cpuPlayerId,
      humanPlayerId: this.humanPlayerId,
      isCPUTurn,
      exactMatch: this.gameState.currentPlayer === this.cpuPlayerId
    })
    
    if (isCPUTurn) {
      console.log('🤖 CPUターンを開始します (1000ms後)')
      setTimeout(async () => {
        console.log('🤖 CPUターン実行開始 - タイムアウト発火')
        try {
          await this.executeCPUTurn()
        } catch (error) {
          console.error('❌ CPUターン実行エラー:', error)
          // エラー時はプレイヤーのターンに戻す
          this.gameState!.currentPlayer = this.humanPlayerId
          this.gameState!.phase = 'action'
          this.triggerStateUpdate()
        }
      }, 1000)
    } else {
      console.log('👤 人間プレイヤーのターンなので、CPUターンはスキップ')
    }
    
    return false
  }

  // 次のプレイヤーに交代（ドミニオン正式ルール）
  private switchToNextPlayer() {
    if (!this.gameState) {
      console.error('❌ switchToNextPlayer: gameStateがnull')
      return
    }
    
    // シンプルで確実な方法：人間→CPU、CPU→人間
    if (this.gameState.currentPlayer === this.humanPlayerId) {
      // 人間プレイヤーからCPUプレイヤーへ
      this.gameState.currentPlayer = this.cpuPlayerId
      console.log('🔄 人間 → CPU に交代')
    } else {
      // CPUプレイヤーから人間プレイヤーへ
      this.gameState.currentPlayer = this.humanPlayerId
      this.gameState.turn++
      console.log('🔄 CPU → 人間 に交代, ターン:', this.gameState.turn)
    }
    
    this.gameState.phase = 'action'
    
    console.log('✅ プレイヤー交代完了:', {
      newCurrentPlayer: this.gameState.currentPlayer,
      isHumanTurn: this.gameState.currentPlayer === this.humanPlayerId,
      isCPUTurn: this.gameState.currentPlayer === this.cpuPlayerId,
      newPhase: this.gameState.phase,
      turn: this.gameState.turn
    })
  }

  // 財宝カードをプレイ（ドミニオンルール）
  playTreasureCard(playerId: string, cardId: string): Card {
    if (!this.gameState) throw new Error('ゲームが開始されていません')
    
    const player = this.gameState.players[playerId]
    if (!player) {
      throw new Error(`プレイヤーが見つかりません: ${playerId}`)
    }
    
    if (this.gameState.phase !== 'buy') {
      throw new Error('財宝カードは購入フェーズでのみプレイできます')
    }
    
    console.log('💰 財宝カードプレイ処理:', {
      playerId,
      cardId,
      handSize: player.hand.length,
      currentCoins: player.coins
    })
    
    const cardIndex = player.hand.findIndex(card => card && card.id === cardId)
    if (cardIndex === -1) {
      console.error('❌ カードが手札にない:', {
        cardId,
        hand: player.hand.map(c => ({ id: c.id, name: c.name }))
      })
      throw new Error('カードが手札にありません')
    }
    
    const card = player.hand[cardIndex]
    if (card.type !== 'Treasure') {
      throw new Error('財宝カードではありません')
    }
    
    // カードを手札から除去
    player.hand.splice(cardIndex, 1)
    
    // 財宝カード効果を実行（コイン追加）
    const coinEffect = card.effects?.find(effect => effect.type === 'gain_coin')
    const coinsGained = coinEffect?.value || 0
    const previousCoins = player.coins
    player.coins += coinsGained
    
    console.log('💰 財宝カード効果適用:', {
      cardName: card.name,
      coinsGained,
      previousCoins,
      newCoins: player.coins,
      newHandSize: player.hand.length
    })
    
    this.addToLog(`${player.name}が「${card.name}」をプレイして${coinsGained}コイン獲得 (合計: ${player.coins}コイン)`)
    this.triggerStateUpdate()
    
    return card
  }

  // CPUターン実行（改良版ドミニオンAI）
  private async executeCPUTurn() {
    console.log('🤖 executeCPUTurn() 開始')
    
    try {
      if (!this.gameState) {
        console.error('❌ CPUターン実行エラー: ゲーム状態がnull')
        return
      }
      
      console.log('🤖 ゲーム状態確認OK', {
        currentPlayer: this.gameState.currentPlayer,
        expectedCPU: this.cpuPlayerId,
        isCPUTurn: this.gameState.currentPlayer === this.cpuPlayerId
      })
      
      const cpuPlayer = this.gameState.players[this.cpuPlayerId]
      if (!cpuPlayer) {
        console.error('❌ CPUターン実行エラー: CPUプレイヤーが見つからない')
        console.log('利用可能なプレイヤー:', Object.keys(this.gameState.players))
        return
      }
      
      console.log('🤖 CPUのターン開始', {
        cpuPlayerId: this.cpuPlayerId,
        hand: cpuPlayer.hand.length,
        actions: cpuPlayer.actions,
        coins: cpuPlayer.coins,
        buys: cpuPlayer.buys,
        phase: this.gameState.phase,
        currentPlayer: this.gameState.currentPlayer
      })
      
      this.addToLog('🤖 CPUがターンを開始しました')
      console.log('🤖 STEP 1: ログ追加完了')
      
      await new Promise(resolve => setTimeout(resolve, 500)) // 視覚的な待機
      console.log('🤖 STEP 2: 視覚的待機完了')
    
      // === アクションフェーズ ===
      console.log('🎯 CPUアクションフェーズ開始')
      console.log('🤖 STEP 3: アクションフェーズ準備完了')
      
      const actionCards = cpuPlayer.hand.filter(card => card && card.type === 'Action')
      console.log('CPUの手札アクションカード:', actionCards.map(c => c.name))
      console.log('🤖 STEP 4: アクションカード抽出完了, 件数:', actionCards.length)
      
      for (const card of actionCards) {
        if (cpuPlayer.actions > 0 && card && card.id) {
          try {
            console.log(`🎯 CPU: ${card.name}をプレイ (残りアクション: ${cpuPlayer.actions})`)
            this.playCard(this.cpuPlayerId, card.id)
            await new Promise(resolve => setTimeout(resolve, 800)) // アクション間の待機
          } catch (error) {
            console.error(`❌ CPUアクションエラー (${card.name}):`, error)
          }
        }
      }
      
      // 購入フェーズに移行
      console.log('💰 CPUが購入フェーズに移行')
      this.moveToPhase('buy')
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // === 購入フェーズ ===
      console.log('💰 CPU購入フェーズ開始')
      const treasureCards = cpuPlayer.hand.filter(card => card && card.type === 'Treasure')
      console.log('CPUの手札財宝カード:', treasureCards.map(c => c.name))
      
      // 財宝カードを全てプレイ
      for (const card of treasureCards) {
        if (card && card.id) {
          try {
            console.log(`💰 CPU: ${card.name}をプレイ`)
            this.playTreasureCard(this.cpuPlayerId, card.id)
            await new Promise(resolve => setTimeout(resolve, 400)) // 財宝間の待機
          } catch (error) {
            console.error(`❌ CPU財宝エラー (${card.name}):`, error)
          }
        }
      }
      
      // 戦略的購入判断
      console.log(`💳 CPU購入判断 (コイン: ${cpuPlayer.coins}, 購入: ${cpuPlayer.buys})`)
      await this.executeCPUPurchaseStrategy()
      
      // CPUターン終了処理（人間プレイヤーのターンに戻す）
      console.log('✅ CPUターン終了処理 - 人間プレイヤーのターンへ')
      this.addToLog('🤖 CPUがターンを終了します')
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // CPUのクリーンアップ処理（endTurnのロジックを直接実行）
      const cpuPlayerForCleanup = this.gameState!.players[this.cpuPlayerId]
      
      // 手札を全て捨て札に
      cpuPlayerForCleanup.discard.push(...cpuPlayerForCleanup.hand)
      cpuPlayerForCleanup.hand = []
      
      // 新しい手札を5枚ドロー
      this.drawCards(this.cpuPlayerId, 5)
      
      // アクション、購入、コインをリセット
      cpuPlayerForCleanup.actions = 1
      cpuPlayerForCleanup.buys = 1
      cpuPlayerForCleanup.coins = 0
      
      // 人間プレイヤーのターンに戻す
      this.gameState!.currentPlayer = this.humanPlayerId
      this.gameState!.phase = 'action'
      this.gameState!.turn++
      
      this.addToLog('👤 プレイヤーのターンです')
      
      // 状態更新コールバック実行
      this.triggerStateUpdate()
      
    } catch (error) {
      console.error('❌ CPUターン実行中にエラーが発生:', error)
      this.addToLog('⚠️ CPUターンでエラーが発生しました')
      // エラー時はターンを強制終了
      try {
        this.endTurn()
      } catch (endTurnError) {
        console.error('❌ ターン終了時にもエラー:', endTurnError)
      }
    }
  }

  // CPU購入戦略（ドミニオン基本戦略）
  private async executeCPUPurchaseStrategy() {
    if (!this.gameState) return
    
    const cpuPlayer = this.gameState.players[this.cpuPlayerId]
    const currentTurn = this.gameState.turn
    
    while (cpuPlayer.buys > 0 && cpuPlayer.coins > 0) {
      let purchased = false
      
      // 戦略1: 終盤は勝利点カード優先
      if (currentTurn >= 8) {
        if (cpuPlayer.coins >= 8 && this.gameState.supply.province.count > 0) {
          console.log('🏆 CPU: 属州を購入 (終盤戦略)')
          this.buyCard(this.cpuPlayerId, 'province')
          purchased = true
        } else if (cpuPlayer.coins >= 5 && this.gameState.supply.duchy.count > 0) {
          console.log('🏠 CPU: 公領を購入 (終盤戦略)')
          this.buyCard(this.cpuPlayerId, 'duchy')
          purchased = true
        } else if (cpuPlayer.coins >= 2 && this.gameState.supply.estate.count > 0) {
          console.log('🏘️ CPU: 屋敷を購入 (終盤戦略)')
          this.buyCard(this.cpuPlayerId, 'estate')
          purchased = true
        }
      }
      
      // 戦略2: 中盤は強力カード優先
      if (!purchased && currentTurn >= 4) {
        if (cpuPlayer.coins >= 6 && this.gameState.supply.gold.count > 0) {
          console.log('💰 CPU: 金貨を購入 (中盤戦略)')
          this.buyCard(this.cpuPlayerId, 'gold')
          purchased = true
        } else if (cpuPlayer.coins >= 5 && this.gameState.supply.market.count > 0) {
          console.log('🏪 CPU: 市場を購入 (中盤戦略)')
          this.buyCard(this.cpuPlayerId, 'market')
          purchased = true
        } else if (cpuPlayer.coins >= 4 && this.gameState.supply.smithy.count > 0) {
          console.log('🔨 CPU: 鍛冶屋を購入 (中盤戦略)')
          this.buyCard(this.cpuPlayerId, 'smithy')
          purchased = true
        }
      }
      
      // 戦略3: 序盤は基本強化
      if (!purchased) {
        if (cpuPlayer.coins >= 3 && this.gameState.supply.silver.count > 0) {
          console.log('🥈 CPU: 銀貨を購入 (序盤戦略)')
          this.buyCard(this.cpuPlayerId, 'silver')
          purchased = true
        } else if (cpuPlayer.coins >= 3 && this.gameState.supply.village.count > 0) {
          console.log('🏘️ CPU: 村を購入 (序盤戦略)')
          this.buyCard(this.cpuPlayerId, 'village')
          purchased = true
        }
      }
      
      if (!purchased) {
        console.log('💭 CPU: 購入可能なカードがありません')
        break
      }
      
      await new Promise(resolve => setTimeout(resolve, 600)) // 購入間の待機
    }
  }

  // ゲーム終了チェック
  private checkGameEnd(): boolean {
    if (!this.gameState) return false
    
    const supply = this.gameState.supply
    
    // 属州が尽きたら終了
    if (supply.province.count === 0) {
      this.endGame('属州が尽きました')
      return true
    }
    
    // 3つのサプライが尽きたら終了
    const emptySupplies = Object.values(supply).filter(card => card.count === 0).length
    if (emptySupplies >= 3) {
      this.endGame('3つのサプライが尽きました')
      return true
    }
    
    return false
  }

  // ゲーム終了
  private endGame(reason: string) {
    if (!this.gameState) return
    
    // 最終スコア計算
    Object.values(this.gameState.players).forEach(player => {
      player.score = this.calculateFinalScore(player)
    })
    
    const winner = Object.values(this.gameState.players)
      .reduce((winner, player) => 
        player.score > winner.score ? player : winner
      )
    
    this.gameState.winner = winner
    this.gameState.endReason = reason
    
    this.addToLog(`ゲーム終了: ${reason}`)
    this.addToLog(`勝者: ${winner.name} (${winner.score}点)`)
  }

  // 最終スコア計算
  private calculateFinalScore(player: Player): number {
    const allCards = [...player.hand, ...player.deck, ...player.discard]
    let score = 0
    
    allCards.forEach(card => {
      if ((card as any).victoryPoints) {
        score += (card as any).victoryPoints
      }
    })
    
    return score
  }

  // ログ追加
  private addToLog(message: string) {
    if (!this.gameState) return
    
    this.gameState.log.push({
      message,
      timestamp: new Date().toISOString(),
      turn: this.gameState.turn
    })
  }

  // ゲーム状態取得
  getGameState(): LocalGameState | null {
    return this.gameState
  }

  // プレイヤー手札取得
  getPlayerHand(playerId: string): Card[] {
    return this.gameState?.players[playerId]?.hand || []
  }

  // 人間プレイヤーIDを取得
  getHumanPlayerId(): string {
    return this.humanPlayerId
  }

  // CPUプレイヤーIDを取得
  getCPUPlayerId(): string {
    return this.cpuPlayerId
  }

  // 状態更新コールバック実行
  private triggerStateUpdate() {
    try {
      if (this.onStateUpdate && this.gameState) {
        this.onStateUpdate(this.gameState)
      }
    } catch (error) {
      console.error('❌ 状態更新コールバックでエラー:', error)
    }
  }
}