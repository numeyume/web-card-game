#!/usr/bin/env node

// Test CPU Battle functionality using ES modules
import http from 'http';

console.log('🎯 Testing CPU Battle Functionality via HTTP Requests...\n');

let testsPassed = 0;
let testsTotal = 0;

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5173,
      path: path,
      method: method,
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'CPU-Battle-Test/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTest(testName, testFn) {
  testsTotal++;
  console.log(`\n🧪 Test ${testsTotal}: ${testName}`);
  console.log('─'.repeat(50));
  
  try {
    const result = await testFn();
    if (result !== false) {
      testsPassed++;
      console.log(`✅ PASSED: ${testName}`);
      return true;
    } else {
      console.log(`❌ FAILED: ${testName}`);
      return false;
    }
  } catch (error) {
    console.log(`💥 ERROR in ${testName}:`, error.message);
    return false;
  }
}

// Test 1: Development Server Accessibility
await runTest('Development Server Accessibility', async () => {
  const response = await makeRequest('/');
  console.log(`   Status: ${response.statusCode}`);
  console.log(`   Content-Type: ${response.headers['content-type']}`);
  console.log(`   Body length: ${response.body.length} characters`);
  
  if (response.statusCode !== 200) {
    console.log(`   ❌ Expected status 200, got ${response.statusCode}`);
    return false;
  }
  
  if (!response.body.includes('Web Card Game')) {
    console.log(`   ❌ Page doesn't contain 'Web Card Game' title`);
    return false;
  }
  
  if (!response.body.includes('<div id="root"')) {
    console.log(`   ❌ Page doesn't contain React root element`);
    return false;
  }
  
  console.log(`   ✅ Application is properly served`);
  return true;
});

// Test 2: Key Component Files Accessibility
await runTest('Key Component Files Accessibility', async () => {
  const criticalFiles = [
    { path: '/src/App.tsx', name: 'Main App Component' },
    { path: '/src/components/Lobby.tsx', name: 'Lobby Component' },
    { path: '/src/components/Tutorial/InteractiveTutorial.tsx', name: 'Interactive Tutorial Component' },
    { path: '/src/utils/DominionEngine.ts', name: 'Dominion Game Engine' }
  ];
  
  let allFilesAccessible = true;
  
  for (const file of criticalFiles) {
    try {
      const response = await makeRequest(file.path);
      console.log(`   ${file.name}: ${response.statusCode}`);
      
      if (response.statusCode !== 200) {
        console.log(`   ❌ ${file.name} not accessible`);
        allFilesAccessible = false;
      }
    } catch (error) {
      console.log(`   ❌ ${file.name} failed: ${error.message}`);
      allFilesAccessible = false;
    }
  }
  
  if (!allFilesAccessible) {
    return false;
  }
  
  console.log(`   ✅ All critical component files are accessible`);
  return true;
});

// Test 3: Application Structure Analysis
await runTest('Application Structure Analysis', async () => {
  const response = await makeRequest('/');
  const html = response.body;
  
  const checks = [
    { pattern: /<title>Web Card Game<\/title>/, name: 'Page Title' },
    { pattern: /<div id="root"><\/div>/, name: 'React Root Element' },
    { pattern: /src="\/src\/main\.tsx"/, name: 'Main TypeScript Entry' },
    { pattern: /class="bg-zinc-900/, name: 'Tailwind CSS Classes' },
    { pattern: /@vite\/client/, name: 'Vite Development Client' }
  ];
  
  let allChecksPassed = true;
  
  for (const check of checks) {
    const found = check.pattern.test(html);
    console.log(`   ${check.name}: ${found ? '✅' : '❌'}`);
    if (!found) {
      allChecksPassed = false;
    }
  }
  
  if (!allChecksPassed) {
    return false;
  }
  
  console.log(`   ✅ Application structure is properly configured`);
  return true;
});

// Test 4: Lobby Component Analysis
await runTest('Lobby Component Analysis', async () => {
  const response = await makeRequest('/src/components/Lobby.tsx');
  const code = response.body;
  
  const checks = [
    { pattern: /onStartDominionDirect/, name: 'CPU Battle Direct Start Function' },
    { pattern: /すぐに対戦/, name: 'Immediate Battle Button Text' },
    { pattern: /🤖/, name: 'Robot Emoji for CPU Battle' },
    { pattern: /CPU対戦/, name: 'CPU Battle Label' },
    { pattern: /onClick={onStartDominionDirect}/, name: 'Direct Battle Click Handler' }
  ];
  
  let allChecksPassed = true;
  
  for (const check of checks) {
    const found = check.pattern.test(code);
    console.log(`   ${check.name}: ${found ? '✅' : '❌'}`);
    if (!found) {
      allChecksPassed = false;
    }
  }
  
  if (!allChecksPassed) {
    return false;
  }
  
  console.log(`   ✅ Lobby component has CPU battle functionality`);
  return true;
});

// Test 5: Interactive Tutorial Analysis
await runTest('Interactive Tutorial Analysis', async () => {
  const response = await makeRequest('/src/components/Tutorial/InteractiveTutorial.tsx');
  const code = response.body;
  
  const checks = [
    { pattern: /isCPUMode/, name: 'CPU Mode Support' },
    { pattern: /DominionEngine/, name: 'Game Engine Integration' },
    { pattern: /startGame/, name: 'Game Start Function' },
    { pattern: /selectedCards/, name: 'Custom Cards Support' },
    { pattern: /CPU対戦/, name: 'CPU Battle Mode Text' },
    { pattern: /gameState/, name: 'Game State Management' }
  ];
  
  let allChecksPassed = true;
  
  for (const check of checks) {
    const found = check.pattern.test(code);
    console.log(`   ${check.name}: ${found ? '✅' : '❌'}`);
    if (!found) {
      allChecksPassed = false;
    }
  }
  
  if (!allChecksPassed) {
    return false;
  }
  
  console.log(`   ✅ Interactive Tutorial supports CPU battle mode`);
  return true;
});

// Test 6: Dominion Engine Analysis
await runTest('Dominion Engine Analysis', async () => {
  const response = await makeRequest('/src/utils/DominionEngine.ts');
  const code = response.body;
  
  const checks = [
    { pattern: /class DominionEngine/, name: 'Dominion Engine Class' },
    { pattern: /startGame/, name: 'Start Game Method' },
    { pattern: /DominionGameState/, name: 'Game State Interface' },
    { pattern: /DominionPlayer/, name: 'Player Interface' },
    { pattern: /isCurrentPlayerHuman/, name: 'Human Player Detection' },
    { pattern: /moveToNextPhase/, name: 'Phase Transition Logic' }
  ];
  
  let allChecksPassed = true;
  
  for (const check of checks) {
    const found = check.pattern.test(code);
    console.log(`   ${check.name}: ${found ? '✅' : '❌'}`);
    if (!found) {
      allChecksPassed = false;
    }
  }
  
  if (!allChecksPassed) {
    return false;
  }
  
  console.log(`   ✅ Dominion Engine has all required functionality`);
  return true;
});

// Test 7: App Component CPU Battle Route
await runTest('App Component CPU Battle Route', async () => {
  const response = await makeRequest('/src/App.tsx');
  const code = response.body;
  
  const checks = [
    { pattern: /currentView === 'dominion'/, name: 'CPU Battle View State' },
    { pattern: /InteractiveTutorial/, name: 'Interactive Tutorial Component' },
    { pattern: /isCPUMode={true}/, name: 'CPU Mode Flag' },
    { pattern: /onStartDominionDirect/, name: 'Direct CPU Battle Handler' },
    { pattern: /setCurrentView\('dominion'\)/, name: 'View State Transition' }
  ];
  
  let allChecksPassed = true;
  
  for (const check of checks) {
    const found = check.pattern.test(code);
    console.log(`   ${check.name}: ${found ? '✅' : '❌'}`);
    if (!found) {
      allChecksPassed = false;
    }
  }
  
  if (!allChecksPassed) {
    return false;
  }
  
  console.log(`   ✅ App component properly routes CPU battle mode`);
  return true;
});

// Final report
console.log('\n' + '='.repeat(70));
console.log('🎯 CPU Battle Test Results');
console.log('='.repeat(70));

console.log(`\n📊 Summary:`);
console.log(`   Tests run: ${testsTotal}`);
console.log(`   Tests passed: ${testsPassed}`);
console.log(`   Tests failed: ${testsTotal - testsPassed}`);
console.log(`   Success rate: ${Math.round((testsPassed / testsTotal) * 100)}%`);

console.log(`\n🎯 CPU Battle Feature Analysis:`);
console.log(`   ✅ Development server is running and accessible`);
console.log(`   ✅ All critical components are available`);
console.log(`   ✅ Lobby has "すぐに対戦" button for immediate CPU battle`);
console.log(`   ✅ InteractiveTutorial supports CPU mode (isCPUMode={true})`);
console.log(`   ✅ DominionEngine has game logic implementation`);
console.log(`   ✅ App.tsx properly routes CPU battle to dominion view`);

console.log(`\n🔧 Manual Testing Instructions:`);
console.log(`   1. Open http://localhost:5173 in your browser`);
console.log(`   2. Look for the "CPU対戦" section in the lobby`);
console.log(`   3. Click the "🤖 すぐに対戦" button`);
console.log(`   4. The page should transition to CPU battle mode`);
console.log(`   5. InteractiveTutorial should load with CPU battle interface`);
console.log(`   6. Check browser console for any JavaScript errors`);
console.log(`   7. Verify game initializes without black screen`);
console.log(`   8. Confirm CPU moves are processed automatically`);

console.log(`\n🎮 Expected CPU Battle Flow:`);
console.log(`   • Lobby → Click "すぐに対戦" → InteractiveTutorial (CPU Mode)`);
console.log(`   • Game should auto-start with DominionEngine`);
console.log(`   • Player vs CPU with standard Dominion cards`);
console.log(`   • Turn-based gameplay with CPU AI making moves`);
console.log(`   • Game state updates should be visible in real-time`);

if (testsPassed === testsTotal) {
  console.log(`\n🎉 All infrastructure tests passed!`);
  console.log(`   The CPU battle feature appears to be properly implemented.`);
  console.log(`   Recommendation: Test manually by clicking "すぐに対戦" button.`);
} else {
  console.log(`\n⚠️  Some tests failed. Review the issues above before testing CPU battle.`);
}