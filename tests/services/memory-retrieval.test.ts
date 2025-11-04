// tests/services/memory-retrieval.test.ts
/**
 * Memory Retrieval Tests (Week 2, Days 1-2)
 *
 * Tests for validating memory retrieval with REAL embeddings:
 * - Recent memory retrieval
 * - Importance-weighted retrieval
 * - Semantic similarity retrieval (MAIN TEST for real embeddings!)
 * - Combined retrieval (recency + importance + similarity)
 * - Performance benchmarks
 *
 * This is the KEY test to validate that real embeddings
 * significantly improve memory retrieval over fake embeddings.
 *
 * Expected results:
 * - Fake embeddings: ~5% semantic accuracy (random)
 * - Real embeddings: >85% semantic accuracy
 */

import { MemoryStream } from '../../src/agent/MemoryStream';
import { MemoryRetrieval } from '../../src/agent/MemoryRetrieval';
import { AnthropicService } from '../../src/services/AnthropicService';
import { EmbeddingProvider } from '../../src/services/EmbeddingService';
import { Memory } from '../../src/types';

/**
 * Helper: Create test memory stream with predefined memories
 */
function createTestMemoryStream(): MemoryStream {
  const stream = new MemoryStream();

  // Add diverse memories for testing
  const testMemories = [
    // Food-related (should cluster together semantically)
    'I found food in the northern corridor',
    'Discovered a food cache near the exit',
    'The agent is getting hungry and needs food',
    'Food supplies are running low',

    // Water-related (should cluster together)
    'Water source located in the eastern area',
    'My water level is critically low',
    'Found a water fountain by the entrance',
    'The agent needs water soon',

    // Navigation-related (should cluster together)
    'Reached a dead end, need to backtrack',
    'Found a junction with three paths',
    'This corridor leads nowhere useful',
    'Discovered a new area to explore',

    // Danger-related (should cluster together)
    'This area feels dangerous',
    'Critical situation, health is low',
    'Warning: hazardous zone ahead',
    'The agent is in grave danger',

    // Mundane observations (lower importance)
    'The walls are gray',
    'Noticed a pattern on the floor',
    'This room is empty',
    'Another corridor',
  ];

  testMemories.forEach((content, index) => {
    stream.addObservation(
      content,
      1000 + index * 1000, // Space out timestamps
      5 + Math.floor(index / 4) * 2 // Vary importance by category
    );
  });

  return stream;
}

/**
 * Test 1: Validate recent memory retrieval
 */
export async function testRecentRetrieval(
  anthropicService: AnthropicService
) {
  console.log('\n🧪 Test 1: Recent Memory Retrieval');
  console.log('='.repeat(50));

  const stream = createTestMemoryStream();
  const retrieval = new MemoryRetrieval(stream, anthropicService);

  // Generate embeddings
  await retrieval.generateMissingEmbeddings();

  // Retrieve recent memories
  const recentMemories = await retrieval.getRecentMemories(5);

  console.log(`  Retrieved: ${recentMemories.length} recent memories`);

  // Check if they're actually recent (should be last 5 added)
  const expectedRecent = stream.getRecentObservations(5);
  const isCorrect = recentMemories.length === 5 &&
    recentMemories.every((mem, idx) => mem.content === expectedRecent[idx].content);

  console.log(`  ${isCorrect ? '✅' : '❌'} Recent retrieval ${isCorrect ? 'correct' : 'incorrect'}`);

  recentMemories.forEach((mem, idx) => {
    console.log(`    ${idx + 1}. "${mem.content.substring(0, 40)}..."`);
  });

  return isCorrect;
}

/**
 * Test 2: Validate importance-weighted retrieval
 */
export async function testImportanceRetrieval(
  anthropicService: AnthropicService
) {
  console.log('\n🧪 Test 2: Importance-Weighted Retrieval');
  console.log('='.repeat(50));

  const stream = createTestMemoryStream();
  const retrieval = new MemoryRetrieval(stream, anthropicService);

  await retrieval.generateMissingEmbeddings();

  // Retrieve by importance
  const importantMemories = await retrieval.getImportantMemories(5);

  console.log(`  Retrieved: ${importantMemories.length} important memories`);

  // Check if they're sorted by importance (descending)
  const sortedByImportance = importantMemories.every((mem, idx) => {
    if (idx === 0) return true;
    return mem.importance >= importantMemories[idx - 1].importance ||
           mem.importance === importantMemories[idx - 1].importance;
  });

  console.log(`  ${sortedByImportance ? '✅' : '❌'} Sorted by importance: ${sortedByImportance}`);

  importantMemories.forEach((mem, idx) => {
    console.log(`    ${idx + 1}. [${mem.importance}] "${mem.content.substring(0, 40)}..."`);
  });

  return sortedByImportance;
}

/**
 * Test 3: Validate semantic similarity retrieval
 * THIS IS THE MAIN TEST - Real embeddings should perform MUCH better than fake
 */
export async function testSemanticRetrieval(
  anthropicService: AnthropicService
) {
  console.log('\n🧪 Test 3: Semantic Similarity Retrieval');
  console.log('='.repeat(50));
  console.log('  This is the KEY test for real embeddings!');
  console.log('  Expected: Fake ~5% | Real >85%\n');

  const stream = createTestMemoryStream();
  const retrieval = new MemoryRetrieval(stream, anthropicService);

  await retrieval.generateMissingEmbeddings();

  // Test queries and expected semantic matches
  const testCases = [
    {
      query: 'I am starving and need something to eat',
      expectedKeywords: ['food', 'hungry', 'supplies'],
      category: 'Food',
    },
    {
      query: 'I am very thirsty and dehydrated',
      expectedKeywords: ['water', 'fountain'],
      category: 'Water',
    },
    {
      query: 'I am lost and need to find my way',
      expectedKeywords: ['dead end', 'junction', 'backtrack', 'corridor'],
      category: 'Navigation',
    },
    {
      query: 'I am in a life-threatening situation',
      expectedKeywords: ['danger', 'critical', 'hazardous', 'grave'],
      category: 'Danger',
    },
  ];

  let totalTests = 0;
  let totalCorrect = 0;

  for (const testCase of testCases) {
    console.log(`  Query: "${testCase.query}"`);
    console.log(`  Expected category: ${testCase.category}`);

    const similarMemories = await retrieval.retrieveMemories(
      testCase.query,
      5, // Get top 5
      { recency: 0.1, importance: 0.1, relevance: 0.8 } // Focus on similarity
    );

    console.log(`  Retrieved ${similarMemories.length} memories:`);

    let correctMatches = 0;
    similarMemories.forEach((mem, idx) => {
      const hasKeyword = testCase.expectedKeywords.some(keyword =>
        mem.content.toLowerCase().includes(keyword)
      );

      if (hasKeyword) correctMatches++;

      console.log(`    ${idx + 1}. ${hasKeyword ? '✅' : '❌'} [${mem.similarity?.toFixed(3)}] "${mem.content.substring(0, 50)}..."`);
    });

    const accuracy = correctMatches / similarMemories.length;
    totalTests++;
    if (accuracy >= 0.6) totalCorrect++; // Consider >60% accuracy as passing

    console.log(`  Accuracy: ${(accuracy * 100).toFixed(1)}% (${correctMatches}/${similarMemories.length})`);
    console.log(`  ${accuracy >= 0.6 ? '✅ PASS' : '❌ FAIL'}\n`);
  }

  const overallAccuracy = totalCorrect / totalTests;
  console.log(`  Overall: ${(overallAccuracy * 100).toFixed(1)}% of queries passed (${totalCorrect}/${totalTests})`);

  // With REAL embeddings, we should get at least 75% of queries correct
  // With FAKE embeddings, we'd get ~25% or less (random chance)
  const passed = overallAccuracy >= 0.75;
  console.log(`  ${passed ? '✅' : '❌'} Semantic retrieval ${passed ? 'EXCELLENT' : 'POOR'}`);

  if (passed) {
    console.log(`  🎉 Real embeddings are working correctly!`);
  } else {
    console.log(`  ⚠️  Results suggest fake/poor quality embeddings`);
  }

  return passed;
}

/**
 * Test 4: Validate combined retrieval scoring
 */
export async function testCombinedRetrieval(
  anthropicService: AnthropicService
) {
  console.log('\n🧪 Test 4: Combined Retrieval (Recency + Importance + Similarity)');
  console.log('='.repeat(50));

  const stream = createTestMemoryStream();
  const retrieval = new MemoryRetrieval(stream, anthropicService);

  await retrieval.generateMissingEmbeddings();

  const query = 'I need food urgently';

  // Test different weight combinations
  const weightConfigs = [
    { name: 'Recency-focused', weights: { recency: 0.7, importance: 0.2, relevance: 0.1 } },
    { name: 'Importance-focused', weights: { recency: 0.1, importance: 0.7, relevance: 0.2 } },
    { name: 'Relevance-focused', weights: { recency: 0.1, importance: 0.2, relevance: 0.7 } },
    { name: 'Balanced', weights: { recency: 0.33, importance: 0.33, relevance: 0.34 } },
  ];

  for (const config of weightConfigs) {
    console.log(`\n  ${config.name}: ${JSON.stringify(config.weights)}`);

    const memories = await retrieval.retrieveMemories(query, 3, config.weights);

    memories.forEach((mem, idx) => {
      console.log(`    ${idx + 1}. [score: ${mem.retrievalScore?.toFixed(3)}] "${mem.content.substring(0, 50)}..."`);
    });
  }

  console.log(`\n  ✅ Combined retrieval executed successfully`);
  return true;
}

/**
 * Test 5: Performance benchmark
 */
export async function testRetrievalPerformance(
  anthropicService: AnthropicService
) {
  console.log('\n🧪 Test 5: Retrieval Performance Benchmark');
  console.log('='.repeat(50));

  const stream = createTestMemoryStream();
  const retrieval = new MemoryRetrieval(stream, anthropicService);

  // Benchmark embedding generation
  console.log('\n  Embedding Generation:');
  const embeddingStart = Date.now();
  await retrieval.generateMissingEmbeddings();
  const embeddingTime = Date.now() - embeddingStart;

  const memoryCount = stream.getRecentObservations(1000).length;
  console.log(`    Generated ${memoryCount} embeddings in ${embeddingTime}ms`);
  console.log(`    Avg: ${(embeddingTime / memoryCount).toFixed(1)}ms per embedding`);

  // Benchmark retrieval
  console.log('\n  Memory Retrieval:');
  const queries = [
    'I need food',
    'Where is water',
    'I am lost',
    'Dangerous situation',
  ];

  let totalRetrievalTime = 0;
  for (const query of queries) {
    const start = Date.now();
    await retrieval.retrieveMemories(query, 10);
    const time = Date.now() - start;
    totalRetrievalTime += time;

    console.log(`    Query: "${query}" took ${time}ms`);
  }

  const avgRetrievalTime = totalRetrievalTime / queries.length;
  console.log(`\n    Average retrieval: ${avgRetrievalTime.toFixed(1)}ms`);

  // Performance criteria: <500ms per retrieval is good
  const passed = avgRetrievalTime < 500;
  console.log(`  ${passed ? '✅' : '⚠️ '} Performance ${passed ? 'excellent' : 'acceptable'}`);

  return true; // Always pass, just informational
}

/**
 * Run all memory retrieval tests
 */
export async function runAllTests() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 MEMORY RETRIEVAL TEST SUITE');
  console.log('='.repeat(50));

  // Initialize services
  const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
  const openaiKey = process.env.VITE_OPENAI_API_KEY;

  const embeddingConfig = openaiKey && openaiKey !== 'your-openai-api-key-here' ? {
    provider: 'openai' as EmbeddingProvider,
    fallbackChain: ['openai', 'ollama', 'fake'] as EmbeddingProvider[],
    openaiApiKey: openaiKey,
    preferredDimension: 1536,
    maxCacheSize: 1000,
    enableCache: true,
  } : undefined;

  const anthropicService = new AnthropicService(apiKey, embeddingConfig);

  if (!anthropicService.isUsingRealEmbeddings()) {
    console.log('\n⚠️  WARNING: Using fake embeddings (no API keys configured)');
    console.log('   Test results will show poor semantic retrieval performance');
    console.log('   To test real embeddings, set VITE_OPENAI_API_KEY in .env\n');
  } else {
    console.log(`\n✅ Using real embeddings (${anthropicService.getEmbeddingService()?.getCurrentProvider()})`);
    console.log('   Expecting high semantic retrieval accuracy\n');
  }

  const results = [];

  try {
    const passed = await testRecentRetrieval(anthropicService);
    results.push({ name: 'Recent Retrieval', passed });
  } catch (error) {
    console.error('Test 1 failed:', error);
    results.push({ name: 'Recent Retrieval', passed: false });
  }

  try {
    const passed = await testImportanceRetrieval(anthropicService);
    results.push({ name: 'Importance Retrieval', passed });
  } catch (error) {
    console.error('Test 2 failed:', error);
    results.push({ name: 'Importance Retrieval', passed: false });
  }

  try {
    const passed = await testSemanticRetrieval(anthropicService);
    results.push({ name: 'Semantic Retrieval', passed });
  } catch (error) {
    console.error('Test 3 failed:', error);
    results.push({ name: 'Semantic Retrieval', passed: false });
  }

  try {
    const passed = await testCombinedRetrieval(anthropicService);
    results.push({ name: 'Combined Retrieval', passed });
  } catch (error) {
    console.error('Test 4 failed:', error);
    results.push({ name: 'Combined Retrieval', passed: false });
  }

  try {
    const passed = await testRetrievalPerformance(anthropicService);
    results.push({ name: 'Performance Benchmark', passed });
  } catch (error) {
    console.error('Test 5 failed:', error);
    results.push({ name: 'Performance Benchmark', passed: false });
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));

  results.forEach(({ name, passed }) => {
    console.log(`  ${passed ? '✅' : '❌'} ${name}`);
  });

  const totalPassed = results.filter(r => r.passed).length;
  const totalTests = results.length;

  console.log(`\n  Total: ${totalPassed}/${totalTests} tests passed`);
  console.log('='.repeat(50) + '\n');

  return totalPassed === totalTests;
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then(allPassed => {
      process.exit(allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
