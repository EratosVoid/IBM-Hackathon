import asyncio
import functools
import time
from typing import Dict, Any, Callable
from functools import lru_cache
import numpy as np
import pandas as pd

class PerformanceOptimizer:
    """
    Performance Optimizer for the Simulation Engine.
    
    This class implements various performance optimization techniques including
    caching, asynchronous processing, and efficient data handling.
    """
    
    def __init__(self):
        """Initialize the performance optimizer"""
        self.cache_stats = {"hits": 0, "misses": 0}
    
    @staticmethod
    def async_timer(func: Callable) -> Callable:
        """
        Decorator to measure execution time of async functions.
        
        Args:
            func: Async function to decorate
            
        Returns:
            Decorated function
        """
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            result = await func(*args, **kwargs)
            end_time = time.time()
            print(f"{func.__name__} executed in {end_time - start_time:.4f} seconds")
            return result
        return wrapper
    
    @staticmethod
    def timer(func: Callable) -> Callable:
        """
        Decorator to measure execution time of sync functions.
        
        Args:
            func: Function to decorate
            
        Returns:
            Decorated function
        """
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()
            print(f"{func.__name__} executed in {end_time - start_time:.4f} seconds")
            return result
        return wrapper
    
    @staticmethod
    def cache_result(maxsize: int = 128) -> Callable:
        """
        Decorator to cache function results.
        
        Args:
            maxsize: Maximum size of cache
            
        Returns:
            Decorator function
        """
        def decorator(func: Callable) -> Callable:
            cached_func = lru_cache(maxsize=maxsize)(func)
            
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                # Convert args to hashable types for caching
                hashable_args = tuple(
                    tuple(arg) if isinstance(arg, list) else arg 
                    for arg in args
                )
                hashable_kwargs = {
                    k: tuple(v) if isinstance(v, list) else v 
                    for k, v in kwargs.items()
                }
                
                try:
                    result = cached_func(hashable_args, **hashable_kwargs)
                    return result
                except TypeError:
                    # If args are not hashable, call function directly
                    return func(*args, **kwargs)
            return wrapper
        return decorator
    
    @staticmethod
    def batch_process(batch_size: int = 100) -> Callable:
        """
        Decorator to process data in batches.
        
        Args:
            batch_size: Size of each batch
            
        Returns:
            Decorator function
        """
        def decorator(func: Callable) -> Callable:
            @functools.wraps(func)
            def wrapper(data, *args, **kwargs):
                if isinstance(data, list) and len(data) > batch_size:
                    results = []
                    for i in range(0, len(data), batch_size):
                        batch = data[i:i + batch_size]
                        result = func(batch, *args, **kwargs)
                        results.append(result)
                    return results
                else:
                    return func(data, *args, **kwargs)
            return wrapper
        return decorator
    
    @staticmethod
    def vectorize_operation(func: Callable) -> Callable:
        """
        Decorator to vectorize operations using NumPy.
        
        Args:
            func: Function to vectorize
            
        Returns:
            Vectorized function
        """
        @functools.wraps(func)
        def wrapper(data, *args, **kwargs):
            if isinstance(data, (list, tuple)):
                # Convert to numpy array for vectorized operations
                np_data = np.array(data)
                result = np.vectorize(func)(np_data, *args, **kwargs)
                return result.tolist()
            elif isinstance(data, np.ndarray):
                return np.vectorize(func)(data, *args, **kwargs)
            else:
                return func(data, *args, **kwargs)
        return wrapper
    
    @staticmethod
    async def run_async_concurrent(tasks: list) -> list:
        """
        Run multiple async tasks concurrently.
        
        Args:
            tasks: List of async tasks to run
            
        Returns:
            List of results
        """
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return results
    
    def get_cache_stats(self) -> Dict[str, int]:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache statistics
        """
        return self.cache_stats.copy()
    
    def clear_cache_stats(self):
        """Clear cache statistics."""
        self.cache_stats = {"hits": 0, "misses": 0}

# Global performance optimizer instance
performance_optimizer = PerformanceOptimizer()

# Example usage functions
@performance_optimizer.timer
def example_heavy_computation(data: list) -> list:
    """Example of a heavy computation function."""
    # Simulate heavy computation
    result = [x ** 2 for x in data]
    return result

@performance_optimizer.cache_result(maxsize=64)
def example_cached_function(param1: str, param2: int) -> dict:
    """Example of a function with caching."""
    # Simulate some computation
    time.sleep(0.1)  # Simulate delay
    return {"param1": param1, "param2": param2, "result": param1 * param2}

async def example_async_task(name: str, delay: float) -> str:
    """Example async task."""
    await asyncio.sleep(delay)
    return f"Task {name} completed"

# Example usage
if __name__ == "__main__":
    # Example of timing a function
    data = list(range(1000))
    result = example_heavy_computation(data)
    print(f"Computed {len(result)} values")
    
    # Example of caching
    for i in range(5):
        result = example_cached_function("test", i % 3)
        print(f"Cached function result: {result}")
    
    # Example of concurrent async tasks
    async def run_async_example():
        tasks = [
            example_async_task("A", 0.1),
            example_async_task("B", 0.2),
            example_async_task("C", 0.15)
        ]
        results = await performance_optimizer.run_async_concurrent(tasks)
        print(f"Async results: {results}")
    
    # Run the async example
    asyncio.run(run_async_example())
    
    # Show cache stats
    print(f"Cache stats: {performance_optimizer.get_cache_stats()}")