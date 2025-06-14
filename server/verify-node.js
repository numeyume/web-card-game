#!/usr/bin/env node

// Node.js環境確認スクリプト
console.log('🔍 Node.js Environment Verification');
console.log('=====================================');
console.log('Node.js Version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Current Working Directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV || 'development');

// パッケージマネージャー確認
const { execSync } = require('child_process');

try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log('NPM Version:', npmVersion);
} catch (error) {
  console.error('❌ NPM not found:', error.message);
}

// Bunが存在するかチェック
try {
  const bunVersion = execSync('bun --version', { encoding: 'utf8' }).trim();
  console.log('⚠️  Bun Version detected:', bunVersion);
  console.log('⚠️  Make sure Node.js is used for deployment!');
} catch (error) {
  console.log('✅ Bun not found (good for Node.js deployment)');
}

// 必要なモジュールのチェック
const requiredModules = ['express', 'socket.io', 'mongodb', 'cors'];
console.log('\n📦 Required Dependencies Check:');

requiredModules.forEach(module => {
  try {
    require.resolve(module);
    console.log(`✅ ${module}: Available`);
  } catch (error) {
    console.log(`❌ ${module}: Missing`);
  }
});

console.log('\n🚀 Ready for deployment with Node.js!');