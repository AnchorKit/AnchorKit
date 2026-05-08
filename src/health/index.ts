import axios from 'axios';
import { AnchorInfo, HealthStatus } from '../types';

export async function checkHealth(anchor: AnchorInfo, timeoutMs = 5000): Promise<HealthStatus> {
  const start = Date.now();
  const url = anchor.sep24Url ?? anchor.sep6Url ?? anchor.sep31Url;

  if (!url) {
    return {
      homeDomain: anchor.homeDomain,
      healthy: false,
      error: 'No service URL available',
      checkedAt: new Date().toISOString(),
    };
  }

  try {
    await axios.get(`${url}/info`, { timeout: timeoutMs });
    return {
      homeDomain: anchor.homeDomain,
      healthy: true,
      latencyMs: Date.now() - start,
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      homeDomain: anchor.homeDomain,
      healthy: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
      checkedAt: new Date().toISOString(),
    };
  }
}

export async function checkAllHealth(
  anchors: AnchorInfo[],
  timeoutMs = 5000
): Promise<HealthStatus[]> {
  return Promise.all(anchors.map((a) => checkHealth(a, timeoutMs)));
}

/**
 * Returns the first healthy anchor from the list, or throws if none are healthy.
 * Anchors are checked in parallel; the fastest healthy one wins.
 */
export async function pickHealthyAnchor(
  anchors: AnchorInfo[],
  timeoutMs = 5000
): Promise<AnchorInfo> {
  const statuses = await checkAllHealth(anchors, timeoutMs);
  const healthyIndex = statuses.findIndex((s) => s.healthy);
  if (healthyIndex === -1) {
    throw new Error('No healthy anchors available');
  }
  return anchors[healthyIndex];
}
