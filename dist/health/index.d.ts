import { AnchorInfo, HealthStatus } from '../types';
export declare function checkHealth(anchor: AnchorInfo, timeoutMs?: number): Promise<HealthStatus>;
export declare function checkAllHealth(anchors: AnchorInfo[], timeoutMs?: number): Promise<HealthStatus[]>;
/**
 * Returns the first healthy anchor from the list, or throws if none are healthy.
 * Anchors are checked in parallel; the fastest healthy one wins.
 */
export declare function pickHealthyAnchor(anchors: AnchorInfo[], timeoutMs?: number): Promise<AnchorInfo>;
//# sourceMappingURL=index.d.ts.map