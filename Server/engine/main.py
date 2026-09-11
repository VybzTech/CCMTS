# dlts_engine/main.py
import redis
import json
import time
from datetime import datetime
from config import REDIS_HOST, REDIS_PORT, QUEUE_WAIT, QUEUE_PREFIX
from allocation import run_allocation_engine

def start_worker():
    r_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
    print(f"Allocation Worker Listening on {QUEUE_WAIT}...")

    while True:
        try:
            # BullMQ/Redis Pattern: Block and Pop
            result = r_client.brpop(QUEUE_WAIT, timeout=30)
            
            if result: 
                _, job_id = result
                job_key = f"{QUEUE_PREFIX}:{job_id}"
                job_data_raw = r_client.hget(job_key, "data")

                if job_data_raw:
                    payload = json.loads(job_data_raw)
                    # Support both old 'letterIds' and new 'ids' format
                    l_ids = payload.get('letterIds') or payload.get('ids')

                    if l_ids:
                        print(f"Job {job_id}: Processing {len(l_ids)} letters.")
                        run_allocation_engine(l_ids)

                    # Cleanup Job (Simple removal for this example)
                    r_client.delete(job_key)

        except Exception as e:
            print(f"Worker Loop Error: {e}")
            time.sleep(5) # Prevent CPU spin on error

if __name__ == "__main__":
    start_worker()