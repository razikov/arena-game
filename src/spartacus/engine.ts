import { Hero } from './hero';

// Bugs:

interface PlayerI
{
    isWin: boolean;
    lastEvent: string;

    getHits(): number;
    takeDamage(damages: string[]): void;
    recovery(roll: number[]): void;
    isNeedRecovery(): boolean;
    rollSpeed(): number[];
    rollAttack(): number[];
    rollDefence(): number[];
    rollRecovery(): number[];
    generateDamageSet(damage: number): string[];
    setLastEvent(event: any): void;
    canApplyDamageSet(damageSet: string[]): boolean;
}

class Player implements PlayerI
{
    hero: Hero;
    dice: Dice;
    currentAttack: number;
    currentDefence: number;
    currentSpeed: number;
    needRecovery: number;
    isDie: boolean;
    isWin: boolean;
    lastEvent: string;

    constructor(hero: Hero, dice: Dice = new Dice(1, 6)) {
        this.hero = hero;
        this.currentAttack = hero.attackDice;
        this.currentDefence = hero.defenceDice;
        this.currentSpeed = hero.speedDice;
        this.isDie = false;
        this.isWin = false;
        this.needRecovery = 0;
        this.dice = dice;
        this.lastEvent = '';
    }

    setLastEvent(event: any) {
        this.lastEvent = event;
    }

    rollAttack(): number[] {
        return this.roll(this.dice, this.currentAttack);
    }

    rollDefence(): number[] {
        return this.roll(this.dice, this.currentDefence)
    }

    rollSpeed(): number[] {
        return this.roll(this.dice, this.currentSpeed);
    }

    rollRecovery(): number[] {
        return this.roll(this.dice);
    }

    recovery(roll: number[]) {
        let value = roll.reduce((sum, current) => {
            return sum + current;
        }, 0);

        if (value >= 5) {
            this.needRecovery--;
        } else if (value <= 2) {
            this.isDie = true;
        }
        return this;
    }

    generateDamageSet(damage: number): string[] {
        // TODO: добавить решаюшее дерево для AI
        let takeDamage = [];
        if (damage > this.getHits()) {
            damage = this.getHits();
        }
        let currentDices = [this.currentAttack, this.currentDefence, this.currentSpeed];
        let attrs = ['attack', 'defence', 'speed'];
        while(damage > 0) {
            let sum = currentDices.reduce(function(sum, current) {
                return sum + current;
            }, 0)
            while(true) {
                let rand = Math.floor(Math.random() * 3);
                let canLost = this.canLostDiceRule(currentDices[rand], sum);
                if (canLost) {
                    takeDamage.push(attrs[rand]);
                    currentDices[rand]--;
                    break;
                }
            }
            damage--;
        }
        console.log(damage, takeDamage);
        return takeDamage;
    }

    isNeedRecovery() {
        return !this.isDie && this.needRecovery !== 0;
    }

    roll(dice: Dice, count: number = 1): number[] {
        let roll = [];
        for (let index = 0; index < count; index++) {
            roll.push(dice.roll());
        }
        return roll;
    }

    takeDamage(damageSet: string[]) {
        damageSet.forEach(attr => {
            switch (attr) {
                case 'attack':
                    if (this.canLostDiceRule(this.currentAttack, this.getHits())) {
                        this.currentAttack--;
                    } else {
                        throw new Error("attribute " + attr + " does not lost");
                    }
                    break;
                case 'defence':
                    if (this.canLostDiceRule(this.currentDefence, this.getHits())) {
                        this.currentDefence--;
                    } else {
                        throw new Error("attribute " + attr + " does not lost");
                    }
                    break;
                case 'speed':
                    if (this.canLostDiceRule(this.currentSpeed, this.getHits())) {
                        this.currentSpeed--;
                    } else {
                        throw new Error("attribute " + attr + " does not lost");
                    }
                    break;
                default: throw new Error("attribute " + attr + " does not exist");
            }
        });
        if (this.getHits() == 2) {
            this.needRecovery = 1;
        }
        if (this.getHits() == 1) {
            this.needRecovery = 2;
        }
        if (this.getHits() == 0) {
            this.isDie = true;
        }
    }

    getHits(): number {
        return this.currentAttack + this.currentDefence + this.currentSpeed;
    }

    canLostDiceRule(current: number, all: number) {
        let isLastDice = (current == 1 && [1,2,3].includes(all));
        let isCanLost = current > 1;
        return isCanLost || isLastDice;
    }

    canApplyDamageSet(damageSet: string[]): boolean {
        let currentAttack = this.currentAttack;
        let currentDefence = this.currentDefence;
        let currentSpeed = this.currentSpeed;
        let all = currentAttack + currentDefence + currentSpeed;
        let result = true;
        damageSet.forEach(attr => {
            switch (attr) {
                case 'attack':
                    if (this.canLostDiceRule(currentAttack, all)) {
                        currentAttack--;
                    } else {
                        result = false;
                    }
                    break;
                case 'defence':
                    if (this.canLostDiceRule(currentDefence, all)) {
                        currentDefence--;
                    } else {
                        result = false;
                    }
                    break;
                case 'speed':
                    if (this.canLostDiceRule(currentSpeed, all)) {
                        currentSpeed--;
                    } else {
                        result = false;
                    }
                    break;
                default: result = false;
            }
            all = currentAttack + currentDefence + currentSpeed;
        });
        return result;
    }
}

class Dice
{
    min: number;
    max: number;

    // Максимум и минимум включаются
    constructor(min: number, max: number) {
        this.min = min;
        this.max = max;
    }

    roll() {
        return Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
    }
}

interface GameState
{
    name: string;
    context: GameContext;

    next(): boolean;
    handle(event: any): void; // обрабатывает события игроков
}

class BaseState
{
    static NAME = 'BaseState';
    name = 'BaseState';
    context: GameContext;

    constructor(context: GameContext) {
        this.context = context;
    }

    handle(event: any) {
        console.warn("can't handle event: ", event, "; in: ", this.name);
    }

    onChangeState(): void {
        console.log('send context', this.context);
        this.context.players.forEach((player, playerKey) => {
            this.context.emitCallback(playerKey, 'changeState', this.context.sendState(playerKey));
        })
    }

    protected emit(event: any, socketId: string) {
        this.context.emitCallback(socketId, event.name, event);
    }
}

class StartGame extends BaseState implements GameState
{
    static NAME = 'StartGame';
    name = 'StartGame';

    next() {
        console.log('onStartGame');
        this.context.state = new StartRound(this.context);
        this.onChangeState();
        return true;
    }
}
class StartRound extends BaseState implements GameState
{
    static NAME = 'StartRound';
    name = 'StartRound';

    next() {
        this.context.startRound();
        this.context.state = new RollSpeed(this.context);
        this.onChangeState();
        return true;
    }
}
class RollSpeed extends BaseState implements GameState
{
    static NAME = 'RollSpeed';
    name = 'RollSpeed';

    next() {
        // TODO: как повторно испустить события на броски кубиков для игрока который кубики не кинул через время ожидания?
        // NOTE: сначало меняем состояние на случай если событие обработается раньше чем мы будем ожидать его
        this.context.resetSpeedRoll()
        this.context.state = new WaitRolledSpeed(this.context);
        this.onChangeState();
        this.context.players.forEach((player, key) => {
            this.emit({
                name: 'rollSpeed',
                playerId: key
            }, key)
        })
        return true;
    }
}
class WaitRolledSpeed extends BaseState implements GameState
{
    static NAME = 'WaitRolledSpeed';
    name = 'WaitRolledSpeed';

    next() {
        if (this.context.hasRolledSpeed()) {
            this.context.state = new RolledSpeed(this.context);
            this.onChangeState();
            return true;
        }
        return false
    }

    handle(event: any) {
        if (event.name !== 'rolledSpeed') {
            return;
        } else {
            this.context.addSpeedRoll(event.playerId);
            this.onChangeState();
            this.next();
            return;
        }
    }
}
class RolledSpeed extends BaseState implements GameState
{
    static NAME = 'RolledSpeed';
    name = 'RolledSpeed';

    next() {
        if (this.context.hasEqualRolledSpeed()) {
            this.context.state = new RollSpeed(this.context);
            this.onChangeState();
            return true;
        } else {
            // @todo избавиться от разделения пользователей, сделать очередь
            this.context.chooseFirstPlayer();
            this.context.state = new ActionsFirstPlayer(this.context);
            this.onChangeState();
            return true;
        }
    }
}
class ActionsFirstPlayer extends BaseState implements GameState
{
    static NAME = 'ActionsFirstPlayer';
    name = 'ActionsFirstPlayer';

    next() {
        this.context.chooseFirstPlayer();
        this.context.state = new WaitRolledAttackAndDefence(this.context);
        this.onChangeState();
        const attackPlayerKey = this.context.getKeyByPlayer(this.context.getAttackPlayer());
        const defencePlayerKey = this.context.getKeyByPlayer(this.context.getDefencePlayer());
        this.emit({
            name: 'rollAttack',
            playerId: attackPlayerKey,
        }, attackPlayerKey);
        this.emit({
            name: 'rollDefence',
            playerId: defencePlayerKey,
        }, defencePlayerKey);
        return true;
    }
}
class ActionsSecondPlayer extends BaseState implements GameState
{
    static NAME = 'ActionsSecondPlayer';
    name = 'ActionsSecondPlayer';

    next() {
        this.context.chooseSecondPlayer();
        this.context.state = new WaitRolledAttackAndDefence(this.context);
        this.onChangeState();
        const attackPlayerKey = this.context.getKeyByPlayer(this.context.getAttackPlayer());
        const defencePlayerKey = this.context.getKeyByPlayer(this.context.getDefencePlayer());
        this.emit({
            name: 'rollAttack',
            playerId: attackPlayerKey,
        }, attackPlayerKey);
        this.emit({
            name: 'rollDefence',
            playerId: defencePlayerKey,
        }, defencePlayerKey);
        return true;
    }
}
class WaitRolledAttackAndDefence extends BaseState implements GameState
{
    static NAME = 'WaitRolledAttackAndDefence';
    name = 'WaitRolledAttackAndDefence';

    next() {
        if (this.context.hasRolledAttackAndDefence()) {
            this.context.state = new RolledAttackAndDefence(this.context);
            this.onChangeState();
            return true;
        }
        return false
    }

    handle(event) {
        if (['rolledAttack', 'rolledDefence'].indexOf(event.name) === -1) {
            console.warn(event.name + " not in ['rolledAttack', 'rolledDefence']");
            return;
        }
        if (event.name === 'rolledAttack') {
            this.context.addAttackRoll(event.playerId);
            this.onChangeState();
        } else if (event.name === 'rolledDefence') {
            this.context.addDefenceRoll(event.playerId);
            this.onChangeState();
        }
        this.next();
    }
}
class RolledAttackAndDefence extends BaseState implements GameState
{
    static NAME = 'RolledAttackAndDefence';
    name = 'RolledAttackAndDefence';

    next() {
        this.context.calculateDamage()
        if (this.context.damage > 0) {
            this.context.state = new ChooseDamage(this.context);
            this.onChangeState();
            return true;
        } else if (this.context.isFirstPlayerAction()) {
            this.context.state = new ActionsSecondPlayer(this.context);
            this.onChangeState();
            return true;
        } else if (this.context.isSecondPlayerAction()) {
            this.context.state = new StartRound(this.context);
            this.onChangeState();
            return true;
        } else {
            throw new Error("неожиданное состояние!");
        }
    }
}
class ChooseDamage extends BaseState implements GameState
{
    static NAME = 'ChooseDamage';
    name = 'ChooseDamage';

    next() {
        this.context.state = new WaitChoosedDamage(this.context);
        this.onChangeState();
        const defencePlayerKey = this.context.getKeyByPlayer(this.context.getDefencePlayer());
        this.emit({
            name: 'chooseDamageSet',
            damage: this.context.damage,
            playerId: defencePlayerKey,
        }, defencePlayerKey)
        return true;
    }
}
class WaitChoosedDamage extends BaseState implements GameState
{
    static NAME = 'WaitChoosedDamage';
    name = 'WaitChoosedDamage';

    next() {
        if (this.context.damageSet) {
            this.context.state = new ChoosedDamage(this.context);
            this.onChangeState();
            return true;
        }
        return false;
    }

    handle(event) {
        if (event.name !== 'choosedDamageSet') {
            console.warn(event.name + " != " + 'choosedDamageSet');
            return;
        } else if (this.isValid(event.damageSet, event.playerId)) {
            this.context.addDamageSet(event.damageSet, event.playerId);
            this.next();
        } else {
            this.context.state = new ChooseDamage(this.context);
            this.onChangeState();
            return;
        }
    }

    isValid(damageSet: string[], playerId: string): boolean {
        let isValidDamageSet = this.context.damage === damageSet.length;
        let isValidPlayer = this.context.getDefencePlayer() === this.context.players.get(playerId);
        let canApplyDamageSet = this.context.getDefencePlayer().canApplyDamageSet(damageSet);
        return isValidDamageSet && isValidPlayer && canApplyDamageSet;
    }
}
class ChoosedDamage extends BaseState implements GameState
{
    static NAME = 'ChoosedDamage';
    name = 'ChoosedDamage';

    next() {
        this.context.takeDamage()
        if (this.context.isEndGame()) {
            this.context.state = new ChoosedWinner(this.context);
            this.onChangeState();
            return true;
        } else if (this.context.isFirstPlayerAction()) {
            this.context.state = new ActionsSecondPlayer(this.context);
            this.onChangeState();
            return true;
        } else if (this.context.isSecondPlayerAction()) {
            this.context.state = new StartRound(this.context);
            this.onChangeState();
            return true;
        } else {
            throw new Error("неожиданное состояние!")
        }
    }
}
class ChoosedWinner extends BaseState implements GameState
{
    static NAME = 'ChoosedWinner';
    name = 'ChoosedWinner';

    next() {
        this.context.changeWiner()
        if (this.context.isNeedRecovery()) {
            this.context.state = new RollRecovery(this.context);
            this.onChangeState();
            return true;
        } else {
            this.context.state = new EndGame(this.context);
            this.onChangeState();
            return true;
        }
    }
}
class RollRecovery extends BaseState implements GameState
{
    static NAME = 'RollRecovery';
    name = 'RollRecovery';

    next() {
        this.context.resetRecoveryRoll();
        this.context.state = new WaitRolledRecovery(this.context);
        this.onChangeState();
        const looserPlayerKey = this.context.getKeyByPlayer(this.context.getLooserPlayer());
        this.emit({
            name: 'rollRecovery',
            playerId: looserPlayerKey,
        }, looserPlayerKey)
        return true;
    }
}
class WaitRolledRecovery extends BaseState implements GameState
{
    static NAME = 'WaitRolledRecovery';
    name = 'WaitRolledRecovery';

    next() {
        if (this.context.rollRecovery) {
            this.context.state = new RolledRecovery(this.context);
            this.onChangeState();
            return true;
        }
    }

    handle(event) {
        if (event.name !== 'rolledRecovery') {
            console.warn(event.name + " != " + 'rolledRecovery');
            return;
        } else {
            this.context.addRecoveryRoll(event.playerId);
            this.next();
        }
    }
}
class RolledRecovery extends BaseState implements GameState
{
    static NAME = 'RolledRecovery';
    name = 'RolledRecovery';

    next() {
        this.context.recovery()
        if (this.context.isNeedRecovery()) {
            this.context.state = new RollRecovery(this.context);
            this.onChangeState();
            return true;
        } else {
            this.context.state = new EndGame(this.context);
            this.onChangeState();
            return true;
        }
    }
}
class EndGame extends BaseState implements GameState
{
    static NAME = 'EndGame';
    name = 'EndGame';

    next() {
        return false;
        console.warn('наградить!')
    }
}

class GameContext
{
    // static readonly FIRST_PLAYER = 0;
    // static readonly SECOND_PLAYER = 1;

    state: GameState;
    dice: Dice;
    players: Map<string, PlayerI>;
    round: number;
    step: number;
    rollsSpeed: Map<string, number[]> | undefined;
    rollsSpeedValue: Map<string, number> | undefined;
    playersRoundOrder: string[];
    stepPlayerIndex: string; // определяет чей ход
    winerPlayerIndex: string | undefined; // ключ игрока
    rollAttack: number[] | undefined;
    rollDefence: number[] | undefined;
    damage: number | undefined;
    damageSet: string[] | undefined;
    rollRecovery: number[] | undefined;
    emitCallback;

    constructor(emitCallback, dice) {
        this.state = new StartGame(this);
        this.dice = dice;
        this.players = new Map();
        this.round = 0;
        this.emitCallback = emitCallback
    }

    roll(dice: Dice, count: number = 1): number[] {
        let roll = [];
        for (let index = 0; index < count; index++) {
            roll.push(dice.roll());
        }
        return roll;
    }

    hasRolledSpeed(): boolean {
        return this.rollsSpeedValue.size == this.players.size;
    }

    hasEqualRolledSpeed(): boolean {
        // @todo если в отсортированном броске скорости встречается пара одинаковых значений оба должны перекинуть
        return false;
    }

    hasRolledAttackAndDefence(): boolean {
        return this.rollAttack !== null && this.rollDefence !== null;
    }

    isEndGame(): boolean {
        let isEndGame = false;
        this.players.forEach((player, key) => {
            isEndGame = isEndGame || player.getHits() < 3;
        });
        return isEndGame;
    }

    isNeedRecovery(): boolean {
        return this.getLooserPlayer().isNeedRecovery();
    }

    recovery() {
        this.getLooserPlayer().recovery(this.rollRecovery);
    }

    getKeyByPlayer(player: PlayerI): string {
        let resultKey = '';
        this.players.forEach((currentPlayer, key) => {
            if (currentPlayer == player) {
                resultKey = key;
            }
        });
        return resultKey;
    }

    getAttackPlayer(): PlayerI {
        let attackPlayer = null;
        this.players.forEach((player, key) => {
            if (this.stepPlayerIndex == key) {
                attackPlayer = player;
            }
        });
        if (attackPlayer === null) {
            throw Error("Error game state");
        }
        return attackPlayer;
    }

    getDefencePlayer(): PlayerI {
        let defencePlayer = null;
        this.players.forEach((player, key) => {
            if (this.stepPlayerIndex != key) {
                defencePlayer = player;
            }
        });
        if (defencePlayer === null) {
            throw Error("Error game state");
        }
        return defencePlayer;
    }

    startRound() {
        this.round++;
        this.rollsSpeed = new Map();
        this.rollsSpeedValue = new Map();
        this.stepPlayerIndex = null;
        this.rollAttack = null;
        this.rollDefence = null;
        this.damage = null;
        this.damageSet = null;
        this.rollRecovery = null;
        this.winerPlayerIndex = null;
    }

    chooseFirstPlayer() {
        this.playersRoundOrder = Array.from((new Map(Array.from(this.rollsSpeedValue).sort((a, b) => b[1] - a[1]))).keys());
        this.setStep(this.playersRoundOrder[0]);
        this.step = 1;
    }

    chooseSecondPlayer() {
        this.setStep(this.playersRoundOrder[1]);
        this.step = 2;
    }

    isFirstPlayerAction() {
        return this.step == 1;
    }

    isSecondPlayerAction() {
        return this.step == 2;
    }

    private setStep(playerKey) {
        this.stepPlayerIndex = playerKey;
        this.rollAttack = null;
        this.rollDefence = null;
        this.damage = null;
        this.damageSet = null;
    }

    addSpeedRoll(playerId) {
        this.players.forEach((playerFromContext, index) => {
            if (playerId === index) {
                const roll = playerFromContext.rollSpeed();
                this.rollsSpeed.set(index, roll);
                let speedValue = roll.reduce((sum, current) => {
                    return sum + current;
                }, 0);
                this.rollsSpeedValue.set(index, speedValue);
            }
        });
    }

    addAttackRoll(playerId: string) {
        if (this.players.get(playerId) === this.getAttackPlayer()) {
            this.rollAttack = this.getAttackPlayer().rollAttack();
        }
    }

    addDefenceRoll(playerId: string) {
        if (this.players.get(playerId) === this.getDefencePlayer()) {
            this.rollDefence = this.getDefencePlayer().rollDefence();
        }
    }

    addRecoveryRoll(playerId: string) {
        if (this.getLooserPlayer() === this.players.get(playerId)) {
            this.rollRecovery = this.players.get(playerId).rollRecovery();
        }
    }

    addDamageSet(damageSet, playerId) {
        if (this.getDefencePlayer() === this.players.get(playerId)) {
            // @todo проверить валидность
            this.damageSet = damageSet;
        }
    }

    resetSpeedRoll() {
        this.rollsSpeed = new Map();
        this.rollsSpeedValue = new Map();
    }

    resetRecoveryRoll() {
        this.rollRecovery = null;
    }

    calculateDamage(): void {
        this.rollAttack.sort((a: number, b: number) => b - a);
        this.rollDefence.sort((a: number, b: number) => b - a);
        let damage = 0;
        for (let index = 0; index < this.rollAttack.length; index++) {
            if (this.rollDefence[index] === undefined && this.rollAttack[index] > 2) {
                damage++;
            } else if (this.rollAttack[index] > this.rollDefence[index]) {
                damage++;
            }
        }
        this.damage = damage;
    }

    takeDamage() {
        this.getDefencePlayer().takeDamage(this.damageSet);
    }

    changeWiner() {
        this.players.forEach((player, key) => {
            if (player.getHits() > 2) {
                this.winerPlayerIndex = key;
                player.isWin = true;
            }
        });
    }

    getLooserPlayer(): PlayerI {
        let result = null;
        this.players.forEach((player, key) => {
            if (player.getHits() < 3) {
                result = player;
            }
        });
        return result;
    }

    sendState(playerId: string) {
        return {
            state: this.state.name,
            players: this.players,
            player: this.players ? this.players.get(playerId) : null,
            round: this.round,
            step: this.step,
            rollsSpeed: this.rollsSpeed ? this.rollsSpeed.get(playerId) : undefined,
            rollsSpeedValue: this.rollsSpeedValue ? this.rollsSpeedValue.get(playerId) : undefined,
            stepPlayerIndex: this.stepPlayerIndex,
            winerPlayerIndex: this.winerPlayerIndex,
            rollAttack: this.rollAttack,
            rollDefence: this.rollDefence,
            damage: this.damage,
            damageSet: this.damageSet,
            rollRecovery: this.rollRecovery,
        };
    }
}

export class GameHandler
{
    context: GameContext;
    dice: Dice;
    firstPlayerAdded = false;
    secondPlayerAdded = false;
    alarmExit = false;
    delay = 1000;

    constructor(emitCallback) {
        this.dice = new Dice(1,6);
        this.context = new GameContext(emitCallback, this.dice);
    }

    run() {
        if (!this.firstPlayerAdded) {
            console.warn("назначьте первого игрока")
            return
        }
        if (!this.secondPlayerAdded) {
            console.warn("назначьте второго игрока")
            return
        }
        let self = this;
        setTimeout(function cycle() {
            if (self.alarmExit) {
                console.warn("выход по прерыванию...");
                return;
            }
            if (self.context.state.name == EndGame.NAME) {
                return self;
            }
            // console.log('listen...');
            self.context.state.next();
            setTimeout(cycle, self.delay)
        }, self.delay)
        // подписаться на выключение через кнопку
    }

    endGame() {

    }

    addPlayer(key: any, isManual: boolean, hero: Hero): void {
        if (this.firstPlayerAdded && this.secondPlayerAdded) {
            console.warn("Команда для игры набрана");
            return;
        }

        let player = this.playerFactory(isManual, hero, this.dice);
        if (!this.firstPlayerAdded) {
            this.context.players.set(key, player);
            this.firstPlayerAdded = true;
        } else if (!this.secondPlayerAdded) {
            this.context.players.set(key, player);
            this.secondPlayerAdded = true;
            console.info("Команда для игры набрана");
            this.run();
        }
    }

    playerFactory(isManual: boolean, hero: Hero, dice: Dice) {
        return new Player(hero, dice);
    }

    handlePlayerEvent(event) {
        console.log('fromPlayerEvent: ', event);
        this.context.state.handle(event);
        console.log(this.context);
    }
}
