const socket = io();
socket.on('changeState', function(data) {
    console.log(data);
    const stateContainer = document.getElementById('state');
    stateContainer.innerHTML = `
        <p>id: ${socket.id}</p>
        <p>ходит: ${data.stepPlayerIndex}</p>
        <p>герой: Атака=${data.player.currentAttack}; Защита=${data.player.currentDefence}; Скорость=${data.player.currentSpeed};</p>
        <p>${data.state}: [round:${data.round}, step:${data.step}]</p>
        <p>speedRoll: ${data.rollsSpeed}</p>
        <p>attackRoll: ${data.rollAttack}</p>
        <p>defenceRoll: ${data.rollDefence}</p>
        <p>damage: ${data.damage}</p>
        <p>rollRecovery: ${data.rollRecovery}</p>
        <p>winner: ${data.winerPlayerIndex}</p>
    `;
});
socket.on('rollSpeed', function(data) {
    if (socket.id === data.playerId) {
        console.log("awaiting rollSpeed: press S");
        document.getElementById('awaiting').innerHTML = "awaiting rollSpeed: press S";
    }
});
socket.on('rollAttack', function(data) {
    if (socket.id === data.playerId) {
        console.log("awaiting rollAttack: press A");
        document.getElementById('awaiting').innerHTML = 'awaiting rollAttack: press A';
    }
});
socket.on('rollDefence', function(data) {
    if (socket.id === data.playerId) {
        console.log("awaiting rollDefence: press D");
        document.getElementById('awaiting').innerHTML = 'awaiting rollDefence: press D';
    }
});
socket.on('chooseDamageSet', function(data) {
    if (socket.id === data.playerId) {
        console.log(`awaiting chooseDamageSet: ${data.damage}. press B to change`);
        document.getElementById('awaiting').innerHTML = `awaiting chooseDamageSet: ${data.damage}. press B to change`;
    }
});
socket.on('rollRecovery', function(data) {
    if (socket.id === data.playerId) {
        console.log("awaiting rollRecovery: press C");
        document.getElementById('awaiting').innerHTML = 'awaiting rollRecovery: press C';
    }
});

document.addEventListener('keyup', function(event) {
    switch (event.keyCode) {
        case 83: // S
            socket.emit('rolledSpeed', {
                name: 'rolledSpeed',
            });
            document.getElementById('awaiting').innerHTML = '';
            break;
        case 65: // A
            socket.emit('rolledAttack', {
                name: 'rolledAttack',
            });
            document.getElementById('awaiting').innerHTML = '';
            break;
        case 68: // D
            socket.emit('rolledDefence', {
                name: 'rolledDefence',
            });
            document.getElementById('awaiting').innerHTML = '';
            break;
        case 66: // B
            let input = prompt("choose damage set", "attack,defence,speed");
            socket.emit('choosedDamageSet', {
                name: 'choosedDamageSet',
                damageSet: input.split(","),
            });
            document.getElementById('awaiting').innerHTML = '';
            break;
        case 67: // C
            socket.emit('rolledRecovery', {
                name: 'rolledRecovery',
            });
            document.getElementById('awaiting').innerHTML = '';
            break;
        default:
            console.log('keyup', event.keyCode);
    }
});

socket.emit('connected', {
    name: "player1",
    hero: {
        id: 1,
        name: prompt("type name", "player"),
        avatarUrl: "",
        attackDice: 2,
        defenceDice: 2,
        speedDice: 3,
    }
});
