// src/services/gameService.js
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';

// ==================== FASES ====================

export async function createPhase(phaseName, pointsPerGame, closingDate) {
  try {
    const phaseRef = doc(collection(db, 'phases'));
    await setDoc(phaseRef, {
      id: phaseRef.id,
      name: phaseName,
      pointsPerGame: pointsPerGame,
      closingDate: closingDate,
      status: 'open',
      createdAt: new Date(),
      matches: []
    });
    return phaseRef.id;
  } catch (error) {
    throw new Error('Erro ao criar fase: ' + error.message);
  }
}

export async function getAllPhases() {
  try {
    const snapshot = await getDocs(collection(db, 'phases'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    throw new Error('Erro ao buscar fases: ' + error.message);
  }
}

export async function updatePhase(phaseId, updates) {
  try {
    await updateDoc(doc(db, 'phases', phaseId), updates);
  } catch (error) {
    throw new Error('Erro ao atualizar fase: ' + error.message);
  }
}

export async function deletePhase(phaseId) {
  try {
    await deleteDoc(doc(db, 'phases', phaseId));
  } catch (error) {
    throw new Error('Erro ao deletar fase: ' + error.message);
  }
}

// ==================== MATCHES ====================

export async function createMatch(phaseId, homeTeam, awayTeam, matchDate) {
  try {
    const matchRef = doc(collection(db, 'matches'));
    await setDoc(matchRef, {
      id: matchRef.id,
      phaseId: phaseId,
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      homeGoals: null,
      awayGoals: null,
      date: matchDate,
      status: 'scheduled',
      createdAt: new Date()
    });
    
    // Adicionar match à lista de matches da fase
    const phase = doc(db, 'phases', phaseId);
    const phaseSnap = await getDocs(query(collection(db, 'phases')));
    
    return matchRef.id;
  } catch (error) {
    throw new Error('Erro ao criar match: ' + error.message);
  }
}

export async function getMatchesByPhase(phaseId) {
  try {
    const q = query(
      collection(db, 'matches'),
      where('phaseId', '==', phaseId),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    throw new Error('Erro ao buscar matches: ' + error.message);
  }
}

export async function getAllMatches() {
  try {
    const snapshot = await getDocs(
      query(collection(db, 'matches'), orderBy('date', 'asc'))
    );
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    throw new Error('Erro ao buscar matches: ' + error.message);
  }
}

export async function updateMatchResult(matchId, homeGoals, awayGoals) {
  try {
    await updateDoc(doc(db, 'matches', matchId), {
      homeGoals: homeGoals,
      awayGoals: awayGoals,
      status: 'finished'
    });
  } catch (error) {
    throw new Error('Erro ao atualizar resultado: ' + error.message);
  }
}

// ==================== PALPITES ====================

export async function placeBet(userId, matchId, homeGoals, awayGoals, phaseId) {
  try {
    const betRef = doc(collection(db, 'bets'));
    await setDoc(betRef, {
      id: betRef.id,
      userId: userId,
      matchId: matchId,
      phaseId: phaseId,
      homeGoals: homeGoals,
      awayGoals: awayGoals,
      timestamp: new Date(),
      points: 0
    });
    return betRef.id;
  } catch (error) {
    throw new Error('Erro ao fazer palpite: ' + error.message);
  }
}

export async function getBetsByUser(userId) {
  try {
    const q = query(
      collection(db, 'bets'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    throw new Error('Erro ao buscar palpites: ' + error.message);
  }
}

export async function getBetByUserAndMatch(userId, matchId) {
  try {
    const q = query(
      collection(db, 'bets'),
      where('userId', '==', userId),
      where('matchId', '==', matchId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.docs.length > 0) {
      return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id };
    }
    return null;
  } catch (error) {
    throw new Error('Erro ao buscar palpite: ' + error.message);
  }
}

export async function updateBet(betId, homeGoals, awayGoals) {
  try {
    await updateDoc(doc(db, 'bets', betId), {
      homeGoals: homeGoals,
      awayGoals: awayGoals,
      timestamp: new Date()
    });
  } catch (error) {
    throw new Error('Erro ao atualizar palpite: ' + error.message);
  }
}

export async function deleteBet(betId) {
  try {
    await deleteDoc(doc(db, 'bets', betId));
  } catch (error) {
    throw new Error('Erro ao deletar palpite: ' + error.message);
  }
}

// ==================== RANKING ====================

export async function getRanking() {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const usersData = snapshot.docs.map(doc => doc.data());
    return usersData.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  } catch (error) {
    throw new Error('Erro ao buscar ranking: ' + error.message);
  }
}

export async function updateUserPoints(userId, newTotalPoints) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      totalPoints: newTotalPoints
    });
  } catch (error) {
    throw new Error('Erro ao atualizar pontos: ' + error.message);
  }
}
