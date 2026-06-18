import React, { useState, useEffect, useMemo } from 'react';
import { Collapse, Tag, Spin, Typography, Empty } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { getAllMatches, getAllPhases, getAllBets, getRanking } from '../../services/gameService';
import { calculatePoints } from '../../services/pointsService';
import FlagImage from '../FlagImage';

const { Title, Text } = Typography;

const GREEN = '#008B46';
const BLUE  = '#0033A0';
const GOLD  = '#FFD500';

const PHASE_ORDER = ['Grupos', 'Round of 32', 'Oitavas', 'Quartas', 'Semis', 'Final'];

function fmtPlacar(hg, ag) {
  return hg != null && ag != null ? `${hg} × ${ag}` : '—';
}

function fmtData(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function PitacoGeral() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches]   = useState([]);
  const [phases, setPhases]     = useState([]);
  const [betsByMatch, setBetsByMatch] = useState({});
  const [users, setUsers]       = useState([]);
  const [phaseMap, setPhaseMap] = useState({});

  useEffect(() => {
    Promise.all([
      getAllMatches(),
      getAllPhases(),
      getAllBets(),
      getRanking(),
    ]).then(([allMatches, allPhases, allBets, allUsers]) => {
      const pm = Object.fromEntries(allPhases.map(p => [p.id, p]));
      setPhaseMap(pm);
      setMatches(allMatches);
      setUsers(allUsers);

      const sorted = [...allPhases].sort((a, b) => {
        const ia = PHASE_ORDER.indexOf(a.name);
        const ib = PHASE_ORDER.indexOf(b.name);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
      setPhases(sorted);

      const bm = {};
      allBets.forEach(b => {
        if (!bm[b.matchId]) bm[b.matchId] = [];
        bm[b.matchId].push(b);
      });
      setBetsByMatch(bm);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const matchesByPhase = useMemo(() => {
    const map = {};
    matches.forEach(m => {
      if (!map[m.phaseId]) map[m.phaseId] = [];
      map[m.phaseId].push(m);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => new Date(a.date) - new Date(b.date)));
    return map;
  }, [matches]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" tip="Carregando pitacos..." />
      </div>
    );
  }

  const hasAnyFinished = phases.some(p =>
    (matchesByPhase[p.id] ?? []).some(m => m.status === 'finished')
  );

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(90deg, ${GREEN}, ${BLUE})`,
        borderRadius: 16, padding: '20px 28px', marginBottom: 28,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <TrophyOutlined style={{ fontSize: 40, color: GOLD }} />
        <div>
          <Title level={3} style={{ color: 'white', margin: 0 }}>Pitaco Geral</Title>
          <Text style={{ color: 'rgba(255,255,255,0.75)' }}>
            Veja os palpites de todos nos jogos encerrados
          </Text>
        </div>
      </div>

      {!hasAnyFinished && (
        <Empty description="Nenhum jogo encerrado ainda." />
      )}

      {phases.map(phase => {
        const phaseMatches = (matchesByPhase[phase.id] ?? []).filter(m => m.status === 'finished');
        if (phaseMatches.length === 0) return null;

        const collapseItems = phaseMatches.map(match => {
          const matchBets  = betsByMatch[match.id] ?? [];
          const basePoints = phaseMap[match.phaseId]?.pointsPerGame ?? 0;

          const rows = users.map(user => {
            const bet = matchBets.find(b => b.userId === user.uid);
            const pts = bet
              ? calculatePoints(
                  { homeGoals: bet.homeGoals, awayGoals: bet.awayGoals, penaltyWinner: bet.penaltyWinner ?? null },
                  { homeGoals: match.homeGoals, awayGoals: match.awayGoals, penaltyWinner: match.penaltyWinner ?? null },
                  basePoints,
                )
              : 0;
            const isExact = bet && bet.homeGoals === match.homeGoals && bet.awayGoals === match.awayGoals;
            const isPenBonus = isExact && bet.homeGoals === bet.awayGoals
              && bet.penaltyWinner && match.penaltyWinner
              && bet.penaltyWinner === match.penaltyWinner;
            return { user, bet, pts, isExact, isPenBonus };
          });

          rows.sort((a, b) => b.pts - a.pts || (a.user.displayName || '').localeCompare(b.user.displayName || ''));

          return {
            key: match.id,
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: '#1a1a1a', flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <FlagImage name={match.homeTeam} height={14} />
                    {match.homeTeam}
                  </span>
                  <span style={{ color: '#aaa', fontWeight: 400, fontSize: 12 }}>vs</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <FlagImage name={match.awayTeam} height={14} />
                    {match.awayTeam}
                  </span>
                </span>
                <Tag style={{ background: GREEN, color: 'white', border: 'none', fontWeight: 700, fontFamily: 'monospace', fontSize: 14, padding: '2px 12px', margin: 0 }}>
                  {fmtPlacar(match.homeGoals, match.awayGoals)}
                </Tag>
                {match.penaltyWinner && (
                  <Tag style={{ background: '#722ed1', color: 'white', border: 'none', fontSize: 11, margin: 0 }}>
                    Pên: {match.penaltyWinner}
                  </Tag>
                )}
              </div>
            ),
            children: (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f5f7fa' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', color: '#666', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', borderBottom: '2px solid #e8eaed' }}>
                        Pitaqueiro
                      </th>
                      <th style={{ textAlign: 'center', padding: '8px 12px', color: '#666', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', borderBottom: '2px solid #e8eaed' }}>
                        Pitaco
                      </th>
                      <th style={{ textAlign: 'center', padding: '8px 12px', color: '#666', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', borderBottom: '2px solid #e8eaed', width: 80 }}>
                        Pontos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ user, bet, pts, isExact, isPenBonus }) => (
                      <tr
                        key={user.uid}
                        style={{ borderBottom: '1px solid #f0f0f0', background: pts > 0 ? 'rgba(0,139,70,0.03)' : 'white' }}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: 500, color: '#222' }}>
                          {user.displayName || user.email}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontFamily: 'monospace', fontSize: 15 }}>
                          {bet ? (
                            <span style={{ color: isExact ? GREEN : '#444' }}>
                              {fmtPlacar(bet.homeGoals, bet.awayGoals)}
                              {bet.penaltyWinner && (
                                <span style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>
                                  pên: {bet.penaltyWinner}
                                </span>
                              )}
                              {isExact && <span style={{ marginLeft: 6 }}>🎯</span>}
                            </span>
                          ) : (
                            <span style={{ color: '#ccc' }}>sem pitaco</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {pts > 0 ? (
                            <span style={{ fontWeight: 700, fontSize: 16, color: GREEN }}>
                              +{pts % 1 === 0 ? pts : pts.toFixed(1)}
                              {isPenBonus && (
                                <span style={{ fontSize: 10, color: '#722ed1', marginLeft: 3, fontWeight: 600 }}>×2</span>
                              )}
                            </span>
                          ) : (
                            <span style={{ color: '#ccc', fontSize: 13 }}>0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ),
          };
        });

        return (
          <div key={phase.id} style={{ marginBottom: 32 }}>
            {/* Cabeçalho da fase */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1, height: 1, background: '#e4e4e4' }} />
              <Tag style={{ background: BLUE, color: 'white', border: 'none', fontWeight: 700, fontSize: 12, padding: '3px 16px', borderRadius: 20, margin: 0 }}>
                {phase.name}
              </Tag>
              <div style={{ flex: 1, height: 1, background: '#e4e4e4' }} />
            </div>

            <Collapse
              items={collapseItems}
              expandIconPosition="end"
              style={{ background: 'white', borderRadius: 12, border: '1px solid #e8eaed', overflow: 'hidden' }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default PitacoGeral;
