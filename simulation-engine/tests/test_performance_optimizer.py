import pytest
import time
import asyncio
from src.performance_optimizer import PerformanceOptimizer, performance_optimizer

@pytest.fixture
def perf_optimizer():
    """Create a PerformanceOptimizer instance for testing"""
    return PerformanceOptimizer()

def test_timer_decorator(perf_optimizer):
    """Test the timer decorator"""
    @perf_optimizer.timer
    def slow_function():
        time.sleep(0.1)
        return "done"
    
    # This should print execution time but we can't easily test that
    # We can at least verify it returns the correct result
    result = slow_function()
    assert result == "done"

def test_cache_result_decorator(perf_optimizer):
    """Test the cache_result decorator"""
    call_count = 0
    
    @perf_optimizer.cache_result(maxsize=2)
    def expensive_function(x, y):
        nonlocal call_count
        call_count += 1
        time.sleep(0.01)  # Simulate some work
        return x * y
    
    # First call
    result1 = expensive_function(2, 3)
    assert result1 == 6
    assert call_count == 1
    
    # Second call with same args should use cache
    result2 = expensive_function(2, 3)
    assert result2 == 6
    # call_count should still be 1 if caching worked
    
    # Call with different args
    result3 = expensive_function(3, 4)
    assert result3 == 12
    # call_count should be 2 now

def test_batch_process_decorator(perf_optimizer):
    """Test the batch_process decorator"""
    @perf_optimizer.batch_process(batch_size=3)
    def process_batch(data):
        return [x * 2 for x in data]
    
    # Small data should be processed normally
    small_data = [1, 2, 3]
    result = process_batch(small_data)
    assert result == [2, 4, 6]
    
    # Large data should be processed in batches
    large_data = list(range(10))
    result = process_batch(large_data)
    # Should return a list of results (one for each batch)
    assert isinstance(result, list)
    # Each batch should have been processed
    flattened = [item for sublist in result for item in sublist]
    expected = [x * 2 for x in large_data]
    assert flattened == expected

def test_vectorize_operation_decorator(perf_optimizer):
    """Test the vectorize_operation decorator"""
    @perf_optimizer.vectorize_operation
    def square(x):
        return x ** 2
    
    # Test with list
    data = [1, 2, 3, 4]
    result = square(data)
    assert result == [1, 4, 9, 16]
    
    # Test with numpy array
    import numpy as np
    np_data = np.array([1, 2, 3, 4])
    result = square(np_data)
    expected = np.array([1, 4, 9, 16])
    assert (result == expected).all()

async def sample_async_task(name, delay):
    """Sample async task for testing"""
    await asyncio.sleep(delay)
    return f"Task {name} completed"

def test_run_async_concurrent(perf_optimizer):
    """Test running async tasks concurrently"""
    async def run_test():
        tasks = [
            sample_async_task("A", 0.1),
            sample_async_task("B", 0.1),
            sample_async_task("C", 0.1)
        ]
        results = await perf_optimizer.run_async_concurrent(tasks)
        return results
    
    results = asyncio.run(run_test())
    assert len(results) == 3
    assert "Task A completed" in results
    assert "Task B completed" in results
    assert "Task C completed" in results

def test_get_cache_stats(perf_optimizer):
    """Test getting cache statistics"""
    stats = perf_optimizer.get_cache_stats()
    assert isinstance(stats, dict)
    assert "hits" in stats
    assert "misses" in stats
    assert stats["hits"] >= 0
    assert stats["misses"] >= 0

def test_clear_cache_stats(perf_optimizer):
    """Test clearing cache statistics"""
    # Modify stats to test clearing
    perf_optimizer.cache_stats["hits"] = 5
    perf_optimizer.cache_stats["misses"] = 3
    
    perf_optimizer.clear_cache_stats()
    
    stats = perf_optimizer.get_cache_stats()
    assert stats["hits"] == 0
    assert stats["misses"] == 0

# Test the global performance_optimizer instance
def test_global_performance_optimizer():
    """Test the global performance_optimizer instance"""
    assert isinstance(performance_optimizer, PerformanceOptimizer)