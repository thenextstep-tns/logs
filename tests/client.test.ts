import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ESOLogsClient } from '../src/lib/esologs/client';

describe('ESOLogsClient', () => {
  let client: ESOLogsClient;

  beforeEach(() => {
    client = new ESOLogsClient('mock-api-key');
  });

  it('correctly constructs query url and filters trials', async () => {
    const mockZones = [
      { id: 18, name: 'Lucent Citadel', encounters: [{ id: 58, name: 'Count Ryelaz' }] },
      { id: 10, name: 'Dungeons', encounters: [{ id: 2000, name: 'Fungal Grotto I' }] },
      { id: 11, name: 'Maelstrom Arena', encounters: [{ id: 3000, name: 'Vale' }] }
    ];

    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockZones
    });

    const trials = await client.getHardModeTrials();
    expect(trials.length).toBe(1);
    expect(trials[0].name).toBe('Lucent Citadel');
  });

  it('enforces difficulty=122 and metric=speed on boss rankings request', async () => {
    let requestedUrl = '';
    global.fetch = vi.fn().mockImplementation((url: string) => {
      requestedUrl = url;
      return Promise.resolve({
        ok: true,
        json: async () => ({
          page: 1,
          hasMorePages: false,
          count: 1,
          rankings: [{ duration: 70000, reportID: 'R1', fightID: 1 }]
        })
      });
    });

    await client.getBossRankingsPage(58, 1);
    expect(requestedUrl).toContain('difficulty=122');
    expect(requestedUrl).toContain('metric=speed');
    expect(requestedUrl).toContain('rankings/encounter/58');
    expect(requestedUrl).toContain('api_key=mock-api-key');
  });
});
