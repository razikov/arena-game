"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameHandler = exports.PlayerAI = void 0;
var rxjs_1 = require("rxjs");
var lodash_1 = require("lodash");
var Player = /** @class */ (function () {
    function Player(hero, dice) {
        if (dice === void 0) { dice = new Dice(1, 6); }
        this.hero = hero;
        this.currentAttack = hero.attackDice;
        this.currentDefence = hero.defenceDice;
        this.currentSpeed = hero.speedDice;
        this.isDie = false;
        this.isWin = false;
        this.needRecovery = 0;
        this.dice = dice;
        this.onRolledDice$ = new rxjs_1.BehaviorSubject(null);
        this.lastEvent = '';
    }
    Player.prototype.setLastEvent = function (event) {
        this.lastEvent = event;
    };
    Player.prototype.getEventEmiter = function () {
        return this.onRolledDice$;
    };
    Player.prototype.rollAttack = function () {
        this.onRolledDice$.next({
            name: 'rolledAttack',
            roll: this.roll(this.dice, this.currentAttack),
            player: this
        });
    };
    Player.prototype.rollDefence = function () {
        this.onRolledDice$.next({
            name: 'rolledDefence',
            roll: this.roll(this.dice, this.currentDefence),
            player: this
        });
    };
    Player.prototype.rollSpeed = function () {
        this.onRolledDice$.next({
            name: 'rolledSpeed',
            roll: this.roll(this.dice, this.currentSpeed),
            player: this
        });
    };
    Player.prototype.rollRecovery = function () {
        this.onRolledDice$.next({
            name: 'rolledRecovery',
            roll: this.roll(this.dice),
            player: this
        });
    };
    Player.prototype.recovery = function (roll) {
        var value = roll.reduce(function (sum, current) {
            return sum + current;
        }, 0);
        if (value >= 5) {
            this.needRecovery--;
        }
        else if (value <= 2) {
            this.isDie = true;
        }
        return this;
    };
    Player.prototype.chooseDamageSet = function (damage) {
        var damageSet = this.generateDamageSet(damage);
        if (damageSet == []) {
            throw new Error("empty damage set: d=" + damage + " ds=" + damageSet);
        }
        this.onRolledDice$.next({
            name: 'choosedDamageSet',
            damageSet: damageSet,
            player: this
        });
    };
    Player.prototype.generateDamageSet = function (damage) {
        // TODO: добавить решаюшее дерево для AI
        var takeDamage = [];
        if (damage > this.getHits()) {
            damage = this.getHits();
        }
        var currentDices = [this.currentAttack, this.currentDefence, this.currentSpeed];
        var attrs = ['attack', 'defence', 'speed'];
        while (damage > 0) {
            var sum = currentDices.reduce(function (sum, current) {
                return sum + current;
            }, 0);
            while (true) {
                var rand = Math.floor(Math.random() * 3);
                var canLost = this.canLostDiceRule(currentDices[rand], sum);
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
    };
    Player.prototype.isNeedRecovery = function () {
        return !this.isDie && this.needRecovery !== 0;
    };
    Player.prototype.roll = function (dice, count) {
        if (count === void 0) { count = 1; }
        var roll = [];
        for (var index = 0; index < count; index++) {
            roll.push(dice.roll());
        }
        return roll;
    };
    Player.prototype.takeDamage = function (damageSet) {
        var _this = this;
        damageSet.forEach(function (attr) {
            switch (attr) {
                case 'attack':
                    if (_this.canLostDiceRule(_this.currentAttack, _this.getHits())) {
                        _this.currentAttack--;
                    }
                    else {
                        throw new Error("attribute " + attr + " does not lost");
                    }
                    break;
                case 'defence':
                    if (_this.canLostDiceRule(_this.currentDefence, _this.getHits())) {
                        _this.currentDefence--;
                    }
                    else {
                        throw new Error("attribute " + attr + " does not lost");
                    }
                    break;
                case 'speed':
                    if (_this.canLostDiceRule(_this.currentSpeed, _this.getHits())) {
                        _this.currentSpeed--;
                    }
                    else {
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
    };
    Player.prototype.getHits = function () {
        return this.currentAttack + this.currentDefence + this.currentSpeed;
    };
    Player.prototype.canLostDiceRule = function (current, all) {
        var isLastDice = (current == 1 && [1, 2, 3].includes(all));
        var isCanLost = current > 1;
        return isCanLost || isLastDice;
    };
    return Player;
}());
var PlayerAI = /** @class */ (function (_super) {
    __extends(PlayerAI, _super);
    function PlayerAI() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PlayerAI;
}(Player));
exports.PlayerAI = PlayerAI;
var Dice = /** @class */ (function () {
    // Максимум и минимум включаются
    function Dice(min, max) {
        this.min = min;
        this.max = max;
    }
    Dice.prototype.roll = function () {
        return Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
    };
    return Dice;
}());
var BaseState = /** @class */ (function () {
    function BaseState(context) {
        this.name = 'BaseState';
        this.context = context;
    }
    BaseState.prototype.handle = function (event) {
        console.warn("can't handle event: ", event, "; in: ", this.name);
    };
    BaseState.prototype.onChangeState = function () {
        this.context.onChangeEvent$.next((0, lodash_1.cloneDeep)(this.context));
    };
    BaseState.prototype.emit = function (event) {
        this.context.onGameEvent$.next(event);
    };
    BaseState.NAME = 'BaseState';
    return BaseState;
}());
var StartGame = /** @class */ (function (_super) {
    __extends(StartGame, _super);
    function StartGame() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'StartGame';
        return _this;
    }
    StartGame.prototype.next = function () {
        console.log('onStartGame');
        this.context.state = new StartRound(this.context);
        this.onChangeState();
        return true;
    };
    StartGame.NAME = 'StartGame';
    return StartGame;
}(BaseState));
var StartRound = /** @class */ (function (_super) {
    __extends(StartRound, _super);
    function StartRound() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'StartRound';
        return _this;
    }
    StartRound.prototype.next = function () {
        this.context.startRound();
        this.context.state = new RollSpeed(this.context);
        this.onChangeState();
        return true;
    };
    StartRound.NAME = 'StartRound';
    return StartRound;
}(BaseState));
var RollSpeed = /** @class */ (function (_super) {
    __extends(RollSpeed, _super);
    function RollSpeed() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'RollSpeed';
        return _this;
    }
    RollSpeed.prototype.next = function () {
        var _this = this;
        // TODO: как повторно испустить события на броски кубиков для игрока который кубики не кинул через время ожидания?
        // NOTE: сначало меняем состояние на случай если событие обработается раньше чем мы будем ожидать его
        this.context.resetSpeedRoll();
        this.context.state = new WaitRolledSpeed(this.context);
        this.onChangeState();
        this.context.players.forEach(function (player) {
            _this.emit({
                name: 'rollSpeed',
                player: player,
            });
        });
        return true;
    };
    RollSpeed.NAME = 'RollSpeed';
    return RollSpeed;
}(BaseState));
var WaitRolledSpeed = /** @class */ (function (_super) {
    __extends(WaitRolledSpeed, _super);
    function WaitRolledSpeed() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'WaitRolledSpeed';
        return _this;
    }
    WaitRolledSpeed.prototype.next = function () {
        if (this.context.hasRolledSpeed()) {
            this.context.state = new RolledSpeed(this.context);
            this.onChangeState();
            return true;
        }
        return false;
    };
    WaitRolledSpeed.prototype.handle = function (event) {
        if (event.name !== 'rolledSpeed') {
            console.warn(event.name + " != rolledSpeed");
            return;
        }
        else {
            this.context.addSpeedRoll(event.roll, event.player);
            this.next();
            return;
        }
    };
    WaitRolledSpeed.NAME = 'WaitRolledSpeed';
    return WaitRolledSpeed;
}(BaseState));
var RolledSpeed = /** @class */ (function (_super) {
    __extends(RolledSpeed, _super);
    function RolledSpeed() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'RolledSpeed';
        return _this;
    }
    RolledSpeed.prototype.next = function () {
        if (this.context.hasEqualRolledSpeed()) {
            this.context.state = new RollSpeed(this.context);
            this.onChangeState();
            return true;
        }
        else {
            this.context.chooseFirstPlayer();
            this.context.state = new ActionsFirstPlayer(this.context);
            this.onChangeState();
            return true;
        }
    };
    RolledSpeed.NAME = 'RolledSpeed';
    return RolledSpeed;
}(BaseState));
var ActionsFirstPlayer = /** @class */ (function (_super) {
    __extends(ActionsFirstPlayer, _super);
    function ActionsFirstPlayer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'ActionsFirstPlayer';
        return _this;
    }
    ActionsFirstPlayer.prototype.next = function () {
        this.context.initFirstStep();
        this.context.state = new WaitRolledAttackAndDefence(this.context);
        this.onChangeState();
        this.emit({
            name: 'rollAttack',
            player: this.context.getAttackPlayer(),
        });
        this.emit({
            name: 'rollDefence',
            player: this.context.getDefencePlayer(),
        });
        return true;
    };
    ActionsFirstPlayer.NAME = 'ActionsFirstPlayer';
    return ActionsFirstPlayer;
}(BaseState));
var ActionsSecondPlayer = /** @class */ (function (_super) {
    __extends(ActionsSecondPlayer, _super);
    function ActionsSecondPlayer() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'ActionsSecondPlayer';
        return _this;
    }
    ActionsSecondPlayer.prototype.next = function () {
        this.context.initSecondStep();
        this.context.state = new WaitRolledAttackAndDefence(this.context);
        this.onChangeState();
        this.emit({
            name: 'rollAttack',
            player: this.context.getAttackPlayer(),
        });
        this.emit({
            name: 'rollDefence',
            player: this.context.getDefencePlayer(),
        });
        return true;
    };
    ActionsSecondPlayer.NAME = 'ActionsSecondPlayer';
    return ActionsSecondPlayer;
}(BaseState));
var WaitRolledAttackAndDefence = /** @class */ (function (_super) {
    __extends(WaitRolledAttackAndDefence, _super);
    function WaitRolledAttackAndDefence() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'WaitRolledAttackAndDefence';
        return _this;
    }
    WaitRolledAttackAndDefence.prototype.next = function () {
        if (this.context.hasRolledAttackAndDefence()) {
            this.context.state = new RolledAttackAndDefence(this.context);
            this.onChangeState();
            return true;
        }
        return false;
    };
    WaitRolledAttackAndDefence.prototype.handle = function (event) {
        if (['rolledAttack', 'rolledDefence'].indexOf(event.name) === -1) {
            console.warn(event.name + " not in ['rolledAttack', 'rolledDefence']");
            return;
        }
        if (event.name === 'rolledAttack') {
            this.context.addAttackRoll(event.roll, event.player);
            this.onChangeState();
        }
        else if (event.name === 'rolledDefence') {
            this.context.addDefenceRoll(event.roll, event.player);
            this.onChangeState();
        }
        this.next();
    };
    WaitRolledAttackAndDefence.NAME = 'WaitRolledAttackAndDefence';
    return WaitRolledAttackAndDefence;
}(BaseState));
var RolledAttackAndDefence = /** @class */ (function (_super) {
    __extends(RolledAttackAndDefence, _super);
    function RolledAttackAndDefence() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'RolledAttackAndDefence';
        return _this;
    }
    RolledAttackAndDefence.prototype.next = function () {
        this.context.calculateDamage();
        if (this.context.damage > 0) {
            this.context.state = new ChooseDamage(this.context);
            this.onChangeState();
            return true;
        }
        else if (this.context.isFirstPlayerAction()) {
            this.context.state = new ActionsSecondPlayer(this.context);
            this.onChangeState();
            return true;
        }
        else if (this.context.isSecondPlayerAction()) {
            this.context.state = new StartRound(this.context);
            this.onChangeState();
            return true;
        }
        else {
            throw new Error("неожиданное состояние!");
        }
    };
    RolledAttackAndDefence.NAME = 'RolledAttackAndDefence';
    return RolledAttackAndDefence;
}(BaseState));
var ChooseDamage = /** @class */ (function (_super) {
    __extends(ChooseDamage, _super);
    function ChooseDamage() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'ChooseDamage';
        return _this;
    }
    ChooseDamage.prototype.next = function () {
        this.context.state = new WaitChoosedDamage(this.context);
        this.onChangeState();
        this.emit({
            name: 'chooseDamageSet',
            damage: this.context.damage,
            player: this.context.getDefencePlayer(),
        });
        return true;
    };
    ChooseDamage.NAME = 'ChooseDamage';
    return ChooseDamage;
}(BaseState));
var WaitChoosedDamage = /** @class */ (function (_super) {
    __extends(WaitChoosedDamage, _super);
    function WaitChoosedDamage() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'WaitChoosedDamage';
        return _this;
    }
    WaitChoosedDamage.prototype.next = function () {
        if (this.context.damageSet) {
            this.context.state = new ChoosedDamage(this.context);
            this.onChangeState();
            return true;
        }
        return false;
    };
    WaitChoosedDamage.prototype.handle = function (event) {
        if (event.name !== 'choosedDamageSet') {
            console.warn(event.name + " != " + 'choosedDamageSet');
            return;
        }
        else if (this.isValid(event.damageSet, event.player)) {
            this.context.addDamageSet(event.damageSet, event.player);
            this.next();
        }
    };
    WaitChoosedDamage.prototype.isValid = function (damageSet, player) {
        var isValidDamageSet = this.context.damage === damageSet.length;
        var isValidPlayer = this.context.getDefencePlayer() === player;
        return isValidDamageSet && isValidPlayer;
    };
    WaitChoosedDamage.NAME = 'WaitChoosedDamage';
    return WaitChoosedDamage;
}(BaseState));
var ChoosedDamage = /** @class */ (function (_super) {
    __extends(ChoosedDamage, _super);
    function ChoosedDamage() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'ChoosedDamage';
        return _this;
    }
    ChoosedDamage.prototype.next = function () {
        this.context.takeDamage();
        if (this.context.isEndGame()) {
            this.context.state = new ChoosedWinner(this.context);
            this.onChangeState();
            return true;
        }
        else if (this.context.isFirstPlayerAction()) {
            this.context.state = new ActionsSecondPlayer(this.context);
            this.onChangeState();
            return true;
        }
        else if (this.context.isSecondPlayerAction()) {
            this.context.state = new StartRound(this.context);
            this.onChangeState();
            return true;
        }
        else {
            throw new Error("неожиданное состояние!");
        }
    };
    ChoosedDamage.NAME = 'ChoosedDamage';
    return ChoosedDamage;
}(BaseState));
var ChoosedWinner = /** @class */ (function (_super) {
    __extends(ChoosedWinner, _super);
    function ChoosedWinner() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'ChoosedWinner';
        return _this;
    }
    ChoosedWinner.prototype.next = function () {
        this.context.changeWiner();
        if (this.context.isNeedRecovery()) {
            this.context.state = new RollRecovery(this.context);
            this.onChangeState();
            return true;
        }
        else {
            this.context.state = new EndGame(this.context);
            this.onChangeState();
            return true;
        }
    };
    ChoosedWinner.NAME = 'ChoosedWinner';
    return ChoosedWinner;
}(BaseState));
var RollRecovery = /** @class */ (function (_super) {
    __extends(RollRecovery, _super);
    function RollRecovery() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'RollRecovery';
        return _this;
    }
    RollRecovery.prototype.next = function () {
        this.context.resetRecoveryRoll();
        this.context.state = new WaitRolledRecovery(this.context);
        this.onChangeState();
        this.emit({
            name: 'rollRecovery',
            player: this.context.getLooserPlayer(),
        });
        return true;
    };
    RollRecovery.NAME = 'RollRecovery';
    return RollRecovery;
}(BaseState));
var WaitRolledRecovery = /** @class */ (function (_super) {
    __extends(WaitRolledRecovery, _super);
    function WaitRolledRecovery() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'WaitRolledRecovery';
        return _this;
    }
    WaitRolledRecovery.prototype.next = function () {
        if (this.context.rollRecovery) {
            this.context.state = new RolledRecovery(this.context);
            this.onChangeState();
            return true;
        }
    };
    WaitRolledRecovery.prototype.handle = function (event) {
        if (event.name !== 'rolledRecovery') {
            console.warn(event.name + " != " + 'rolledRecovery');
            return;
        }
        else if (this.isValid(event.roll, event.player)) {
            this.context.addRecoveryRoll(event.roll, event.player);
            this.next();
        }
    };
    WaitRolledRecovery.prototype.isValid = function (roll, player) {
        var isValidRoll = roll.length === 1 && roll[0] <= 6 && roll[0] >= 1;
        var isValidPlayer = player === this.context.getLooserPlayer();
        return isValidRoll && isValidPlayer;
    };
    WaitRolledRecovery.NAME = 'WaitRolledRecovery';
    return WaitRolledRecovery;
}(BaseState));
var RolledRecovery = /** @class */ (function (_super) {
    __extends(RolledRecovery, _super);
    function RolledRecovery() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'RolledRecovery';
        return _this;
    }
    RolledRecovery.prototype.next = function () {
        this.context.recovery();
        if (this.context.isNeedRecovery()) {
            this.context.state = new RollRecovery(this.context);
            this.onChangeState();
            return true;
        }
        else {
            this.context.state = new EndGame(this.context);
            this.onChangeState();
            return true;
        }
    };
    RolledRecovery.NAME = 'RolledRecovery';
    return RolledRecovery;
}(BaseState));
var EndGame = /** @class */ (function (_super) {
    __extends(EndGame, _super);
    function EndGame() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = 'EndGame';
        return _this;
    }
    EndGame.prototype.next = function () {
        // TODO: Разрушить событийные линии
        return false;
        console.warn('наградить!');
    };
    EndGame.NAME = 'EndGame';
    return EndGame;
}(BaseState));
var GameContext = /** @class */ (function () {
    function GameContext() {
        this.state = new StartGame(this);
        this.players = new Map();
        this.round = 0;
        this.onGameEvent$ = new rxjs_1.BehaviorSubject(null);
        this.onChangeEvent$ = new rxjs_1.BehaviorSubject(null);
    }
    GameContext.prototype.hasRolledSpeed = function () {
        return this.getFirstSpeedValue() !== undefined && this.getSecondSpeedValue() !== undefined;
    };
    GameContext.prototype.hasEqualRolledSpeed = function () {
        return this.getFirstSpeedValue() === this.getSecondSpeedValue();
    };
    GameContext.prototype.hasRolledAttackAndDefence = function () {
        return this.rollAttack !== null && this.rollDefence !== null;
    };
    GameContext.prototype.isEndGame = function () {
        return !(this.getFirstPlayer().getHits() > 2 && this.getSecondPlayer().getHits() > 2);
    };
    GameContext.prototype.isNeedRecovery = function () {
        return this.getLooserPlayer().isNeedRecovery();
    };
    GameContext.prototype.recovery = function () {
        this.getLooserPlayer().recovery(this.rollRecovery);
    };
    GameContext.prototype.setFirstPlayer = function (player) {
        if (this.players.has(GameContext.FIRST_PLAYER)) {
            console.warn("первый игрок был заменён");
        }
        this.players.set(GameContext.FIRST_PLAYER, player);
    };
    GameContext.prototype.getFirstPlayer = function () {
        return this.players.get(GameContext.FIRST_PLAYER);
    };
    GameContext.prototype.getFirstPlayerBySpeed = function () {
        return this.players.get(this.firstPlayerIndex);
    };
    GameContext.prototype.getFirstSpeedValue = function () {
        return this.rollsSpeedValue.get(GameContext.FIRST_PLAYER);
    };
    GameContext.prototype.setSecondPlayer = function (player) {
        if (this.players.has(GameContext.SECOND_PLAYER)) {
            console.warn("второй игрок был заменён");
        }
        this.players.set(GameContext.SECOND_PLAYER, player);
    };
    ;
    GameContext.prototype.getSecondPlayer = function () {
        return this.players.get(GameContext.SECOND_PLAYER);
    };
    GameContext.prototype.getSecondPlayerBySpeed = function () {
        return this.players.get(this.secondPlayerIndex);
    };
    GameContext.prototype.getSecondSpeedValue = function () {
        return this.rollsSpeedValue.get(GameContext.SECOND_PLAYER);
    };
    GameContext.prototype.getAttackPlayer = function () {
        if (this.isFirstPlayerAction()) {
            return this.getFirstPlayerBySpeed();
        }
        else {
            return this.getSecondPlayerBySpeed();
        }
    };
    GameContext.prototype.getDefencePlayer = function () {
        if (this.isFirstPlayerAction()) {
            return this.getSecondPlayerBySpeed();
        }
        else {
            return this.getFirstPlayerBySpeed();
        }
    };
    GameContext.prototype.startRound = function () {
        this.round++;
        this.rollsSpeed = new Map();
        this.rollsSpeedValue = new Map();
        this.firstPlayerIndex = null;
        this.firstPlayer = undefined;
        this.secondPlayerIndex = null;
        this.secondPlayer = undefined;
        this.stepPlayerIndex = null;
        this.rollAttack = null;
        this.rollDefence = null;
        this.damage = null;
        this.damageSet = null;
        this.rollRecovery = null;
        this.winerPlayerIndex = null;
        this.loserPlayerIndex = null;
    };
    GameContext.prototype.addSpeedRoll = function (roll, player) {
        var _this = this;
        this.players.forEach(function (playerFromContext, index) {
            if (player === playerFromContext) {
                _this.rollsSpeed.set(index, roll);
                var speedValue = roll.reduce(function (sum, current) {
                    return sum + current;
                }, 0);
                _this.rollsSpeedValue.set(index, speedValue);
            }
        });
    };
    GameContext.prototype.resetSpeedRoll = function () {
        this.rollsSpeed = new Map();
        this.rollsSpeedValue = new Map();
    };
    GameContext.prototype.resetRecoveryRoll = function () {
        this.rollRecovery = null;
    };
    GameContext.prototype.chooseFirstPlayer = function () {
        if (this.getFirstSpeedValue() >= this.getSecondSpeedValue()) {
            this.firstPlayer = (0, lodash_1.cloneDeep)(this.getFirstPlayer());
            this.firstPlayerIndex = GameContext.FIRST_PLAYER;
            this.secondPlayer = (0, lodash_1.cloneDeep)(this.getSecondPlayer());
            this.secondPlayerIndex = GameContext.SECOND_PLAYER;
        }
        else {
            this.firstPlayer = (0, lodash_1.cloneDeep)(this.getSecondPlayer());
            this.firstPlayerIndex = GameContext.SECOND_PLAYER;
            this.secondPlayer = (0, lodash_1.cloneDeep)(this.getFirstPlayer());
            this.secondPlayerIndex = GameContext.FIRST_PLAYER;
        }
    };
    GameContext.prototype.initFirstStep = function () {
        this.setStep(this.firstPlayerIndex);
    };
    GameContext.prototype.initSecondStep = function () {
        this.setStep(this.secondPlayerIndex);
    };
    GameContext.prototype.setStep = function (playerKey) {
        this.stepPlayerIndex = playerKey;
        this.rollAttack = null;
        this.rollDefence = null;
        this.damage = null;
        this.damageSet = null;
    };
    GameContext.prototype.isFirstPlayerAction = function () {
        return this.stepPlayerIndex === this.firstPlayerIndex;
    };
    GameContext.prototype.isSecondPlayerAction = function () {
        return this.stepPlayerIndex === this.secondPlayerIndex;
    };
    GameContext.prototype.addAttackRoll = function (roll, player) {
        if (player === this.getAttackPlayer()) {
            this.rollAttack = roll;
        }
    };
    GameContext.prototype.addDefenceRoll = function (roll, player) {
        if (player === this.getDefencePlayer()) {
            this.rollDefence = roll;
        }
    };
    GameContext.prototype.calculateDamage = function () {
        this.rollAttack.sort(function (a, b) { return b - a; });
        this.rollDefence.sort(function (a, b) { return b - a; });
        var damage = 0;
        for (var index = 0; index < this.rollAttack.length; index++) {
            if (this.rollDefence[index] === undefined && this.rollAttack[index] > 2) {
                damage++;
            }
            else if (this.rollAttack[index] > this.rollDefence[index]) {
                damage++;
            }
        }
        this.damage = damage;
    };
    GameContext.prototype.addDamageSet = function (damageSet, player) {
        if (this.getDefencePlayer() === player) {
            this.damageSet = damageSet;
        }
    };
    GameContext.prototype.takeDamage = function () {
        this.getDefencePlayer().takeDamage(this.damageSet);
    };
    GameContext.prototype.changeWiner = function () {
        if (this.getFirstPlayer().getHits() > 2) {
            this.winerPlayerIndex = GameContext.FIRST_PLAYER;
            this.loserPlayerIndex = GameContext.SECOND_PLAYER;
        }
        else {
            this.winerPlayerIndex = GameContext.SECOND_PLAYER;
            this.loserPlayerIndex = GameContext.FIRST_PLAYER;
        }
    };
    GameContext.prototype.getLooserPlayer = function () {
        return this.players.get(this.loserPlayerIndex);
    };
    GameContext.prototype.addRecoveryRoll = function (roll, player) {
        if (this.getLooserPlayer() === player) {
            this.rollRecovery = roll;
        }
    };
    GameContext.FIRST_PLAYER = 0;
    GameContext.SECOND_PLAYER = 1;
    return GameContext;
}());
// Правила:
//
// Бой идёт до тех пор пока один из противников не повержен (сумма кубиков больше 3)
// 0 кубиков и меньше смерть героя, 1 кубик тяжелое ранение, 2 кубика ранение.
// восстановление ранения: серия бросков d6, если выпадает 5,6 вылечен, 3,4 кидает дальше, 1,2 умер.
// сначало восстанавливается тяжелое ранение, потом обычное
//
// бой состоит из раундов.
// раунд это 2 действия, порядок не важен, оба не обязательны:
// 1) перемещение
// 2) атака (имеет радиус)
//
// -порядок хода определяется броском кубиков скорости, у кого больше тот решает кто ходит первым
//
// атака - это бросок кубиков d6 атаки против броска кубиков d6 защиты противника
// повреждения от атаки вычисляются так:
// отсортированный бросок атаки сравнивается с отсортированным броском защиты
// если атака строго больше защиты, то наносится повреждение
// если защиты нет, то повреждение добавляется если атака 3 и больше
//
// за каждое полученное повреждение игрок обязан снять один любой кубик.
// нельзя снимать последний кубик если возможно снять другие кубики.
//
// механики к рассмотрению:
// 1) Тяжелые повреждения можно либо голосованием зрителей решать, либо отдавать на предпочтение победителю
var GameHandler = /** @class */ (function () {
    function GameHandler() {
        this.firstPlayerAdded = false;
        this.secondPlayerAdded = false;
        this.alarmExit = false;
        this.delay = 2000;
        this.context = new GameContext();
        this.dice = new Dice(1, 6);
    }
    GameHandler.prototype.run = function () {
        if (!this.firstPlayerAdded) {
            console.warn("назначьте первого игрока");
            return;
        }
        if (!this.secondPlayerAdded) {
            console.warn("назначьте второго игрока");
            return;
        }
        var self = this;
        setTimeout(function cycle() {
            if (self.alarmExit) {
                console.warn("выход по прерыванию...");
                return;
            }
            if (self.context.state.name == EndGame.NAME) {
                return self;
            }
            console.log('listen...');
            self.context.state.next();
            setTimeout(cycle, self.delay);
        }, self.delay);
        // подписаться на выключение через кнопку
    };
    GameHandler.prototype.endGame = function () {
    };
    GameHandler.prototype.getOnContextEmiter = function () {
        return this.context.onChangeEvent$;
    };
    GameHandler.prototype.getOnPlayerEmiter = function () {
        return this.context.onGameEvent$;
    };
    GameHandler.prototype.addFirstPlayer = function (isManual, hero) {
        if (this.firstPlayerAdded) {
            console.warn("первый игрок уже добавлен");
            return this.context.getFirstPlayer();
        }
        var player = this.playerFactory(isManual, hero, this.dice);
        this.context.setFirstPlayer(player);
        this.firstPlayerAdded = true;
        // Подписка
        player.getEventEmiter().subscribe(this.getPlayerEventHandler());
        if (isManual) { // если игрок компьютер то подписываемся игрой на его действия
            this.getOnPlayerEmiter().subscribe(this.getGameEventHandler(player));
        }
        else {
            this.getOnPlayerEmiter().subscribe(this.getAIGameEventHandler(player));
        }
        return player;
    };
    GameHandler.prototype.addSecondPlayer = function (isManual, hero) {
        if (this.secondPlayerAdded) {
            console.warn("первый игрок уже добавлен");
            return;
        }
        var player = this.playerFactory(isManual, hero, this.dice);
        this.context.setSecondPlayer(player);
        this.secondPlayerAdded = true;
        // Подписка
        player.getEventEmiter().subscribe(this.getPlayerEventHandler());
        if (isManual) {
            this.getOnPlayerEmiter().subscribe(this.getGameEventHandler(player));
        }
        else {
            this.getOnPlayerEmiter().subscribe(this.getAIGameEventHandler(player));
        }
        return player;
    };
    GameHandler.prototype.playerFactory = function (isManual, hero, dice) {
        if (isManual) {
            return new Player(hero, dice);
        }
        else {
            return new PlayerAI(hero, dice);
        }
    };
    GameHandler.prototype.getPlayerEventHandler = function () {
        var _this = this;
        return {
            next: function (v) {
                console.log('fromPlayerEvent: ', v);
                if (v == null) { // пропустить начальное значение
                    return;
                }
                _this.context.state.handle(v);
            }
        };
    };
    GameHandler.prototype.getAIGameEventHandler = function (player) {
        return {
            next: function (v) {
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
        };
    };
    GameHandler.prototype.getGameEventHandler = function (player) {
        return {
            next: function (v) {
                if (v == null) { // пропустить начальное значение
                    return;
                }
                if (player !== v.player) {
                    return;
                }
                console.log('fromGameEvent: ', v);
                player.setLastEvent(v);
            }
        };
    };
    return GameHandler;
}());
exports.GameHandler = GameHandler;
var EventManager = /** @class */ (function () {
    function EventManager() {
        this.listeners = {};
    }
    EventManager.prototype.notify = function (event) {
        console.info("notify " + event.constructor.name);
        var eventType = event.constructor.name;
        if (typeof this.listeners[eventType] === 'undefined') {
            return;
        }
        this.listeners[eventType].forEach(function (callback) { return callback(event); });
    };
    EventManager.prototype.subscribe = function (eventType, callback) {
    };
    EventManager.prototype.unsubscribe = function (eventType, callback) {
    };
    return EventManager;
}());
function testRun(firstManual, firstChangeHero, secondManual, secondChangeHero) {
    var game = new GameHandler();
    game.addFirstPlayer(firstManual, firstChangeHero);
    game.addSecondPlayer(secondManual, secondChangeHero);
    game.getOnContextEmiter().subscribe({
        next: function (v) {
            if (v == null) {
                return;
            }
            console.log('forState: ', v.state.name, v);
        }
    });
    game.run();
}
exports.default = testRun;
