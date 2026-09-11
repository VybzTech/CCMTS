# /engine/allocation.py
import math
import pandas as pd
import json
from datetime import datetime
from sqlalchemy import update, text
from database import get_session
from models import Courier, Letter

def run_allocation_engine(letter_ids):
    session = get_session()
    
    # 1. Fetch Data
    letters_query = text("""
        SELECT id, lga_address, priority, liability_value
        FROM letters 
        WHERE id IN :l_ids AND status = 'Approved'
    """)

    couriers_query = text("""
        SELECT id, name, active_tasks, base_lga, other_branches_lga
        FROM couriers 
        WHERE availability = 1
    """)

    try:
        letters_raw = [dict(r._mapping) for r in session.execute(letters_query, {"l_ids": tuple(letter_ids)})]
        couriers_raw = [dict(r._mapping) for r in session.execute(couriers_query)]

        if not letters_raw or not couriers_raw:
            print("Warning: No data available for allocation.")
            return

        df_letters = pd.DataFrame(letters_raw)
        df_couriers = pd.DataFrame(couriers_raw)

        # Parse JSON for other_branches_lga if it's a string
        def parse_json(val):
            if isinstance(val, str):
                try:
                    return json.loads(val)
                except:
                    return []
            return val if isinstance(val, list) else []

        df_couriers['other_branches'] = df_couriers['other_branches_lga'].apply(parse_json)

        final_allocations = []
        allocation_time = datetime.now()

        # --- ALLOCATION LOGIC: LGA MATCHING ---
        
        # A. Determine Batch Size
        total_letters = len(df_letters)
        total_couriers = len(df_couriers)
        BATCH_LIMIT = math.ceil(total_letters / total_couriers)
        print(f"Goal: Distribution with goal of max {BATCH_LIMIT} letters per courier.")

        # B. Cartesian Product for candidates
        df_letters['key'] = 1
        df_couriers['key'] = 1
        
        candidates = pd.merge(
            df_letters[['id', 'lga_address', 'key']],
            df_couriers[['id', 'base_lga', 'other_branches', 'active_tasks', 'key']],
            on='key', 
            suffixes=('_l', '_c')
        )

        # C. Calculate "Match Score"
        # 0 = Best (Base LGA match)
        # 1 = Good (Other Branch match)
        # 2 = Generic (No match)
        def get_match_score(row):
            if row['lga_address'] == row['base_lga']:
                return 0
            if row['lga_address'] in row['other_branches']:
                return 1
            return 2

        candidates['match_score'] = candidates.apply(get_match_score, axis=1)

        # D. Sort by Match Score, then by Courier Load (active_tasks)
        candidates.sort_values(by=['match_score', 'active_tasks'], ascending=[True, True], inplace=True)

        # E. Allocation Loop
        assigned_letters = set()
        courier_fill_counts = {cid: 0 for cid in df_couriers['id']}
        
        # First Pass: Try to honor BATCH_LIMIT and Match Score
        for row in candidates.itertuples():
            l_id = row.id_l
            c_id = row.id_c
            
            if l_id in assigned_letters:
                continue
                
            # Allow some flexibility if it's a perfect match (0), maybe?
            # But let's stick to BATCH_LIMIT to ensure distribution.
            if courier_fill_counts[c_id] >= BATCH_LIMIT:
                continue

            final_allocations.append({
                'id': l_id,
                'courier_id': c_id,
                'status': 'Assigned',
                'assigned_at': allocation_time
            })
            
            assigned_letters.add(l_id)
            courier_fill_counts[c_id] += 1

        # Second Pass: Assign any remainders (if BATCH_LIMIT was too strict or math rounding)
        if len(assigned_letters) < total_letters:
            remaining_letters = df_letters[~df_letters['id'].isin(assigned_letters)]
            for l_row in remaining_letters.itertuples():
                # Just pick the courier with the absolute lowest current fill count
                c_id_best = min(courier_fill_counts, key=courier_fill_counts.get)
                
                final_allocations.append({
                    'id': l_row.id,
                    'courier_id': c_id_best,
                    'status': 'Assigned',
                    'assigned_at': allocation_time
                })
                assigned_letters.add(l_row.id)
                courier_fill_counts[c_id_best] += 1

        # --- PHASE 2: DB COMMIT ---
        if final_allocations:
            session.execute(update(Letter), final_allocations)

            from collections import Counter
            counts = Counter([x['courier_id'] for x in final_allocations])
            
            for c_id, count in counts.items():
                session.execute(
                    update(Courier)
                    .where(Courier.id == c_id)
                    .values(active_tasks=Courier.active_tasks + count)
                    .execution_options(synchronize_session=False)
                )
            
            session.commit()
            print(f"Success: Allocated {len(final_allocations)} letters based on LGA matching.")
            
    except Exception as e:
        session.rollback()
        print(f"Error in allocation engine: {e}")
    finally:
        session.close()