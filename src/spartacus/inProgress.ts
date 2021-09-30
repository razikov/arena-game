class InProgress
{
    getAIGameEventHandler(player) {
        return {
            next: (v) => {
                if (v == null) { // пропустить начальное значение
                    return;
                }
                if (player !== v.player) {
                    return;
                }
                console.log('fromGameEvent: ', v);
                switch (v.name) {
                    case 'rollSpeed':
                        player.rollSpeed();
                        break;
                    case 'rollAttack':
                        player.rollAttack();
                        break;
                    case 'rollDefence':
                        player.rollDefence();
                        break;
                    case 'chooseDamageSet':
                        player.chooseDamageSet(v.damage);
                        break;
                    case 'rollRecovery':
                        player.rollRecovery();
                        break;
                    default:
                        console.warn("event not support: " + v.name);
                        break;
                }
            }
        }
    }
}