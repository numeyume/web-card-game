/**
 * Social Engine - ソーシャル機能強化システム
 * ギルド、トーナメント、フレンド機能によるコミュニティ形成
 */

export class SocialEngine {
  constructor() {
    this.guilds = new Map(); // guildId -> guild data
    this.tournaments = new Map(); // tournamentId -> tournament data
    this.friendships = new Map(); // playerId -> friend list
    this.playerSocialProfiles = new Map(); // playerId -> social profile
    this.chatChannels = new Map(); // channelId -> chat data
    this.leaderboards = this.initializeLeaderboards();
  }

  /**
   * ギルドシステム初期化
   */
  initializeGuildSystem() {
    return {
      maxMembers: {
        bronze: 10,
        silver: 25,
        gold: 50,
        platinum: 100
      },
      guildLevels: this.generateGuildLevels(),
      guildPerks: this.initializeGuildPerks(),
      guildActivities: this.initializeGuildActivities()
    };
  }

  /**
   * ギルドレベル生成
   */
  generateGuildLevels() {
    const levels = [];
    for (let level = 1; level <= 50; level++) {
      levels.push({
        level,
        requiredExperience: level * 1000 + Math.pow(level, 2) * 100,
        perks: this.getGuildLevelPerks(level),
        rewards: this.getGuildLevelRewards(level)
      });
    }
    return levels;
  }

  /**
   * ギルド特典初期化
   */
  initializeGuildPerks() {
    return {
      experienceBonus: {
        bronze: 1.05,
        silver: 1.1,
        gold: 1.15,
        platinum: 1.2
      },
      dailyBonuses: {
        bronze: { coins: 10, cardPacks: 0 },
        silver: { coins: 25, cardPacks: 1 },
        gold: { coins: 50, cardPacks: 2 },
        platinum: { coins: 100, cardPacks: 3 }
      },
      exclusiveFeatures: {
        bronze: ['guild_chat'],
        silver: ['guild_chat', 'shared_library'],
        gold: ['guild_chat', 'shared_library', 'guild_tournaments'],
        platinum: ['guild_chat', 'shared_library', 'guild_tournaments', 'custom_events']
      }
    };
  }

  /**
   * ギルド活動初期化
   */
  initializeGuildActivities() {
    return [
      {
        id: 'weekly_challenge',
        name: '週間チャレンジ',
        description: 'ギルドメンバーで協力して目標を達成',
        type: 'cooperative',
        duration: 7 * 24 * 60 * 60 * 1000, // 7日
        objectives: [
          { type: 'collective_wins', target: 50, reward: 'guild_exp:500' },
          { type: 'cards_created', target: 25, reward: 'guild_coins:1000' },
          { type: 'votes_given', target: 100, reward: 'card_packs:10' }
        ]
      },
      {
        id: 'guild_tournament',
        name: 'ギルドトーナメント',
        description: 'ギルド内でのトーナメント戦',
        type: 'competitive',
        duration: 3 * 24 * 60 * 60 * 1000, // 3日
        rewards: {
          winner: { title: 'Guild Champion', guild_coins: 500, exclusive_card: 1 },
          top3: { guild_coins: 200, card_packs: 3 },
          participation: { guild_coins: 50, card_packs: 1 }
        }
      },
      {
        id: 'card_exhibition',
        name: 'カード展示会',
        description: 'ギルドメンバーの作品を展示・投票',
        type: 'creative',
        duration: 5 * 24 * 60 * 60 * 1000, // 5日
        phases: ['submission', 'voting', 'results'],
        rewards: {
          mostVoted: { title: 'Popular Creator', guild_coins: 300 },
          mostInnovative: { title: 'Innovator', guild_coins: 300 },
          participation: { guild_coins: 25 }
        }
      }
    ];
  }

  /**
   * リーダーボード初期化
   */
  initializeLeaderboards() {
    return {
      global: {
        name: 'グローバルランキング',
        type: 'experience',
        scope: 'global',
        updateInterval: 60 * 60 * 1000, // 1時間
        rewards: {
          daily: { top10: { title: 'Daily Elite', card_packs: 2 } },
          weekly: { top100: { title: 'Weekly Legend', exclusive_cosmetic: 1 } },
          monthly: { top1000: { title: 'Monthly Master', special_card: 1 } }
        }
      },
      seasonal: {
        name: 'シーズンランキング',
        type: 'seasonal_points',
        scope: 'seasonal',
        updateInterval: 24 * 60 * 60 * 1000, // 24時間
        rewards: {
          season_end: {
            top1: { title: 'Season Champion', legendary_cosmetics: 5, exclusive_cards: 10 },
            top10: { title: 'Season Master', rare_cosmetics: 3, exclusive_cards: 5 },
            top100: { title: 'Season Expert', common_cosmetics: 2, exclusive_cards: 2 }
          }
        }
      },
      guild: {
        name: 'ギルドランキング',
        type: 'guild_power',
        scope: 'guild',
        updateInterval: 6 * 60 * 60 * 1000, // 6時間
        rewards: {
          weekly: {
            top1: { guild_level_boost: 2, member_rewards: { card_packs: 5 } },
            top10: { guild_level_boost: 1, member_rewards: { card_packs: 3 } }
          }
        }
      },
      creative: {
        name: 'クリエイターランキング',
        type: 'card_popularity',
        scope: 'global',
        updateInterval: 12 * 60 * 60 * 1000, // 12時間
        rewards: {
          monthly: {
            top1: { title: 'Master Creator', creation_tools: 1 },
            top25: { title: 'Expert Creator', creation_boost: 3 },
            top100: { title: 'Creative Contributor', inspiration_tokens: 5 }
          }
        }
      }
    };
  }

  /**
   * ギルド作成
   */
  createGuild(founderId, guildData) {
    const guildId = `guild_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const guild = {
      id: guildId,
      name: guildData.name,
      description: guildData.description || '',
      tag: guildData.tag || '',
      founder: founderId,
      createdAt: new Date(),
      
      // ギルド状態
      level: 1,
      experience: 0,
      tier: 'bronze',
      power: 0,
      
      // メンバー管理
      members: new Map([[founderId, {
        playerId: founderId,
        role: 'leader',
        joinedAt: new Date(),
        contributions: {
          experience: 0,
          coins: 0,
          activities: 0
        },
        permissions: ['all']
      }]]),
      
      memberLimit: 10,
      
      // ギルド設定
      settings: {
        privacy: guildData.privacy || 'public', // public, invite_only, private
        language: guildData.language || 'ja',
        timezone: guildData.timezone || 'Asia/Tokyo',
        autoAccept: guildData.autoAccept || false,
        minLevel: guildData.minLevel || 1,
        requireApplication: guildData.requireApplication || false
      },
      
      // ギルド統計
      stats: {
        totalGamesPlayed: 0,
        totalWins: 0,
        totalCardsCreated: 0,
        totalVotesGiven: 0,
        activitiesCompleted: 0,
        tournamentsWon: 0,
        averageLevel: 1,
        totalContributions: 0
      },
      
      // ギルド活動
      currentActivities: [],
      completedActivities: [],
      activeEvents: [],
      
      // コミュニケーション
      chatChannels: {
        general: this.createChatChannel('general', 'General Discussion'),
        announcements: this.createChatChannel('announcements', 'Guild Announcements')
      },
      
      // ギルド資源
      treasury: {
        coins: 0,
        materials: {},
        sharedLibrary: []
      },
      
      // ランキング
      rankings: {
        global: null,
        regional: null,
        category: null
      }
    };

    this.guilds.set(guildId, guild);
    
    // プレイヤーのソーシャルプロファイルにギルド情報追加
    this.updatePlayerSocialProfile(founderId, { guildId, guildRole: 'leader' });

    return guild;
  }

  /**
   * ギルド参加
   */
  joinGuild(playerId, guildId, applicationMessage = '') {
    const guild = this.guilds.get(guildId);
    if (!guild) {
      return { error: 'Guild not found' };
    }

    // メンバー数制限チェック
    if (guild.members.size >= guild.memberLimit) {
      return { error: 'Guild is full' };
    }

    // 既存メンバーチェック
    if (guild.members.has(playerId)) {
      return { error: 'Already a member' };
    }

    // プレイヤーの既存ギルドチェック
    const playerProfile = this.playerSocialProfiles.get(playerId);
    if (playerProfile?.guildId) {
      return { error: 'Player already in a guild' };
    }

    // レベル要件チェック
    const playerLevel = this.getPlayerLevel(playerId);
    if (playerLevel < guild.settings.minLevel) {
      return { error: 'Level requirement not met' };
    }

    // 自動受け入れまたは招待制の場合
    if (guild.settings.autoAccept || !guild.settings.requireApplication) {
      // 即座に参加
      guild.members.set(playerId, {
        playerId,
        role: 'member',
        joinedAt: new Date(),
        contributions: {
          experience: 0,
          coins: 0,
          activities: 0
        },
        permissions: ['chat', 'activities']
      });

      this.updatePlayerSocialProfile(playerId, { guildId, guildRole: 'member' });
      this.updateGuildStats(guildId);

      return { success: true, status: 'joined' };
    } else {
      // 申請が必要
      return this.createGuildApplication(playerId, guildId, applicationMessage);
    }
  }

  /**
   * トーナメント作成
   */
  createTournament(organizerId, tournamentData) {
    const tournamentId = `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const tournament = {
      id: tournamentId,
      name: tournamentData.name,
      description: tournamentData.description || '',
      organizer: organizerId,
      createdAt: new Date(),
      
      // トーナメント設定
      format: tournamentData.format || 'single_elimination', // single_elimination, double_elimination, round_robin, swiss
      maxParticipants: tournamentData.maxParticipants || 16,
      entryFee: tournamentData.entryFee || 0,
      entryRequirements: tournamentData.entryRequirements || {},
      
      // スケジュール
      registrationStart: new Date(tournamentData.registrationStart),
      registrationEnd: new Date(tournamentData.registrationEnd),
      tournamentStart: new Date(tournamentData.tournamentStart),
      estimatedEnd: new Date(tournamentData.estimatedEnd),
      
      // 参加者管理
      participants: new Map(),
      waitlist: [],
      brackets: null,
      
      // ゲーム設定
      gameSettings: {
        timeLimit: tournamentData.timeLimit || 30, // 分
        maxTurns: tournamentData.maxTurns || 50,
        customRules: tournamentData.customRules || [],
        allowCustomCards: tournamentData.allowCustomCards || true
      },
      
      // 報酬設定
      prizePool: this.calculatePrizePool(tournamentData),
      
      // トーナメント状態
      status: 'registration', // registration, ongoing, completed, cancelled
      currentRound: 0,
      totalRounds: 0,
      
      // 試合データ
      matches: [],
      results: {
        winner: null,
        finalists: [],
        standings: []
      },
      
      // 統計
      stats: {
        totalMatches: 0,
        averageGameDuration: 0,
        mostUsedCards: [],
        creativeHighlights: []
      }
    };

    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  /**
   * フレンドシステム
   */
  sendFriendRequest(senderId, targetId, message = '') {
    if (senderId === targetId) {
      return { error: 'Cannot friend yourself' };
    }

    // 既存の関係チェック
    const senderFriends = this.friendships.get(senderId) || new Map();
    const targetFriends = this.friendships.get(targetId) || new Map();

    if (senderFriends.has(targetId)) {
      const relationship = senderFriends.get(targetId);
      if (relationship.status === 'friends') {
        return { error: 'Already friends' };
      }
      if (relationship.status === 'pending_sent') {
        return { error: 'Friend request already sent' };
      }
    }

    // フレンドリクエスト作成
    const requestId = `friend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const request = {
      id: requestId,
      from: senderId,
      to: targetId,
      message,
      sentAt: new Date(),
      status: 'pending'
    };

    // 送信者側の記録
    if (!this.friendships.has(senderId)) {
      this.friendships.set(senderId, new Map());
    }
    this.friendships.get(senderId).set(targetId, {
      status: 'pending_sent',
      request,
      since: new Date()
    });

    // 受信者側の記録
    if (!this.friendships.has(targetId)) {
      this.friendships.set(targetId, new Map());
    }
    this.friendships.get(targetId).set(senderId, {
      status: 'pending_received',
      request,
      since: new Date()
    });

    return { success: true, requestId };
  }

  /**
   * フレンドリクエスト対応
   */
  respondToFriendRequest(responderId, senderId, response) {
    const responderFriends = this.friendships.get(responderId);
    const senderFriends = this.friendships.get(senderId);

    if (!responderFriends?.has(senderId) || !senderFriends?.has(responderId)) {
      return { error: 'Friend request not found' };
    }

    const relationship = responderFriends.get(senderId);
    if (relationship.status !== 'pending_received') {
      return { error: 'Invalid request status' };
    }

    if (response === 'accept') {
      // フレンドとして承認
      responderFriends.set(senderId, {
        status: 'friends',
        since: new Date(),
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          cardsShared: 0,
          lastInteraction: new Date()
        }
      });

      senderFriends.set(responderId, {
        status: 'friends',
        since: new Date(),
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          cardsShared: 0,
          lastInteraction: new Date()
        }
      });

      return { success: true, status: 'accepted' };
    } else {
      // 拒否または削除
      responderFriends.delete(senderId);
      senderFriends.delete(responderId);

      return { success: true, status: 'rejected' };
    }
  }

  /**
   * チャットチャンネル作成
   */
  createChatChannel(channelId, name, type = 'text') {
    const channel = {
      id: channelId,
      name,
      type, // text, voice, announcement
      createdAt: new Date(),
      messages: [],
      participants: new Set(),
      settings: {
        maxMessages: 1000,
        slowMode: 0, // seconds between messages
        moderationLevel: 'basic' // none, basic, strict
      }
    };

    this.chatChannels.set(channelId, channel);
    return channel;
  }

  /**
   * チャットメッセージ送信
   */
  sendChatMessage(channelId, senderId, content, type = 'text') {
    const channel = this.chatChannels.get(channelId);
    if (!channel) {
      return { error: 'Channel not found' };
    }

    // 権限チェック
    if (!this.hasChannelPermission(senderId, channelId, 'send_messages')) {
      return { error: 'No permission to send messages' };
    }

    // スローモードチェック
    if (channel.settings.slowMode > 0) {
      const lastMessage = channel.messages
        .filter(m => m.senderId === senderId)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      if (lastMessage) {
        const timeSinceLastMessage = Date.now() - lastMessage.timestamp.getTime();
        if (timeSinceLastMessage < channel.settings.slowMode * 1000) {
          return { error: 'Slow mode active' };
        }
      }
    }

    // メッセージ作成
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      content: this.sanitizeMessage(content),
      type,
      timestamp: new Date(),
      edited: false,
      reactions: new Map()
    };

    channel.messages.push(message);
    channel.participants.add(senderId);

    // メッセージ履歴管理
    if (channel.messages.length > channel.settings.maxMessages) {
      channel.messages.shift();
    }

    return { success: true, message };
  }

  /**
   * プレイヤーソーシャルプロファイル更新
   */
  updatePlayerSocialProfile(playerId, updates) {
    if (!this.playerSocialProfiles.has(playerId)) {
      this.playerSocialProfiles.set(playerId, this.createDefaultSocialProfile(playerId));
    }

    const profile = this.playerSocialProfiles.get(playerId);
    Object.assign(profile, updates);
    profile.lastUpdated = new Date();

    return profile;
  }

  /**
   * デフォルトソーシャルプロファイル作成
   */
  createDefaultSocialProfile(playerId) {
    return {
      playerId,
      guildId: null,
      guildRole: null,
      friendsCount: 0,
      reputation: 100,
      socialLevel: 1,
      socialExperience: 0,
      
      activities: {
        lastOnline: new Date(),
        gamesThisWeek: 0,
        cardsCreatedThisWeek: 0,
        votesGivenThisWeek: 0,
        tournamentParticipation: 0
      },
      
      preferences: {
        onlineStatus: 'online', // online, away, busy, invisible
        friendRequests: 'everyone', // everyone, friends_of_friends, none
        guildInvites: 'everyone',
        chatNotifications: true,
        gameInvites: true
      },
      
      achievements: {
        socialMilestones: [],
        guildContributions: [],
        tournamentPlacements: [],
        communityRecognition: []
      },
      
      stats: {
        totalFriends: 0,
        guildTenure: 0,
        tournamentsWon: 0,
        helpfulVotes: 0,
        mentorshipHours: 0
      },
      
      createdAt: new Date(),
      lastUpdated: new Date()
    };
  }

  /**
   * ギルド統計更新
   */
  updateGuildStats(guildId) {
    const guild = this.guilds.get(guildId);
    if (!guild) return;

    const members = Array.from(guild.members.values());
    
    guild.stats.averageLevel = members.reduce((sum, member) => {
      return sum + this.getPlayerLevel(member.playerId);
    }, 0) / members.length;

    guild.stats.totalContributions = members.reduce((sum, member) => {
      return sum + member.contributions.experience + member.contributions.coins;
    }, 0);

    // ギルドパワー計算
    guild.power = this.calculateGuildPower(guild);

    // ギルドレベルアップチェック
    const newLevel = this.calculateGuildLevel(guild.experience);
    if (newLevel > guild.level) {
      guild.level = newLevel;
      guild.tier = this.calculateGuildTier(newLevel);
      
      // レベルアップ報酬配布
      this.distributeGuildLevelRewards(guildId, newLevel);
    }
  }

  /**
   * ギルドパワー計算
   */
  calculateGuildPower(guild) {
    let power = 0;
    
    // ベースパワー（レベル × メンバー数）
    power += guild.level * guild.members.size * 10;
    
    // 活動ボーナス
    power += guild.stats.activitiesCompleted * 50;
    
    // 貢献度ボーナス
    power += guild.stats.totalContributions * 0.1;
    
    // トーナメント成績ボーナス
    power += guild.stats.tournamentsWon * 200;

    return Math.floor(power);
  }

  /**
   * ギルドレベル計算
   */
  calculateGuildLevel(experience) {
    let level = 1;
    let requiredExp = 1000;
    let currentExp = experience;

    while (currentExp >= requiredExp) {
      currentExp -= requiredExp;
      level++;
      requiredExp = Math.floor(requiredExp * 1.2);
    }

    return level;
  }

  /**
   * ギルドティア計算
   */
  calculateGuildTier(level) {
    if (level >= 30) return 'platinum';
    if (level >= 20) return 'gold';
    if (level >= 10) return 'silver';
    return 'bronze';
  }

  /**
   * トーナメント賞金プール計算
   */
  calculatePrizePool(tournamentData) {
    const basePool = (tournamentData.entryFee || 0) * (tournamentData.maxParticipants || 16);
    const sponsorPool = tournamentData.sponsorContribution || 0;
    
    return {
      total: basePool + sponsorPool,
      distribution: {
        winner: Math.floor((basePool + sponsorPool) * 0.4),
        second: Math.floor((basePool + sponsorPool) * 0.25),
        third: Math.floor((basePool + sponsorPool) * 0.15),
        fourth: Math.floor((basePool + sponsorPool) * 0.1),
        participation: Math.floor((basePool + sponsorPool) * 0.1 / Math.max(1, (tournamentData.maxParticipants || 16) - 4))
      }
    };
  }

  /**
   * リーダーボード更新
   */
  updateLeaderboards() {
    Object.keys(this.leaderboards).forEach(boardType => {
      const board = this.leaderboards[boardType];
      const rankings = this.calculateRankings(board.type, board.scope);
      
      board.lastUpdated = new Date();
      board.rankings = rankings;
      
      // 報酬配布チェック
      this.checkLeaderboardRewards(boardType, rankings);
    });
  }

  /**
   * ランキング計算
   */
  calculateRankings(type, scope) {
    const rankings = [];
    
    switch (type) {
      case 'experience':
        // プレイヤーの経験値ランキング
        this.playerSocialProfiles.forEach((profile, playerId) => {
          rankings.push({
            playerId,
            value: profile.socialExperience,
            displayName: this.getPlayerDisplayName(playerId)
          });
        });
        break;
        
      case 'guild_power':
        // ギルドパワーランキング
        this.guilds.forEach((guild, guildId) => {
          rankings.push({
            guildId,
            value: guild.power,
            displayName: guild.name,
            memberCount: guild.members.size
          });
        });
        break;
        
      case 'card_popularity':
        // カード人気度ランキング（実装は別途必要）
        break;
    }
    
    return rankings.sort((a, b) => b.value - a.value).slice(0, 1000);
  }

  /**
   * ユーティリティメソッド群
   */
  getPlayerLevel(playerId) {
    // プレイヤーレベル取得（実装は別途必要）
    return 1;
  }

  getPlayerDisplayName(playerId) {
    // プレイヤー表示名取得（実装は別途必要）
    return `Player_${playerId.slice(-6)}`;
  }

  hasChannelPermission(playerId, channelId, permission) {
    // チャンネル権限チェック（実装は別途必要）
    return true;
  }

  sanitizeMessage(content) {
    // メッセージのサニタイズ
    return content.replace(/<script.*?>.*?<\/script>/gi, '').substring(0, 500);
  }

  createGuildApplication(playerId, guildId, message) {
    // ギルド申請作成（実装は別途必要）
    return { success: true, status: 'pending_approval' };
  }

  distributeGuildLevelRewards(guildId, level) {
    // ギルドレベルアップ報酬配布（実装は別途必要）
  }

  checkLeaderboardRewards(boardType, rankings) {
    // リーダーボード報酬チェック（実装は別途必要）
  }

  getGuildLevelPerks(level) {
    // ギルドレベル特典取得
    const perks = [];
    if (level >= 5) perks.push('increased_member_limit');
    if (level >= 10) perks.push('guild_treasury');
    if (level >= 15) perks.push('custom_activities');
    if (level >= 20) perks.push('guild_tournaments');
    return perks;
  }

  getGuildLevelRewards(level) {
    // ギルドレベル報酬取得
    return {
      guildCoins: level * 100,
      memberRewards: {
        experience: level * 50,
        cardPacks: Math.floor(level / 5)
      }
    };
  }

  /**
   * ソーシャル統計取得
   */
  getSocialStats() {
    return {
      totalGuilds: this.guilds.size,
      totalActiveTournaments: Array.from(this.tournaments.values())
        .filter(t => t.status === 'ongoing' || t.status === 'registration').length,
      totalFriendships: Array.from(this.friendships.values())
        .reduce((count, friendMap) => count + Array.from(friendMap.values())
          .filter(f => f.status === 'friends').length, 0) / 2,
      activeChatChannels: this.chatChannels.size,
      averageGuildSize: Array.from(this.guilds.values())
        .reduce((sum, guild) => sum + guild.members.size, 0) / Math.max(this.guilds.size, 1),
      totalMessages: Array.from(this.chatChannels.values())
        .reduce((sum, channel) => sum + channel.messages.length, 0)
    };
  }
}

export default SocialEngine;