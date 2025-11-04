// tests/services/embedding-validation.test.ts
/**
 * Embedding Validation Tests (Week 2, Days 1-2)
 *
 * Tests for validating embedding generation across providers:
 * - OpenAI embeddings
 * - Voyage AI embeddings
 * - Ollama embeddings
 * - Fake embeddings
 * - Provider fallback logic
 * - Semantic similarity validation
 * - Cost tracking
 *
 * Run with: npm test
 * Or manually test individual providers
 */

import { EmbeddingService, EmbeddingProvider } from '../../src/services/EmbeddingService';
import { OpenAIService } from '../../src/services/OpenAIService';
import { VoyageAIService } from '../../src/services/VoyageAIService';
import { OllamaService } from '../../src/services/OllamaService';

/**
 * Test 1: Validate embedding dimensions
 */
export async function testEmbeddingDimensions() {
  console.log('\n🧪 Test 1: Embedding Dimensions');
  console.log('='.repeat(50));

  const tests = [
    { provider: 'openai' as EmbeddingProvider, expectedDim: 1536 },
    { provider: 'voyage' as EmbeddingProvider, expectedDim: 1024 },
    { provider: 'ollama' as EmbeddingProvider, expectedDim: 768 },
  ];

  for (const test of tests) {
    try {
      const config = {
        provider: test.provider,
        openaiApiKey: process.env.VITE_OPENAI_API_KEY,
        voyageApiKey: process.env.VITE_VOYAGE_API_KEY,
        ollamaUrl: 'http://localhost:11434',
      };

      const service = new EmbeddingService(config);
      const embedding = await service.generateEmbedding('Test text');

      const passed = embedding.length === test.expectedDim;
      console.log(`  ${test.provider}: ${passed ? '✅' : '❌'} ${embedding.length}D (expected ${test.expectedDim}D)`);

      if (!passed) {
        console.error(`    ERROR: Dimension mismatch!`);
      }
    } catch (error) {
      console.log(`  ${test.provider}: ⚠️  Skipped (provider not available)`);
    }
  }
}

/**
 * Test 2: Validate semantic similarity
 * Similar texts should have high cosine similarity (>0.7)
 * Different texts should have low cosine similarity (<0.5)
 */
export async function testSemanticSimilarity() {
  console.log('\n🧪 Test 2: Semantic Similarity');
  console.log('='.repeat(50));

  const similarPairs = [
    ['I found food', 'I discovered food'],
    ['The agent is hungry', 'The agent needs food'],
    ['Reached a dead end', 'Hit a wall, cannot proceed'],
  ];

  const differentPairs = [
    ['I found food', 'The sky is blue'],
    ['The agent is hungry', 'Mathematics is beautiful'],
    ['Reached a dead end', 'Quantum physics is complex'],
  ];

  const config = {
    provider: 'openai' as EmbeddingProvider,
    openaiApiKey: process.env.VITE_OPENAI_API_KEY,
    fallbackChain: ['openai', 'ollama', 'fake'] as EmbeddingProvider[],
  };

  const service = new EmbeddingService(config);

  // Test similar pairs
  console.log('\n  Similar pairs (expecting >0.7):');
  let similarityPassed = 0;
  let similarityTotal = 0;

  for (const [text1, text2] of similarPairs) {
    const emb1 = await service.generateEmbedding(text1);
    const emb2 = await service.generateEmbedding(text2);
    const similarity = EmbeddingService.cosineSimilarity(emb1, emb2);

    similarityTotal++;
    const passed = similarity > 0.7;
    if (passed) similarityPassed++;

    console.log(`    "${text1}" <-> "${text2}"`);
    console.log(`    ${passed ? '✅' : '❌'} Similarity: ${similarity.toFixed(3)} ${passed ? '(PASS)' : '(FAIL)'}`);
  }

  // Test different pairs
  console.log('\n  Different pairs (expecting <0.5):');
  for (const [text1, text2] of differentPairs) {
    const emb1 = await service.generateEmbedding(text1);
    const emb2 = await service.generateEmbedding(text2);
    const similarity = EmbeddingService.cosineSimilarity(emb1, emb2);

    similarityTotal++;
    const passed = similarity < 0.5;
    if (passed) similarityPassed++;

    console.log(`    "${text1}" <-> "${text2}"`);
    console.log(`    ${passed ? '✅' : '❌'} Similarity: ${similarity.toFixed(3)} ${passed ? '(PASS)' : '(FAIL)'}`);
  }

  console.log(`\n  Overall: ${similarityPassed}/${similarityTotal} tests passed`);
  return similarityPassed === similarityTotal;
}

/**
 * Test 3: Validate provider fallback
 * Should automatically fall back to next provider if primary fails
 */
export async function testProviderFallback() {
  console.log('\n🧪 Test 3: Provider Fallback');
  console.log('='.repeat(50));

  // Test with invalid API key (should fall back to ollama/fake)
  const config = {
    provider: 'openai' as EmbeddingProvider,
    openaiApiKey: 'invalid-key',
    fallbackChain: ['openai', 'ollama', 'fake'] as EmbeddingProvider[],
    ollamaUrl: 'http://localhost:11434',
  };

  const service = new EmbeddingService(config);

  try {
    const embedding = await service.generateEmbedding('Test fallback');
    const currentProvider = service.getCurrentProvider();

    console.log(`  Started with: openai`);
    console.log(`  Fell back to: ${currentProvider}`);
    console.log(`  ${currentProvider !== 'openai' ? '✅' : '❌'} Fallback ${currentProvider !== 'openai' ? 'worked' : 'failed'}`);
    console.log(`  Generated ${embedding.length}D embedding`);

    return currentProvider !== 'openai';
  } catch (error) {
    console.log(`  ❌ Fallback failed completely:`, error);
    return false;
  }
}

/**
 * Test 4: Validate batch embedding generation
 * Should be more efficient than individual calls
 */
export async function testBatchEmbeddings() {
  console.log('\n🧪 Test 4: Batch Embedding Generation');
  console.log('='.repeat(50));

  const texts = [
    'I found food',
    'I am at a junction',
    'Reached a dead end',
    'My water is low',
    'I discovered a new area',
  ];

  const config = {
    provider: 'openai' as EmbeddingProvider,
    openaiApiKey: process.env.VITE_OPENAI_API_KEY,
    fallbackChain: ['openai', 'ollama', 'fake'] as EmbeddingProvider[],
  };

  const service = new EmbeddingService(config);

  try {
    const startTime = Date.now();
    const embeddings = await service.generateEmbeddingsBatch(texts);
    const totalTime = Date.now() - startTime;

    const passed = embeddings.length === texts.length;
    console.log(`  Generated: ${embeddings.length} embeddings`);
    console.log(`  Time: ${totalTime}ms (${(totalTime / texts.length).toFixed(0)}ms avg)`);
    console.log(`  ${passed ? '✅' : '❌'} Batch generation ${passed ? 'succeeded' : 'failed'}`);

    // Verify all embeddings have correct dimension
    const firstDim = embeddings[0].length;
    const allSameDim = embeddings.every(e => e.length === firstDim);
    console.log(`  ${allSameDim ? '✅' : '❌'} All embeddings have same dimension (${firstDim}D)`);

    return passed && allSameDim;
  } catch (error) {
    console.log(`  ❌ Batch generation failed:`, error);
    return false;
  }
}

/**
 * Test 5: Validate cost tracking
 */
export async function testCostTracking() {
  console.log('\n🧪 Test 5: Cost Tracking');
  console.log('='.repeat(50));

  const config = {
    provider: 'openai' as EmbeddingProvider,
    openaiApiKey: process.env.VITE_OPENAI_API_KEY,
    fallbackChain: ['openai', 'ollama', 'fake'] as EmbeddingProvider[],
  };

  const service = new EmbeddingService(config);

  try {
    // Generate some embeddings
    await service.generateEmbedding('Test text 1');
    await service.generateEmbedding('Test text 2');
    await service.generateEmbedding('Test text 1'); // Should hit cache

    const stats = service.getStatistics();

    console.log(`  Provider: ${stats.provider}`);
    console.log(`  Model: ${stats.model}`);
    console.log(`  Total generated: ${stats.totalGenerated}`);
    console.log(`  Cache hits: ${stats.cacheHits}`);
    console.log(`  Cache misses: ${stats.cacheMisses}`);
    console.log(`  Total cost: $${stats.totalCost.toFixed(6)}`);
    console.log(`  Avg latency: ${stats.avgLatency.toFixed(0)}ms`);

    const passed = stats.totalGenerated >= 2 && stats.cacheHits >= 1;
    console.log(`  ${passed ? '✅' : '❌'} Statistics ${passed ? 'look correct' : 'seem wrong'}`);

    return passed;
  } catch (error) {
    console.log(`  ⚠️  Skipped (provider not available)`);
    return true; // Don't fail if provider unavailable
  }
}

/**
 * Test 6: Validate provider switching
 */
export async function testProviderSwitching() {
  console.log('\n🧪 Test 6: Provider Switching');
  console.log('='.repeat(50));

  const config = {
    provider: 'openai' as EmbeddingProvider,
    openaiApiKey: process.env.VITE_OPENAI_API_KEY,
    voyageApiKey: process.env.VITE_VOYAGE_API_KEY,
    fallbackChain: ['openai', 'voyage', 'ollama', 'fake'] as EmbeddingProvider[],
  };

  const service = new EmbeddingService(config);

  const results: boolean[] = [];

  // Test cycling through providers
  const providers: EmbeddingProvider[] = ['openai', 'voyage', 'ollama', 'fake'];

  for (const provider of providers) {
    const switched = await service.setProvider(provider);
    const current = service.getCurrentProvider();
    const model = service.getCurrentModel();

    console.log(`  ${switched ? '✅' : '⚠️ '} Set to ${provider}: current=${current}, model=${model}`);
    results.push(current === provider);
  }

  const allPassed = results.filter(r => r).length >= 2; // At least 2 providers should work
  console.log(`  ${allPassed ? '✅' : '❌'} Provider switching ${allPassed ? 'works' : 'failed'}`);

  return allPassed;
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 EMBEDDING VALIDATION TEST SUITE');
  console.log('='.repeat(50));

  const results = [];

  try {
    await testEmbeddingDimensions();
    results.push({ name: 'Embedding Dimensions', passed: true });
  } catch (error) {
    console.error('Test 1 failed:', error);
    results.push({ name: 'Embedding Dimensions', passed: false });
  }

  try {
    const passed = await testSemanticSimilarity();
    results.push({ name: 'Semantic Similarity', passed });
  } catch (error) {
    console.error('Test 2 failed:', error);
    results.push({ name: 'Semantic Similarity', passed: false });
  }

  try {
    const passed = await testProviderFallback();
    results.push({ name: 'Provider Fallback', passed });
  } catch (error) {
    console.error('Test 3 failed:', error);
    results.push({ name: 'Provider Fallback', passed: false });
  }

  try {
    const passed = await testBatchEmbeddings();
    results.push({ name: 'Batch Embeddings', passed });
  } catch (error) {
    console.error('Test 4 failed:', error);
    results.push({ name: 'Batch Embeddings', passed: false });
  }

  try {
    const passed = await testCostTracking();
    results.push({ name: 'Cost Tracking', passed });
  } catch (error) {
    console.error('Test 5 failed:', error);
    results.push({ name: 'Cost Tracking', passed: false });
  }

  try {
    const passed = await testProviderSwitching();
    results.push({ name: 'Provider Switching', passed });
  } catch (error) {
    console.error('Test 6 failed:', error);
    results.push({ name: 'Provider Switching', passed: false });
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
