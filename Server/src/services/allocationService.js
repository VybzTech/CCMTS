/**
 * LGA-matching batch allocator - a Node/Prisma port of the old Python
 * engine/allocation.py, run in-process rather than via a BullMQ/Redis
 * queue. Titan KV (the Redis stand-in - see KV/) doesn't implement
 * Lua scripting (no EVAL/EVALSHA), which BullMQ's core job-processing
 * relies on, so a queue-based worker can never actually pick up a job
 * against it, Python or Node. Since the allocation logic already runs
 * in the same Node process as the API, there's no need for a queue at
 * all here - trigger_auto_allocation in letter.controller.js just
 * calls runAllocation() directly.
 */
import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

/** Match score, low is best: 0 = letter's LGA is the courier's home
 *  base, 1 = one of the courier's other listed branches, 2 = no match
 *  at all (still allocatable, just a last resort). */
function matchScore(letterLga, courier) {
  if (letterLga === courier.baseLga) return 0;
  const otherBranches = Array.isArray(courier.otherBranchesLga) ? courier.otherBranchesLga : [];
  if (otherBranches.includes(letterLga)) return 1;
  return 2;
}

export async function runAllocation(letterIds) {
  const [letters, couriers] = await Promise.all([
    prisma.letter.findMany({
      where: { id: { in: letterIds.map((id) => BigInt(id)) }, status: 'Approved' },
      select: { id: true, lgaAddress: true, trackingId: true, createdById: true },
    }),
    prisma.courier.findMany({
      where: { availability: true },
      select: { id: true, name: true, activeTasks: true, baseLga: true, otherBranchesLga: true },
    }),
  ]);

  if (letters.length === 0 || couriers.length === 0) {
    logger.warn('Allocation: no approved letters or no available couriers - nothing to allocate.');
    return { allocated: 0, couriersUsed: 0 };
  }

  // Distribute as evenly as possible: no courier should get more than
  // this in one batch, until every other courier already has that many.
  const batchLimit = Math.ceil(letters.length / couriers.length);

  // Cartesian product of every (letter, courier) pair, each scored -
  // mirrors allocation.py's pd.merge cross-join + get_match_score.
  const candidates = [];
  for (const letter of letters) {
    for (const courier of couriers) {
      candidates.push({
        letterId: letter.id,
        courierId: courier.id,
        score: matchScore(letter.lgaAddress, courier),
        courierActiveTasks: courier.activeTasks,
      });
    }
  }

  // Best matches first; within a tie, prefer the courier who was
  // already least busy when the batch started.
  candidates.sort((a, b) => a.score - b.score || a.courierActiveTasks - b.courierActiveTasks);

  const assignedLetterKeys = new Set();
  const fillCounts = new Map(couriers.map((c) => [c.id.toString(), 0]));
  const allocations = [];

  for (const candidate of candidates) {
    const letterKey = candidate.letterId.toString();
    const courierKey = candidate.courierId.toString();
    if (assignedLetterKeys.has(letterKey)) continue;
    if (fillCounts.get(courierKey) >= batchLimit) continue;

    allocations.push({ letterId: candidate.letterId, courierId: candidate.courierId });
    assignedLetterKeys.add(letterKey);
    fillCounts.set(courierKey, fillCounts.get(courierKey) + 1);
  }

  // Second pass - anything the batch-limit left stranded (rounding,
  // or every candidate for it was already full) goes to whoever is
  // least loaded right now.
  for (const letter of letters) {
    const letterKey = letter.id.toString();
    if (assignedLetterKeys.has(letterKey)) continue;

    let bestCourierKey = null;
    let bestCount = Infinity;
    for (const [courierKey, count] of fillCounts) {
      if (count < bestCount) {
        bestCount = count;
        bestCourierKey = courierKey;
      }
    }

    allocations.push({ letterId: letter.id, courierId: BigInt(bestCourierKey) });
    assignedLetterKeys.add(letterKey);
    fillCounts.set(bestCourierKey, bestCount + 1);
  }

  const assignedAt = new Date();

  for (const { letterId, courierId } of allocations) {
    const updatedLetter = await prisma.letter.update({
      where: { id: letterId },
      data: { status: 'Assigned', courierId, assignedAt },
      include: { courier: { select: { name: true } } },
    });

    await prisma.letterTimeline.create({
      data: {
        letterId,
        status: 'Assigned',
        description: `Auto-assigned to courier: ${updatedLetter.courier?.name ?? 'unknown'} (LGA match)`,
      },
    });

    await prisma.notification.create({
      data: {
        userId: updatedLetter.createdById,
        type: 'info',
        title: 'Courier Assigned',
        message: `A courier has been auto-assigned to your letter ${updatedLetter.trackingId}.`,
        letterId: updatedLetter.id,
      },
    });
  }

  const perCourierCounts = new Map();
  for (const { courierId } of allocations) {
    const key = courierId.toString();
    perCourierCounts.set(key, (perCourierCounts.get(key) || 0) + 1);
  }
  for (const [courierKey, count] of perCourierCounts) {
    await prisma.courier.update({
      where: { id: BigInt(courierKey) },
      data: { activeTasks: { increment: count } },
    });
  }

  logger.info(`Allocation: allocated ${allocations.length} letter(s) across ${perCourierCounts.size} courier(s).`);
  return { allocated: allocations.length, couriersUsed: perCourierCounts.size };
}
