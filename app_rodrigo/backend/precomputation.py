import os
import json
import base64
import concurrent.futures
import time
import psutil
from routesold import fetch_configs, generate_plot, generate_grid_plot

# Create directories if they don't exist
os.makedirs("precomputed/boundary/json", exist_ok=True)
os.makedirs("precomputed/boundary/png", exist_ok=True)
os.makedirs("precomputed/diagnostics/json", exist_ok=True)
os.makedirs("precomputed/diagnostics/png", exist_ok=True)

# Add this class to your file
class BatchWriter:
    def __init__(self):
        self.buffer = {}
    
    def write(self, path, data, binary=False):
        self.buffer[path] = (data, binary)
        if len(self.buffer) >= 5:  # Flush every 5 files
            self.flush()
    
    def flush(self):
        for path, (data, binary) in self.buffer.items():
            os.makedirs(os.path.dirname(path), exist_ok=True)
            mode = "wb" if binary else "w"
            with open(path, mode) as f:
                f.write(data)
        self.buffer.clear()

# Function to process a single configuration
def process_config(config):
    config_id = config[0]
    
    # Skip if both files already exist
    if (os.path.exists(f"precomputed/boundary/json/{config_id}.json") and 
        os.path.exists(f"precomputed/diagnostics/png/{config_id}.png")):
        return {"config_id": config_id, "boundary_success": True, "diagnostics_success": True, "skipped": True}
    
    result = {"config_id": config_id, "boundary_success": False, "diagnostics_success": False}
    
    # Generate boundary visualization
    try:
        boundary_result = generate_plot(config)
        
        # Save boundary PNG
        if boundary_result["image"]:
            writer = BatchWriter()
            writer.write(f"precomputed/boundary/png/{config_id}.png", 
                         base64.b64decode(boundary_result["image"]), binary=True)
        
        # Save boundary JSON
        if boundary_result["interactive_data"]:
            with open(f"precomputed/boundary/json/{config_id}.json", "w") as f:
                f.write(boundary_result["interactive_data"])
        
        result["boundary_success"] = True
    except Exception as e:
        result["boundary_error"] = str(e)
    
    # Generate diagnostic plots
    try:
        grid_result = generate_grid_plot(config)
        
        # Save diagnostics PNG
        if grid_result["image"]:
            with open(f"precomputed/diagnostics/png/{config_id}.png", "wb") as f:
                f.write(base64.b64decode(grid_result["image"]))
        
        # Save individual diagnostic JSONs
        if grid_result["interactive_data"]:
            os.makedirs(f"precomputed/diagnostics/json/{config_id}", exist_ok=True)
            
            for name, plot_json in grid_result["interactive_data"].items():
                try:
                    safe_name = name.replace('/', '_').replace('\\', '_')
                    plot_path = f"precomputed/diagnostics/json/{config_id}/{safe_name}.json"
                    with open(plot_path, "w") as f:
                        f.write(plot_json)
                except Exception:
                    pass
                    
        result["diagnostics_success"] = True
    except Exception as e:
        result["diagnostics_error"] = str(e)
    
    writer.flush()
    return result

def main():
    # Fetch all configurations
    configs = fetch_configs()
    total = len(configs)
    
    # Define batch_size before using it in the resumption logic
    batch_size = 100  # Move this line up here
    
    # Check for existing progress
    start_batch = 0
    completed = 0
    success_count = 0
    start_time = time.time()
    
    if os.path.exists("precomputation_progress.json"):
        try:
            with open("precomputation_progress.json", "r") as f:
                progress = json.load(f)
                start_batch = progress["last_batch"] + batch_size  # Now batch_size is defined
                completed = progress["completed"]
                success_count = progress["success_count"]
                previous_elapsed = progress["elapsed_time"]
                
                # Adjust start time to account for previous work
                start_time = time.time() - previous_elapsed
                
                print(f"Resuming from batch starting at index {start_batch}")
                print(f"Already completed {completed} configurations ({success_count} successful)")
        except Exception as e:
            print(f"Error loading progress file: {e}")
            print("Starting from the beginning")
    
    print(f"Starting batch precomputation for {total} stellarator configurations...")
    
    # Determine number of workers
    physical_cores = psutil.cpu_count(logical=False)
    max_workers = physical_cores  # Or even physical_cores - 1
    print(f"Using {max_workers} CPU cores")
    
    # Process in batches of 100 configurations
    batch_size = 100
    
    # Start from the batch where we left off
    for batch_start in range(start_batch, total, batch_size):
        batch_end = min(batch_start + batch_size, total)
        batch_configs = configs[batch_start:batch_end]
        
        print(f"\nProcessing batch {batch_start//batch_size + 1}/{(total+batch_size-1)//batch_size}")
        
        # Check memory usage before submitting tasks
        if psutil.virtual_memory().percent > 90:
            print("Memory usage high (>90%), waiting 60 seconds before next batch")
            time.sleep(60)
        
        with concurrent.futures.ProcessPoolExecutor(max_workers=max_workers) as executor:
            # Submit batch of tasks
            future_to_config = {executor.submit(process_config, config): config[0] 
                               for config in batch_configs}
            
            # In the main loop:
            for future in concurrent.futures.as_completed(future_to_config):
                config_id = future_to_config[future]
                completed += 1
                
                try:
                    # Add a timeout to prevent stuck tasks
                    result = future.result(timeout=600)  # 5-minute timeout
                    if result["boundary_success"] and result["diagnostics_success"]:
                        success_count += 1
                        status = "✓"
                    else:
                        status = "⚠"
                    
                    # Progress reporting
                    elapsed = time.time() - start_time
                    configs_per_second = completed / elapsed
                    estimated_total_time = total / configs_per_second
                    remaining_time = estimated_total_time - elapsed
                    
                    print(f"[{completed}/{total}] {status} Config {config_id} - "
                          f"{configs_per_second:.2f} configs/sec - "
                          f"Est. remaining: {remaining_time/3600:.1f} hours")
                    
                except concurrent.futures.TimeoutError:
                    print(f"Configuration {config_id} timed out after 5 minutes")
                except Exception as e:
                    print(f"[{completed}/{total}] ✗ Error with config {config_id}: {e}")
        
        # Optional: Save progress after each batch
        with open("precomputation_progress.json", "w") as f:
            json.dump({
                "completed": completed,
                "success_count": success_count,
                "last_batch": batch_start,
                "elapsed_time": time.time() - start_time
            }, f)
    
    # Final report
    end_time = time.time()
    total_time = end_time - start_time
    print(f"\nPrecomputation complete!")
    print(f"Total time: {total_time/3600:.2f} hours")
    print(f"Successful configurations: {success_count}/{total}")
    print(f"Average processing time: {total_time/completed:.2f} seconds per configuration")

if __name__ == "__main__":
    main()