const ELO = {
    STARTING_ELO: 1000,
    MULTIPLAYER_WIN: 20,
    MULTIPLAYER_LOSS: -10,
};

const SINGLE_PLAYER_ELO = {
    'easy': 5, 'medium': 10, 'hard': 15, 'expert': 20,
    '3x3': 5, '4x4': 10, '5x5': 15,
};

const TICKET_REWARD = {
    FIRST_MILESTONE_ELO: 1100,
    FIRST_MILESTONE_TICKETS: 5,
    INTERVAL_MILESTONE_START: 1300,
    INTERVAL_MILESTONE_STEP: 200,
    INTERVAL_MILESTONE_TICKETS: 5,
};

async function updateUserEloAndCheckMilestones(username, eloChange, { User, clients }) {
    const user = await User.findOne({ username });
    if (!user) return;

    const oldElo = user.elo;
    user.elo = Math.max(0, oldElo + eloChange); // ELO không bao giờ âm
    const newElo = user.elo;

    let ticketChange = 0;
    if (newElo > oldElo) {
        if (newElo >= TICKET_REWARD.FIRST_MILESTONE_ELO && !user.claimedFirstMilestone) {
            ticketChange += TICKET_REWARD.FIRST_MILESTONE_TICKETS;
            user.claimedFirstMilestone = true;
        }

        const oldIntervals = oldElo < TICKET_REWARD.INTERVAL_MILESTONE_START ? -1 : Math.floor((oldElo - TICKET_REWARD.INTERVAL_MILESTONE_START) / TICKET_REWARD.INTERVAL_MILESTONE_STEP);
        const newIntervals = newElo < TICKET_REWARD.INTERVAL_MILESTONE_START ? -1 : Math.floor((newElo - TICKET_REWARD.INTERVAL_MILESTONE_START) / TICKET_REWARD.INTERVAL_MILESTONE_STEP);

        if (newIntervals > oldIntervals) {
            ticketChange += (newIntervals - oldIntervals) * TICKET_REWARD.INTERVAL_MILESTONE_TICKETS;
        }
    }

    if (ticketChange > 0) {
        user.gachaTickets += ticketChange;
    }

    await user.save();

    const userWs = clients.get(username);
    if (userWs) {
        userWs.send(JSON.stringify({
            type: 'rewards:updated',
            payload: {
                newElo: user.elo,
                newGachaTickets: user.gachaTickets,
                eloChange,
                ticketChange,
            }
        }));
    }
}

async function handleMultiplayerGameEnd(winnerUsername, loserUsername, context) {
    if (!winnerUsername || !loserUsername) return;
    await Promise.all([
        updateUserEloAndCheckMilestones(winnerUsername, ELO.MULTIPLAYER_WIN, context),
        updateUserEloAndCheckMilestones(loserUsername, ELO.MULTIPLAYER_LOSS, context)
    ]);
}

async function handleSinglePlayerWin(username, difficultyKey, context) {
    if (!username || !difficultyKey) return;
    const eloGain = SINGLE_PLAYER_ELO[difficultyKey.toLowerCase()] || 0;
    if (eloGain === 0) return;
    await updateUserEloAndCheckMilestones(username, eloGain, context);
}

module.exports = {
    handleMultiplayerGameEnd,
    handleSinglePlayerWin,
    ELO_STARTING_POINT: ELO.STARTING_ELO,
};